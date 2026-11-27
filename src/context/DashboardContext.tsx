import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  DashboardTab,
  UserProfile,
  DashboardTask,
  WithdrawalRecord,
  DepositRecord,
  ReferralUser,
  ActivityItem,
} from '../types';
import {
  ApiBalances,
  ApiDeposit,
  ApiFeed,
  ApiInteraction,
  ApiLedgerEntry,
  ApiNetwork,
  ApiPackageFull,
  ApiParticipantAnalytics,
  ApiSubscription,
  ApiWithdrawal,
  ApiError,
  PlaybackEventName,
  analyticsApi,
  campaignsApi,
  interactionsApi,
  packagesApi,
  paymentsApi,
  profileApi,
  rewardsApi,
} from '../lib/api';
import { useAuth } from './AuthContext';
import { REFERRAL_PREVIEW, REFERRAL_PREVIEW_BONUS } from '../data/referrals';

// Everything on the participant dashboard comes from the API (/campaigns/feed, /interactions,
// /rewards, /payments, /packages, /analytics). The server verifies tasks and credits rewards;
// this context only presents the results. The one exception is the referral programme, which has
// no backend yet and shows clearly separated preview data (src/data/referrals.ts).

/** Ads are cut at 30 s of playback, so the dashboard shows at most that as the viewing time. */
const MAX_VIEW_SECONDS = 30;

export interface StartedTask {
  interactionId: string;
  /** Seconds of real viewing the server requires before the review can be submitted. */
  requiredSeconds: number;
}

export interface SubmitResult {
  ok: boolean;
  message: string;
  reward?: number;
}

interface WalletWhitelist {
  trc20: string;
  erc20: string;
  polygon: string;
}

interface DashboardContextType {
  userProfile: UserProfile;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  isLoading: boolean;
  loadError: string | null;
  refresh: () => Promise<void>;

  availableBalance: number;
  todayEarned: number;
  pendingWithdrawal: number;
  totalReferralBonus: number;
  totalEarnedAllTime: number;
  completedToday: number;
  dailyTotalQuota: number;
  /** Average reward per task across the current feed. */
  rewardPerTask: number;
  hasActivePackage: boolean;
  /** Withdrawal terms of the active package (0 when there is none). */
  minWithdrawal: number;
  withdrawalFeeRate: number;
  dailyTrend: { day: string; tasks: number; rewards: number }[];

  tasks: DashboardTask[];
  activities: ActivityItem[];
  withdrawals: WithdrawalRecord[];
  deposits: DepositRecord[];
  /** Latest deposit still waiting for payment or confirmations, if any. */
  pendingDeposit: ApiDeposit | null;
  packages: ApiPackageFull[];
  /** True when the API runs in development, where deposits can be simulated. */
  canSimulateDeposits: boolean;

  referrals: ReferralUser[];
  referralCode: string;
  referralLink: string;

  startTask: (taskId: string) => Promise<StartedTask>;
  sendPlaybackEvents: (interactionId: string, events: { type: PlaybackEventName; position: number }[]) => Promise<void>;
  submitTask: (interactionId: string, rating: number, answer: string, feedback?: string) => Promise<SubmitResult>;
  requestWithdrawal: (amount: number, network: ApiNetwork, address: string) => Promise<{ success: boolean; message: string }>;
  createDeposit: (packageId: string, network: ApiNetwork) => Promise<ApiDeposit>;
  simulateDeposit: (deposit: ApiDeposit) => Promise<void>;
  updateUserProfile: (profile: { name: string }) => Promise<void>;
  updateWalletWhitelist: (wallets: Partial<WalletWhitelist>) => void;
  notification: string | null;
  setNotification: (msg: string | null) => void;
}

const DASHBOARD_TABS: DashboardTab[] = ['overview', 'tasks', 'deposits-withdrawals', 'activities', 'network', 'settings'];

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const num = (v: string | number | null | undefined) => Number(v ?? 0);
const money = (n: number) => `$${Math.abs(n).toFixed(2)}`;
const signed = (n: number) => `${n < 0 ? '-' : '+'}${money(n)}`;
const errText = (e: unknown, fallback = 'Something went wrong.') => (e instanceof ApiError ? e.message : fallback);

