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
}

export interface DashboardTask {
  id: string;
  title: string;
  sponsor: string;
  category: 'Video Engagement' | 'Product Poll' | 'App Review' | 'Brand Survey';
  reward: number;
  durationSeconds: number;
  description: string;
  mediaUrl?: string;
  ratingPrompt: string;
  question: string;
  options: string[];
  status: 'available' | 'completed';
}

export interface WithdrawalRecord {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  network: 'TRC-20' | 'ERC-20' | 'POLYGON';
  address: string;
  requestedAt: string;
  status: 'submitted' | 'verifying' | 'dispatched' | 'completed';
  txHash?: string;
}

export interface DepositRecord {
  id: string;
  amount: number;
  network: 'TRC-20' | 'ERC-20' | 'POLYGON';
  address: string;
  txHash: string;
  timestamp: string;
  status: 'confirmed' | 'pending';
  tierUpgradedTo?: 'starter' | 'growth' | 'pro';
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
  tier: 'starter' | 'growth' | 'pro';
  memberSince: string;
  kycLevel: 'Tier 1 (Basic)' | 'Tier 2 (Verified)' | 'Tier 3 (Institutional)';
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
