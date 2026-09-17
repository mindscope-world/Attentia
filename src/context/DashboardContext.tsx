import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  DashboardTab, 
  UserProfile, 
  DashboardTask, 
  WithdrawalRecord, 
  DepositRecord, 
  ReferralUser, 
  ActivityItem 
} from '../types';

interface DashboardContextType {
  userProfile: UserProfile;
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  availableBalance: number;
  todayEarned: number;
  pendingWithdrawal: number;
  totalReferralBonus: number;
  totalEarnedAllTime: number;
  completedToday: number;
  dailyTotalQuota: number;
  rewardPerTask: number;
  tasks: DashboardTask[];
  activities: ActivityItem[];
  withdrawals: WithdrawalRecord[];
  deposits: DepositRecord[];
  referrals: ReferralUser[];
  referralCode: string;
  referralLink: string;
  completeTask: (taskId: string, rating: number, answer: string) => boolean;
  requestWithdrawal: (amount: number, network: 'TRC-20' | 'ERC-20' | 'POLYGON', address: string) => { success: boolean; message: string };
  submitDeposit: (amount: number, network: 'TRC-20' | 'ERC-20' | 'POLYGON', targetTier?: 'starter' | 'growth' | 'pro') => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateWalletWhitelist: (wallets: { trc20?: string; erc20?: string; polygon?: string }) => void;
  toggle2FA: () => void;
  notification: string | null;
  setNotification: (msg: string | null) => void;
}

const INITIAL_PROFILE: UserProfile = {
  name: 'Paul M.',
  email: 'paulmwaura254@gmail.com',
  accountId: 'BF-88921',
  tier: 'growth',
  memberSince: 'March 2026',
  kycLevel: 'Tier 2 (Verified)',
  twoFactorEnabled: true,
  walletWhitelist: {
    trc20: 'TPyM8c7h4aL89QhZk2u8vX5yNmW0eR1t3p',
    erc20: '0x7A4b9e28D5b4C17983FcAf86c7104d4D8A92F4c8',
    polygon: '0x3D88f219Cb0e14a7904EcB589d1b64c010A56E21',
  },
};