export const relativeTime = (iso: string): string => {
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'Just now';
  if (secs < 3600) return `${Math.floor(secs / 60)} mins ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} hours ago`;
  if (secs < 7 * 86400) return `${Math.floor(secs / 86400)} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const fullTime = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const kycLabel = (status: string) =>
  ({ verified: 'Verified', pending: 'Verification pending', rejected: 'Verification rejected', none: 'Not verified' })[status] ?? status;

const whitelistKey = (userId: string) => `attentia_wallets_${userId}`;
const EMPTY_WHITELIST: WalletWhitelist = { trc20: '', erc20: '', polygon: '' };

const loadWhitelist = (userId: string): WalletWhitelist => {
  try {
    return { ...EMPTY_WHITELIST, ...JSON.parse(localStorage.getItem(whitelistKey(userId)) ?? '{}') };
  } catch {
    return EMPTY_WHITELIST;
  }
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, setUser } = useAuth();

  // The active tab lives in the URL (/dashboard/:tab) so it survives reloads and supports deep links.
  const location = useLocation();
  const navigate = useNavigate();
  const tabFromPath = location.pathname.split('/')[2] as DashboardTab | undefined;
  const activeTab: DashboardTab = tabFromPath && DASHBOARD_TABS.includes(tabFromPath) ? tabFromPath : 'overview';
  const setActiveTab = (tab: DashboardTab) => navigate(tab === 'overview' ? '/dashboard' : `/dashboard/${tab}`);

  const [feed, setFeed] = useState<ApiFeed | null>(null);
  const [balances, setBalances] = useState<ApiBalances | null>(null);
  const [ledger, setLedger] = useState<ApiLedgerEntry[]>([]);
  const [interactions, setInteractions] = useState<ApiInteraction[]>([]);
  const [apiDeposits, setApiDeposits] = useState<ApiDeposit[]>([]);
  const [apiWithdrawals, setApiWithdrawals] = useState<ApiWithdrawal[]>([]);
  const [packages, setPackages] = useState<ApiPackageFull[]>([]);
  const [subscription, setSubscription] = useState<ApiSubscription | null>(null);
  const [analytics, setAnalytics] = useState<ApiParticipantAnalytics | null>(null);
  const [canSimulateDeposits, setCanSimulate] = useState(false);
  const [wallets, setWallets] = useState<WalletWhitelist>(EMPTY_WHITELIST);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Automatically dismiss notification after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const refresh = useCallback(async () => {
    const results = await Promise.allSettled([
      campaignsApi.feed().then(setFeed),
      rewardsApi.balances().then(setBalances),
      rewardsApi.ledger().then(setLedger),
      interactionsApi.list().then(setInteractions),
      paymentsApi.deposits().then(setApiDeposits),
      paymentsApi.withdrawals().then(setApiWithdrawals),
      packagesApi.list().then(setPackages),
      packagesApi.subscription().then(setSubscription),
      analyticsApi.me().then(setAnalytics),
    ]);
    const failed = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
    setLoadError(failed ? errText(failed.reason, 'Could not load some dashboard data.') : null);
  }, []);

  // Load on sign-in, clear on sign-out.
  const userId = user?.id;
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setFeed(null);
      setBalances(null);
      setLedger([]);
      setInteractions([]);
      setApiDeposits([]);
      setApiWithdrawals([]);
      setSubscription(null);
      setAnalytics(null);
      return;
    }
    setWallets(loadWhitelist(userId));
    setIsLoading(true);
    refresh().finally(() => setIsLoading(false));
    profileApi
      .health()
      .then((h) => setCanSimulate(h.environment === 'development'))
      .catch(() => setCanSimulate(false));
  }, [isAuthenticated, userId, refresh]);

  const userProfile: UserProfile = useMemo(
    () => ({
      name: user?.full_name || user?.username || '',
      email: user?.email ?? '',
      accountId: user ? user.id.slice(0, 8).toUpperCase() : '',
      tier: subscription?.package.code ?? 'none',
      memberSince: user ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : '',
      kycLevel: kycLabel(user?.kyc_status ?? 'none'),
      twoFactorEnabled: !!user?.two_factor_enabled,
      walletWhitelist: wallets,
    }),
    [user, subscription, wallets],
  );

  // Campaigns the participant already attempted today but that were not verified.
  const rejectedToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return new Set(
      interactions.filter((i) => i.status === 'rejected' && i.started_at.slice(0, 10) === today).map((i) => i.campaign_id),
    );
  }, [interactions]);

  const tasks: DashboardTask[] = useMemo(
    () =>
      (feed?.items ?? []).map((i) => ({
        id: i.id,
        title: i.name,
        sponsor: i.brand,
        category: i.category,
        reward: num(i.reward),
        durationSeconds: Math.min(Math.round(i.duration_seconds ?? MAX_VIEW_SECONDS), MAX_VIEW_SECONDS),
        description: i.description,
        mediaUrl: i.media_url ?? undefined,
        youtubeId: i.youtube_id ?? undefined,
        ratingPrompt: i.rating_prompt,
        question: i.question,
        options: i.options,
        status: i.completed_today ? (rejectedToday.has(i.id) ? 'rejected' : 'completed') : 'available',
        isDemo: i.is_demo,
        requiresFeedback: i.requires_feedback,
      })),
    [feed, rejectedToday],
  );

  const withdrawals: WithdrawalRecord[] = useMemo(
    () =>
      apiWithdrawals.map((w) => ({
        id: w.id.slice(0, 8).toUpperCase(),
        amount: num(w.amount),
        fee: num(w.fee),
        netAmount: num(w.net_amount),
        network: w.network,
        address: w.address,
        requestedAt: fullTime(w.created_at),
        status: w.status === 'requested' ? 'verifying' : w.status,
        txHash: w.tx_hash ?? undefined,
        rejectionReason: w.rejection_reason ?? undefined,
        explorerUrl: w.explorer_url ?? undefined,
      })),
    [apiWithdrawals],
  );

  const deposits: DepositRecord[] = useMemo(
    () =>
      apiDeposits.map((d) => ({
        id: d.id.slice(0, 8).toUpperCase(),
        amount: num(d.received_amount ?? d.expected_amount),
        network: d.network,
        address: d.address,
        txHash: d.tx_hash ?? '',
        timestamp: fullTime(d.confirmed_at ?? d.created_at),
        status: d.status === 'awaiting_payment' ? 'awaiting payment' : d.status,
        explorerUrl: d.explorer_url ?? undefined,
      })),
    [apiDeposits],
  );

  const pendingDeposit = useMemo(
    () =>
      apiDeposits.find(
        (d) => (d.status === 'awaiting_payment' || d.status === 'pending') && new Date(d.expires_at).getTime() > Date.now(),
      ) ?? null,
    [apiDeposits],
  );

  // Statement built from the append-only ledger (grouped per transaction) plus rejected tasks.
  const activities: ActivityItem[] = useMemo(() => {
    const wById = new Map<string, ApiWithdrawal>(apiWithdrawals.map((w) => [w.id, w]));
    const groups = new Map<string, ApiLedgerEntry[]>();
    ledger.forEach((e) => groups.set(e.transaction_id, [...(groups.get(e.transaction_id) ?? []), e]));
    const out: ActivityItem[] = [];

    groups.forEach((legs, txn) => {
      const first = legs[0];
      const sumOf = (account: string) => legs.filter((l) => l.account === account).reduce((s, l) => s + num(l.amount), 0);
      const base = { id: txn, time: relativeTime(first.created_at), at: first.created_at, details: first.description ?? undefined };
      switch (first.entry_type) {
        case 'reward':
          out.push({ ...base, title: first.description || 'Verified sponsor engagement', amount: signed(sumOf('rewards')), type: 'ad', status: 'completed' });
          break;
        case 'deposit':
          out.push({ ...base, title: 'Deposit received', amount: signed(sumOf('deposits')), type: 'deposit', status: 'completed' });
          break;
        case 'package_purchase':
          break; // internal re-allocation of the deposit; shown as part of the deposit
        case 'withdrawal_request': {
          const w = wById.get(first.reference_id);
          out.push({
            ...base,
            title: `Withdrawal request #${first.reference_id.slice(0, 8).toUpperCase()}`,
            amount: signed(-Math.abs(sumOf('pending_withdrawal'))),
            type: 'withdrawal',
            status: w?.status === 'completed' ? 'completed' : w?.status === 'rejected' ? 'failed' : 'processing',
            txHash: w?.tx_hash ?? undefined,
            details: w?.status === 'rejected' ? `Rejected: ${w.rejection_reason}` : w?.status === 'completed' ? 'Paid out' : 'Awaiting admin review.',
          });
          break;
        }
        case 'withdrawal_reversal':
          out.push({ ...base, title: 'Withdrawal returned to balance', amount: signed(sumOf('rewards')), type: 'withdrawal', status: 'completed' });
          break;
        case 'adjustment': {
          const amt = sumOf('rewards');
          out.push({ ...base, title: 'Balance adjustment', amount: signed(amt), type: amt < 0 ? 'withdrawal' : 'deposit', status: 'completed' });
          break;
        }
        default:
          break; // withdrawal_complete is reflected on the request above
      }
    });

    interactions
      .filter((i) => i.status === 'rejected' && i.submitted_at)
      .forEach((i) =>
        out.push({
          id: i.id,
          title: 'Task not verified',
          time: relativeTime(i.submitted_at!),
          at: i.submitted_at!,
          amount: '$0.00',
          type: 'ad',
          status: 'failed',
          details: i.rejection_reason ?? undefined,
        }),
      );

    return out.sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''));
  }, [ledger, apiWithdrawals, interactions]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayEarned = interactions
    .filter((i) => i.status === 'verified' && (i.verified_at ?? '').slice(0, 10) === todayIso)
    .reduce((s, i) => s + num(i.reward_amount), 0);

  const rewardPerTask = tasks.length ? tasks.reduce((s, t) => s + t.reward, 0) / tasks.length : 0;

  // ---- Task flow: start -> playback events -> submit (all verified by the server) ---------

  const startTask = useCallback(async (taskId: string): Promise<StartedTask> => {
    const it = await interactionsApi.start(taskId);
    return { interactionId: it.id, requiredSeconds: it.required_seconds };
  }, []);

  const sendPlaybackEvents = useCallback(
    async (interactionId: string, events: { type: PlaybackEventName; position: number }[]) => {
      if (!events.length) return;
      try {
        await interactionsApi.events(interactionId, events);
      } catch {
        // A dropped batch only costs watched time; the server decides at submit time.
      }
    },
    [],
  );

  const submitTask = useCallback(
    async (interactionId: string, rating: number, answer: string, feedback?: string): Promise<SubmitResult> => {
      try {
        const it = await interactionsApi.submit(interactionId, { rating, answer, feedback: feedback || undefined });
        await refresh();
        if (it.status === 'verified') {
          const reward = num(it.reward_amount);
          setNotification(`Task verified! +${money(reward)} credited to your available balance.`);
          return { ok: true, message: 'Verified', reward };
        }
        return { ok: false, message: it.rejection_reason ?? 'The task could not be verified.' };
      } catch (e) {
        await refresh();
        return { ok: false, message: errText(e, 'Could not submit the task.') };
      }
    },
    [refresh],
  );

  const requestWithdrawal = useCallback(
    async (amount: number, network: ApiNetwork, address: string) => {
      try {
        const w = await paymentsApi.requestWithdrawal(amount.toFixed(2), network, address.trim());
        await refresh();
        setNotification(`Withdrawal of ${money(num(w.amount))} requested. An admin will review it.`);
        return { success: true, message: 'Withdrawal requested successfully.' };
      } catch (e) {
        return { success: false, message: errText(e, 'Could not request the withdrawal.') };
      }
    },
    [refresh],
  );

  const createDeposit = useCallback(
    async (packageId: string, network: ApiNetwork) => {
      const d = await paymentsApi.createDeposit(packageId, network);
      await refresh();
      return d;
    },
    [refresh],
  );

  const simulateDeposit = useCallback(
    async (deposit: ApiDeposit) => {
      await paymentsApi.simulateDeposit(deposit.id, deposit.expected_amount);
      await refresh();
      setNotification('Simulated transfer recorded. Confirmations are counted by the server.');
    },
    [refresh],
  );

  const updateUserProfile = useCallback(
    async ({ name }: { name: string }) => {
      try {
        setUser(await profileApi.update({ full_name: name }));
        setNotification('Profile details updated successfully.');
      } catch (e) {
        setNotification(errText(e, 'Could not update your profile.'));
      }
    },
    [setUser],
  );

  const updateWalletWhitelist = useCallback(
    (next: Partial<WalletWhitelist>) => {
      setWallets((prev) => {
        const merged = { ...prev, ...next };
        try {
          if (userId) localStorage.setItem(whitelistKey(userId), JSON.stringify(merged));
        } catch {
          // storage unavailable: the addresses last for this page only
        }
        return merged;
      });
      setNotification('Payout wallet addresses saved on this device.');
    },
    [userId],
  );

  const referralCode = user ? `${user.username.toUpperCase()}-${user.id.slice(0, 4).toUpperCase()}` : '';
  const referralLink = referralCode ? `${window.location.origin}/?ref=${referralCode}` : '';

  const value: DashboardContextType = {
    userProfile,
    activeTab,
    setActiveTab,
    isLoading,
    loadError,
    refresh,
    availableBalance: num(balances?.available),
    todayEarned,
    pendingWithdrawal: num(balances?.pending_withdrawal),
    totalReferralBonus: REFERRAL_PREVIEW_BONUS,
    totalEarnedAllTime: num(balances?.total_earned),
    completedToday: feed?.completed_today ?? 0,
    dailyTotalQuota: feed?.daily_quota ?? 0,
    rewardPerTask,
    hasActivePackage: !!subscription,
    minWithdrawal: num(subscription?.package.min_withdrawal),
    withdrawalFeeRate: num(subscription?.package.withdrawal_fee_pct),
    dailyTrend: analytics?.daily ?? [],
    tasks,
    activities,
    withdrawals,
    deposits,
    pendingDeposit,
    packages,
    canSimulateDeposits,
    referrals: REFERRAL_PREVIEW,
    referralCode,
    referralLink,
    startTask,
    sendPlaybackEvents,
    submitTask,
    requestWithdrawal,
    createDeposit,
    simulateDeposit,
    updateUserProfile,
    updateWalletWhitelist,
    notification,
    setNotification,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
