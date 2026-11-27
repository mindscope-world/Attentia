import { api, ApiAsset, Role } from './api';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  role: Role;
  kyc_status: 'none' | 'pending' | 'verified' | 'rejected';
  is_active: boolean;
  banned_at: string | null;
  ban_reason: string | null;
  created_at: string;
  available?: string;
}

export interface LedgerRow {
  id: string;
  account: string;
  entry_type: string;
  amount: string;
  description: string | null;
  created_at: string;
}

export interface AdminUserDetail {
  user: AdminUser;
  balances: Record<string, string>;
  recent_ledger: LedgerRow[];
  withdrawals_pending: number;
  verified_tasks: number;
}

export interface AdminWithdrawal {
  id: string;
  user_id: string;
  network: string;
  asset: string;
  address: string;
  amount: string;
  fee: string;
  net_amount: string;
  status: 'requested' | 'completed' | 'rejected';
  tx_hash: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface AdminDeposit {
  id: string;
  user_id: string;
  network: string;
  asset: string;
  expected_amount: string;
  received_amount: string | null;
  tx_hash: string | null;
  status: string;
  created_at: string;
  confirmed_at: string | null;
}

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'expired';

export interface AdminCampaign {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  is_demo: boolean;
  status: CampaignStatus;
  reward_rate: string;
  budget_total: string;
  budget_spent: string;
  asset_id: string | null;
  rating_prompt: string;
  question: string;
  options: string[];
  correct_option: string | null;
  display_seconds: number;
  min_watch_pct: number;
  created_at: string;
}

export type LinkStatus = 'pending' | 'active' | 'paused' | 'declined' | 'removed' | 'completed' | 'expired';

export interface AdLink {
  id: string;
  youtube_id: string;
  url: string;
  title: string | null;
  channel_title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  embed_url: string;
  duration_seconds: number | null;
  category: string | null;
  source: 'fetched' | 'existing';
  status: LinkStatus;
  campaign_id: string | null;
  created_at: string;
  decided_at: string | null;
}

export interface AdDefaults {
  reward_rate: string;
  budget_total: string;
  is_demo: boolean;
}

export interface NewAd {
  url: string;
  durationSeconds?: number;
  name: string;
  brand: string;
  category: string;
  description: string;
  rewardRate: string;
  budget: string;
  question: string;
  options: string[];
  isDemo: boolean;
}

export interface AdminStats {
  registered_users: number;
  registered_participants: number;
  active_participants_7d: number;
  active_campaigns: number;
  total_interactions: number;
  verified_tasks: number;
  rejected_tasks: number;
  suspicious_playback_events: number;
  campaign_spend: number;
  rewards_credited: number;
  reward_liabilities: number;
  deposit_volume: number;
  withdrawal_volume: number;
  withdrawals_awaiting_review: number;
}

const qs = (params: Record<string, string | boolean | undefined>) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && p.set(k, String(v)));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const adminApi = {
  stats: () => api.get<AdminStats>('/analytics/admin'),

  users: (f: { q?: string; role?: string; banned?: boolean } = {}) =>
    api.get<AdminUser[]>(`/admin/users${qs({ ...f, limit: '500' })}`),
  userDetail: (id: string) => api.get<AdminUserDetail>(`/admin/users/${id}`),
  updateUser: (id: string, body: Partial<Pick<AdminUser, 'role' | 'kyc_status'>>) =>
    api.patch<AdminUser>(`/users/${id}`, body),
  ban: (id: string, reason: string) => api.post<AdminUser>(`/admin/users/${id}/ban`, { reason }),
  unban: (id: string) => api.post<AdminUser>(`/admin/users/${id}/unban`),
  adjust: (id: string, amount: string, reason: string) =>
    api.post<AdminUserDetail>(`/admin/users/${id}/adjust`, { amount, reason }),

  withdrawals: (status?: string) => api.get<AdminWithdrawal[]>(`/payments/admin/withdrawals${qs({ status_: status })}`),
  approveWithdrawal: (id: string, txHash: string) =>
    api.post<AdminWithdrawal>(`/payments/admin/withdrawals/${id}/approve`, { tx_hash: txHash }),
  rejectWithdrawal: (id: string, reason: string) =>
    api.post<AdminWithdrawal>(`/payments/admin/withdrawals/${id}/reject`, { reason }),
  deposits: () => api.get<AdminDeposit[]>('/admin/deposits'),

  campaigns: () => api.get<AdminCampaign[]>('/campaigns'),
  setCampaignStatus: (id: string, status: CampaignStatus) =>
    api.post<AdminCampaign>(`/campaigns/${id}/status`, { status }),
  asset: (id: string) => api.get<ApiAsset>(`/assets/${id}`),
  adLinks: (f: { status?: string; q?: string } = {}) => api.get<AdLink[]>(`/admin/ad-links${qs({ status_: f.status, q: f.q })}`),
  fetchAds: (count = 20) => api.post<{ added: number; items: AdLink[] }>('/admin/ad-links/fetch', { count }),
  approveLink: (id: string, d: AdDefaults) => api.post<AdLink>(`/admin/ad-links/${id}/approve`, d),
  pauseLink: (id: string, d: AdDefaults) => api.post<AdLink>(`/admin/ad-links/${id}/pause`, d),
  declineLink: (id: string, force = false) => api.post<AdLink>(`/admin/ad-links/${id}/decline${qs({ force })}`),
  deleteCampaign: (id: string, force = false) => api.delete<void>(`/admin/campaigns/${id}${qs({ force })}`),

  /** Register the YouTube video, create the campaign and publish it. */
  async createAd(ad: NewAd): Promise<AdminCampaign> {
    const asset = await api.post<ApiAsset>('/assets/youtube', {
      url: ad.url,
      duration_seconds: ad.durationSeconds,
    });
    const campaign = await api.post<AdminCampaign>('/campaigns', {
      name: ad.name,
      brand: ad.brand,
      category: ad.category,
      description: ad.description,
      is_demo: ad.isDemo,
      asset_id: asset.id,
      reward_rate: ad.rewardRate,
      budget_total: ad.budget,
      rating_prompt: 'How relevant was this ad to you?',
      question: ad.question,
      options: ad.options,
    });
    return api.post<AdminCampaign>(`/campaigns/${campaign.id}/status`, { status: 'active' });
  },
};