const INITIAL_TASKS: DashboardTask[] = [
  {
    id: 'task-01',
    title: 'Apex Global — Cross-Border Stablecoin Settlement',
    sponsor: 'Apex Protocol',
    category: 'Video Engagement',
    reward: 0.50,
    durationSeconds: 15,
    description: 'Evaluate the 15-second sponsor spotlight for Apex Protocol zero-slippage FX conversion.',
    ratingPrompt: 'How clear was the zero-slippage fee value proposition?',
    question: 'Which network feature was highlighted in the creative?',
    options: ['Sub-second settlement on TRON & Polygon', 'Decentralized Proof-of-Work mining', 'Manual banking wire transfers'],
    status: 'available',
  },
  {
    id: 'task-02',
    title: 'Nova AI Design — Generative Creative Engine',
    sponsor: 'Nova Tech',
    category: 'App Review',
    reward: 0.50,
    durationSeconds: 12,
    description: 'Review the UI interface snapshot and evaluate typography readability and color contrast.',
    ratingPrompt: 'How visually appealing was the UI demonstration?',
    question: 'What is the primary product use case demonstrated?',
    options: ['Automated marketing campaign visuals', 'Cryptocurrency cloud mining', 'Stock day trading simulator'],
    status: 'available',
  },
  {
    id: 'task-03',
    title: 'Vanguard Custody — Institutional Vault Security',
    sponsor: 'Vanguard Web3',
    category: 'Product Poll',
    reward: 0.50,
    durationSeconds: 10,
    description: 'Vote on security priorities for institutional digital asset cold-storage custody.',
    ratingPrompt: 'How trustworthy does the multi-sig institutional model appear?',
    question: 'What key security feature would encourage enterprise onboarding?',
    options: ['3-of-5 Multi-Sig with Hardware Key requirements', 'Single private key stored on hot browser wallet', 'SMS-only verification'],
    status: 'available',
  },
  {
    id: 'task-04',
    title: 'Aura Eco-System — Carbon Offset Tokenomics',
    sponsor: 'Aura Green',
    category: 'Brand Survey',
    reward: 0.50,
    durationSeconds: 12,
    description: 'Answer brief consumer sentiment survey regarding decentralized carbon credits.',
    ratingPrompt: 'How relevant is ESG carbon-tracking to your Web3 interests?',
    question: 'What factor matters most in carbon offset certification?',
    options: ['Auditable on-chain satellite verification', 'Unverifiable press releases', 'Celebrity endorsement tweets'],
    status: 'available',
  },
  {
    id: 'task-05',
    title: 'Lumina DeFi — Automated Liquidity Optimizer',
    sponsor: 'Lumina Labs',
    category: 'Video Engagement',
    reward: 0.50,
    durationSeconds: 15,
    description: 'Watch the product explainer on automated yield rebalancing across dollar stablecoins.',
    ratingPrompt: 'How easy was the automated rebalancing explanation to understand?',
    question: 'What primary risk mitigation does Lumina emphasize?',
    options: ['Smart contract formal verification & dual audits', 'No stop-loss protection', 'High leverage borrowing'],
    status: 'available',
  },
  {
    id: 'task-06',
    title: 'Pulse Wallet — Keyless Social Recovery',
    sponsor: 'Pulse Safe',
    category: 'Product Poll',
    reward: 0.50,
    durationSeconds: 10,
    description: 'Provide feedback on account abstraction and social guardian recovery workflows.',
    ratingPrompt: 'Would you prefer social recovery over traditional 24-word seed phrases?',
    question: 'What is the greatest friction in Web3 wallet setup?',
    options: ['Complex seed phrase storage & loss fear', 'Free instant gas sponsorship', 'Fast biometric FaceID login'],
    status: 'available',
  },
];

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-01',
    title: 'Apex Protocol Sponsor Task #24 Verified',
    time: '8 mins ago',
    amount: '+$0.50',
    type: 'ad',
    status: 'completed',
    details: 'Video engagement & comprehension check approved.',
  },
  {
    id: 'act-02',
    title: 'Level 1 Referral Bonus (Elena R. Task Batch)',
    time: '2 hours ago',
    amount: '+$1.60',
    type: 'referral',
    status: 'completed',
    details: '8% direct sponsor activity commission.',
  },
  {
    id: 'act-03',
    title: 'Withdrawal Request #WTH-99428',
    time: '4 hours ago',
    amount: '-$35.00',
    type: 'withdrawal',
    status: 'processing',
    txHash: '0x8b3e...941c',
    details: 'Automated anti-fraud verification in progress.',
  },
  {
    id: 'act-04',
    title: 'Nova Tech Creative Review #23 Verified',
    time: '5 hours ago',
    amount: '+$0.50',
    type: 'ad',
    status: 'completed',
    details: 'App UI review credited.',
  },
  {
    id: 'act-05',
    title: 'Level 2 Referral Bonus (Team Member Task Quota)',
    time: '1 day ago',
    amount: '+$0.80',
    type: 'referral',
    status: 'completed',
    details: '4% second-tier network override.',
  },
  {
    id: 'act-06',
    title: 'Deposit Confirmed (USDT TRC-20)',
    time: '3 days ago',
    amount: '+$100.00',
    type: 'deposit',
    status: 'completed',
    txHash: 'f48c1e28...9a0b3f',
    details: 'Growth Package activated (30 tasks/day quota).',
  },
  {
    id: 'act-07',
    title: 'Withdrawal Completed #WTH-98104',
    time: '6 days ago',
    amount: '-$65.00',
    type: 'withdrawal',
    status: 'completed',
    txHash: 'e71b29fa...8d4310',
    details: 'Dispatched to TRC-20 wallet (TX verified on-chain).',
  },
];

