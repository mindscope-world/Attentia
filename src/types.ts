export interface PackageTier {
  id: 'starter' | 'growth' | 'pro';
  name: string;
  price: number;
  badge?: string;
  popular?: boolean;
  tagline: string;
  activitiesPerDay: number;
  rewardPerActivity: string;
  referralRewardTier: string;
  minWithdrawal: number;
  platformFee: string;
  cycleDuration: string;
  eligibility: string;
  features: string[];
}

export interface ActivityItem {
  id: string;
  title: string;
  time: string;
  amount: string;
  type: 'ad' | 'referral' | 'withdrawal' | 'deposit';
  status: 'completed' | 'processing' | 'failed';
  txHash?: string;
  details?: string;
  /** ISO timestamp, used for sorting and exports. */
  at?: string;
}

export interface DashboardTask {
  id: string;
  title: string;
  sponsor: string;
  /** Industry of the campaign, as set on the server (e.g. Technology, Travel). */
  category: string;
  reward: number;
  durationSeconds: number;
  description: string;
  mediaUrl?: string;
  /** YouTube video ID for embedded video ads. */
  youtubeId?: string;
  ratingPrompt: string;
  question: string;
  options: string[];
  /** completed = verified today; rejected = attempted today but not verified (one attempt per day). */
  status: 'available' | 'completed' | 'rejected';
  /** Demonstration content: shown with a visible label. */
  isDemo: boolean;
  /** Campaign requires written feedback of at least 10 characters. */
  requiresFeedback: boolean;
}

export interface WithdrawalRecord {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  network: 'TRC-20' | 'ERC-20' | 'POLYGON';
  address: string;
  requestedAt: string;
  status: 'submitted' | 'verifying' | 'dispatched' | 'completed' | 'rejected';
  txHash?: string;
  rejectionReason?: string;
  explorerUrl?: string;
}

export interface DepositRecord {
  id: string;
  amount: number;
  network: 'TRC-20' | 'ERC-20' | 'POLYGON';
  address: string;
  txHash: string;
  timestamp: string;
  status: 'confirmed' | 'pending' | 'awaiting payment' | 'underpaid' | 'expired' | 'failed';
  tierUpgradedTo?: string;
  explorerUrl?: string;
}

export interface ReferralUser {
  id: string;
  username: string;
  level: 1 | 2 | 3;
  joinedDate: string;
  tier: 'Starter' | 'Growth' | 'Pro';
  tasksCompletedToday: number;
  commissionGenerated: number;
  status: 'active' | 'idle';
}

export interface UserProfile {
  name: string;
  email: string;
  accountId: string;
  /** Code of the active participation package, or 'none'. */
  tier: string;
  memberSince: string;
  kycLevel: string;
  twoFactorEnabled: boolean;
  walletWhitelist: {
    trc20: string;
    erc20: string;
    polygon: string;
  };
}

export type DashboardTab = 
  | 'overview' 
  | 'tasks' 
  | 'deposits-withdrawals' 
  | 'activities' 
  | 'network' 
  | 'settings';

export interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export interface StepItem {
  number: string;
  title: string;
  description: string;
  details: string;
  badge: string;
}