const INITIAL_WITHDRAWALS: WithdrawalRecord[] = [
  {
    id: 'WTH-99428',
    amount: 35.00,
    fee: 0.53,
    netAmount: 34.47,
    network: 'TRC-20',
    address: 'TPyM8c7h4aL89QhZk2u8vX5yNmW0eR1t3p',
    requestedAt: 'Today, 04:12 UTC',
    status: 'verifying',
    txHash: 'Pending Dispatch',
  },
  {
    id: 'WTH-98104',
    amount: 65.00,
    fee: 0.98,
    netAmount: 64.02,
    network: 'TRC-20',
    address: 'TPyM8c7h4aL89QhZk2u8vX5yNmW0eR1t3p',
    requestedAt: 'Sep 11, 2026 14:22 UTC',
    status: 'completed',
    txHash: 'e71b29fa03db5c8913b8e719ad6291a84f392b',
  },
  {
    id: 'WTH-96531',
    amount: 80.00,
    fee: 1.20,
    netAmount: 78.80,
    network: 'POLYGON',
    address: '0x3D88f219Cb0e14a7904EcB589d1b64c010A56E21',
    requestedAt: 'Aug 29, 2026 09:15 UTC',
    status: 'completed',
    txHash: '0x3ca9812bf087e5b22416a928ef05b4c17983fcaf',
  },
];

const INITIAL_DEPOSITS: DepositRecord[] = [
  {
    id: 'DEP-44912',
    amount: 100.00,
    network: 'TRC-20',
    address: 'TPyM8c7h4aL89QhZk2u8vX5yNmW0eR1t3p',
    txHash: 'f48c1e289da017bca891104e12f9b88e1a89b0',
    timestamp: 'Sep 14, 2026 11:30 UTC',
    status: 'confirmed',
    tierUpgradedTo: 'growth',
  },
  {
    id: 'DEP-32014',
    amount: 25.00,
    network: 'TRC-20',
    address: 'TPyM8c7h4aL89QhZk2u8vX5yNmW0eR1t3p',
    txHash: 'a12f94b8e219087c53bbaf0914c81a942b083c',
    timestamp: 'Aug 10, 2026 08:44 UTC',
    status: 'confirmed',
    tierUpgradedTo: 'starter',
  },
];

const INITIAL_REFERRALS: ReferralUser[] = [
  {
    id: 'ref-1',
    username: 'elena_cryptoview',
    level: 1,
    joinedDate: 'Sep 02, 2026',
    tier: 'Growth',
    tasksCompletedToday: 26,
    commissionGenerated: 24.80,
    status: 'active',
  },
  {
    id: 'ref-2',
    username: 'marcus_alpha_node',
    level: 1,
    joinedDate: 'Sep 05, 2026',
    tier: 'Pro',
    tasksCompletedToday: 55,
    commissionGenerated: 42.10,
    status: 'active',
  },
  {
    id: 'ref-3',
    username: 'david_defi_hunter',
    level: 1,
    joinedDate: 'Sep 09, 2026',
    tier: 'Starter',
    tasksCompletedToday: 12,
    commissionGenerated: 6.40,
    status: 'active',
  },
  {
    id: 'ref-4',
    username: 'sarah_web3_design',
    level: 2,
    joinedDate: 'Sep 11, 2026',
    tier: 'Growth',
    tasksCompletedToday: 20,
    commissionGenerated: 9.60,
    status: 'active',
  },
  {
    id: 'ref-5',
    username: 'alex_trader_99',
    level: 2,
    joinedDate: 'Sep 12, 2026',
    tier: 'Starter',
    tasksCompletedToday: 10,
    commissionGenerated: 3.20,
    status: 'active',
  },
  {
    id: 'ref-6',
    username: 'kevin_quant_node',
    level: 3,
    joinedDate: 'Sep 15, 2026',
    tier: 'Growth',
    tasksCompletedToday: 18,
    commissionGenerated: 2.30,
    status: 'active',
  },
];

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  const [availableBalance, setAvailableBalance] = useState<number>(245.80);
  const [todayEarned, setTodayEarned] = useState<number>(12.50);
  const [pendingWithdrawal, setPendingWithdrawal] = useState<number>(35.00);
  const [totalReferralBonus, setTotalReferralBonus] = useState<number>(88.40);
  const [totalEarnedAllTime, setTotalEarnedAllTime] = useState<number>(528.50);

  const [completedToday, setCompletedToday] = useState<number>(24);
  const dailyTotalQuota = userProfile.tier === 'starter' ? 15 : userProfile.tier === 'growth' ? 30 : 60;
  const rewardPerTask = 0.50;

  const [tasks, setTasks] = useState<DashboardTask[]>(INITIAL_TASKS);
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>(INITIAL_WITHDRAWALS);
  const [deposits, setDeposits] = useState<DepositRecord[]>(INITIAL_DEPOSITS);
  const [referrals] = useState<ReferralUser[]>(INITIAL_REFERRALS);

  const [notification, setNotification] = useState<string | null>(null);

  const referralCode = 'PAUL-9821';
  const referralLink = 'https://attentia.app/ref/PAUL-9821';

  // Automatically dismiss notification after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Complete a task function
  const completeTask = (taskId: string, rating: number, answer: string): boolean => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === 'completed') return false;

    // Mark task as completed
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
    
    // Increment numbers
    const taskReward = task.reward;
    setAvailableBalance(prev => +(prev + taskReward).toFixed(2));
    setTodayEarned(prev => +(prev + taskReward).toFixed(2));
    setTotalEarnedAllTime(prev => +(prev + taskReward).toFixed(2));
    setCompletedToday(prev => prev + 1);

    // Add activity record
    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      title: `${task.sponsor} Sponsor Task #${completedToday + 1} Verified`,
      time: 'Just now',
      amount: `+$${taskReward.toFixed(2)}`,
      type: 'ad',
      status: 'completed',
      details: `Rating: ${rating}/5. Survey answer recorded on-chain.`,
    };

    setActivities(prev => [newActivity, ...prev]);
    setNotification(`Task completed! +$${taskReward.toFixed(2)} credited to your available balance.`);
    return true;
  };

  // Request a withdrawal
  const requestWithdrawal = (
    amount: number, 
    network: 'TRC-20' | 'ERC-20' | 'POLYGON', 
    address: string
  ): { success: boolean; message: string } => {
    const minWithdrawal = userProfile.tier === 'starter' ? 10 : userProfile.tier === 'growth' ? 25 : 50;

    if (amount < minWithdrawal) {
      return { 
        success: false, 
        message: `Minimum withdrawal for ${userProfile.tier.toUpperCase()} tier is $${minWithdrawal}.00.` 
      };
    }

    if (amount > availableBalance) {
      return { 
        success: false, 
        message: `Insufficient available funds. Your available balance is $${availableBalance.toFixed(2)}.` 
      };
    }

    if (!address || address.length < 15) {
      return { 
        success: false, 
        message: 'Please provide a valid destination wallet address.' 
      };
    }

    const feePercent = userProfile.tier === 'starter' ? 0.02 : userProfile.tier === 'growth' ? 0.015 : 0.01;
    const fee = +(amount * feePercent).toFixed(2);
    const netAmount = +(amount - fee).toFixed(2);

    const newTxId = `WTH-${Math.floor(10000 + Math.random() * 90000)}`;

    const newWithdrawal: WithdrawalRecord = {
      id: newTxId,
      amount,
      fee,
      netAmount,
      network,
      address,
      requestedAt: 'Just now',
      status: 'submitted',
    };

    // Deduct available, add to pending
    setAvailableBalance(prev => +(prev - amount).toFixed(2));
    setPendingWithdrawal(prev => +(prev + amount).toFixed(2));
    setWithdrawals(prev => [newWithdrawal, ...prev]);

    // Add activity record
    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      title: `Withdrawal Request #${newTxId}`,
      time: 'Just now',
      amount: `-$${amount.toFixed(2)}`,
      type: 'withdrawal',
      status: 'processing',
      details: `${network} payout of $${netAmount.toFixed(2)} ($${fee.toFixed(2)} fee)`,
    };
    setActivities(prev => [newActivity, ...prev]);

    // Simulate backend verification stage update
    setTimeout(() => {
      setWithdrawals(prev => 
        prev.map(w => w.id === newTxId ? { ...w, status: 'verifying' } : w)
      );
    }, 2500);

    setNotification(`Withdrawal #${newTxId} submitted! Processing through automated security validation.`);
    return { success: true, message: 'Withdrawal requested successfully.' };
  };

  // Submit a deposit (simulate package upgrade or funding)
  const submitDeposit = (
    amount: number, 
    network: 'TRC-20' | 'ERC-20' | 'POLYGON', 
    targetTier?: 'starter' | 'growth' | 'pro'
  ) => {
    const newDepId = `DEP-${Math.floor(10000 + Math.random() * 90000)}`;
    const mockHash = `${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;

    const newDeposit: DepositRecord = {
      id: newDepId,
      amount,
      network,
      address: userProfile.walletWhitelist[network === 'TRC-20' ? 'trc20' : network === 'ERC-20' ? 'erc20' : 'polygon'],
      txHash: mockHash,
      timestamp: 'Just now',
      status: 'confirmed',
      tierUpgradedTo: targetTier,
    };

    setDeposits(prev => [newDeposit, ...prev]);
    setAvailableBalance(prev => +(prev + amount).toFixed(2));

    if (targetTier && targetTier !== userProfile.tier) {
      setUserProfile(prev => ({ ...prev, tier: targetTier }));
    }

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      title: `Deposit Confirmed (${network})`,
      time: 'Just now',
      amount: `+$${amount.toFixed(2)}`,
      type: 'deposit',
      status: 'completed',
      txHash: mockHash,
      details: targetTier ? `Account upgraded to ${targetTier.toUpperCase()} package.` : 'Wallet credited.',
    };
    setActivities(prev => [newActivity, ...prev]);

    setNotification(`Deposit of $${amount.toFixed(2)} confirmed! Ledger balance updated.`);
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...profile }));
    setNotification('Profile details updated successfully.');
  };

  const updateWalletWhitelist = (wallets: { trc20?: string; erc20?: string; polygon?: string }) => {
    setUserProfile(prev => ({
      ...prev,
      walletWhitelist: {
        ...prev.walletWhitelist,
        ...wallets,
      },
    }));
    setNotification('Payout wallet whitelist addresses successfully updated.');
  };

  const toggle2FA = () => {
    setUserProfile(prev => {
      const nextVal = !prev.twoFactorEnabled;
      setNotification(nextVal ? 'Two-Factor Authentication activated.' : 'Two-Factor Authentication disabled.');
      return { ...prev, twoFactorEnabled: nextVal };
    });
  };

  return (
    <DashboardContext.Provider
      value={{
        userProfile,
        activeTab,
        setActiveTab,
        availableBalance,
        todayEarned,
        pendingWithdrawal,
        totalReferralBonus,
        totalEarnedAllTime,
        completedToday,
        dailyTotalQuota,
        rewardPerTask,
        tasks,
        activities,
        withdrawals,
        deposits,
        referrals,
        referralCode,
        referralLink,
        completeTask,
        requestWithdrawal,
        submitDeposit,
        updateUserProfile,
        updateWalletWhitelist,
        toggle2FA,
        notification,
        setNotification,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
