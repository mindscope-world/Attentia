// Typed client for the Attentia FastAPI backend.
// In development Vite proxies /api to the API (see vite.config.ts); in Docker nginx does.

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1';
const TOKEN_KEY = 'attentia_token';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string | null) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      // storage unavailable (private mode): session lasts for this page only
    }
  },
};

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the Attentia API. Is the backend running?');
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      if (typeof data.detail === 'string') message = data.detail;
      else if (Array.isArray(data.detail)) message = data.detail.map((d: { msg: string }) => d.msg).join('; ');
    } catch {
      // non-JSON error body
    }
    if (res.status === 401) tokenStore.set(null);
    throw new ApiError(res.status, message);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

// ---- Types mirrored from the backend schemas -------------------------------------------

export type Role = 'participant' | 'advertiser' | 'admin';

export interface ApiUser {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  role: Role;
  kyc_status: 'none' | 'pending' | 'verified' | 'rejected';
  two_factor_enabled: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: 'bearer';
  user: ApiUser;
}

export interface ApiPackage {
  id: string;
  code: string;
  name: string;
  price: string;
  daily_quota: number;
  min_withdrawal: string;
  withdrawal_fee_pct: string;
}

export const authApi = {
  login: (identifier: string, password: string) =>
    api.post<TokenResponse>('/auth/login', { identifier, password }),
  register: (email: string, password: string) =>
    api.post<TokenResponse>('/auth/register', { email, password }),
  me: () => api.get<ApiUser>('/users/me'),
};

// ---- Sponsored content (campaign feed + creatives) -------------------------------------

export type MediaKind = 'video' | 'image' | 'youtube';

export interface ApiFeedItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  is_demo: boolean;
  reward: string;
  duration_seconds: number | null;
  media_kind: MediaKind | null;
  media_url: string | null;
  thumbnail_url: string | null;
  /** Set for YouTube creatives: render with <YouTubeAdPlayer videoId={youtube_id} />. */
  youtube_id: string | null;
  embed_url: string | null;
  min_watch_pct: number;
  requires_feedback: boolean;
  rating_prompt: string;
  question: string;
  options: string[];
  completed_today: boolean;
}

export interface ApiAsset {
  id: string;
  kind: MediaKind;
  status: 'awaiting_upload' | 'uploaded' | 'processing' | 'ready' | 'failed';
  original_filename: string | null;
  duration_seconds: number | null;
  youtube_id: string | null;
  title: string | null;
  embed_url: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  error: string | null;
  created_at: string;
}

export const assetsApi = {
  /** Register a YouTube video (any watch/share/embed/shorts URL) as an ad creative. */
  addYouTube: (url: string, durationSeconds?: number) =>
    api.post<ApiAsset>('/assets/youtube', { url, duration_seconds: durationSeconds }),
};

// ---- Participant dashboard: feed, interactions, rewards, payments ------------------------

export interface ApiFeed {
  package: string | null;
  daily_quota: number;
  completed_today: number;
  remaining_quota: number;
  items: ApiFeedItem[];
}

export type InteractionStatus = 'started' | 'verified' | 'rejected';

export interface ApiInteraction {
  id: string;
  campaign_id: string;
  status: InteractionStatus;
  started_at: string;
  required_seconds: number;
  watched_seconds: number;
  rating: number | null;
  answer: string | null;
  feedback: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  reward_amount: string | null;
}

export type PlaybackEventName = 'play' | 'pause' | 'progress' | 'seek' | 'ended' | 'hidden' | 'visible';

export interface ApiBalances {
  available: string;
  pending_withdrawal: string;
  total_earned: string;
  withdrawn: string;
  deposits: string;
  accounts: Record<string, string>;
}

export interface ApiLedgerEntry {
  id: string;
  transaction_id: string;
  account: string;
  entry_type: string;
  amount: string;
  reference_type: string;
  reference_id: string;
  description: string | null;
  created_at: string;
}

export type ApiNetwork = 'TRC-20' | 'ERC-20' | 'POLYGON';

export interface ApiDeposit {
  id: string;
  network: ApiNetwork;
  asset: string;
  address: string;
  expected_amount: string;
  received_amount: string | null;
  tx_hash: string | null;
  confirmations: number;
  required_confirmations: number;
  status: 'awaiting_payment' | 'pending' | 'confirmed' | 'underpaid' | 'expired' | 'failed';
  expires_at: string;
  confirmed_at: string | null;
  created_at: string;
  explorer_url: string | null;
}

export interface ApiWithdrawal {
  id: string;
  network: ApiNetwork;
  asset: string;
  address: string;
  amount: string;
  fee: string;
  net_amount: string;
  status: 'requested' | 'completed' | 'rejected';
  tx_hash: string | null;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  explorer_url: string | null;
}

export interface ApiPackageFull extends ApiPackage {
  duration_days: number;
  description: string | null;
  is_active: boolean;
}

export interface ApiSubscription {
  id: string;
  status: string;
  activated_at: string | null;
  expires_at: string | null;
  package: ApiPackageFull;
}

export interface ApiParticipantAnalytics {
  verified_tasks: number;
  rejected_tasks: number;
  average_rating_given: number;
  total_verified_rewards: number;
  daily: { day: string; tasks: number; rewards: number }[];
}

export const campaignsApi = {
  feed: () => api.get<ApiFeed>('/campaigns/feed'),
};

export const interactionsApi = {
  start: (campaignId: string) => api.post<ApiInteraction>('/interactions', { campaign_id: campaignId }),
  events: (id: string, events: { type: PlaybackEventName; position: number }[]) =>
    api.post<ApiInteraction>(`/interactions/${id}/events`, { events }),
  submit: (id: string, body: { rating: number; answer: string; feedback?: string }) =>
    api.post<ApiInteraction>(`/interactions/${id}/submit`, body),
  list: () => api.get<ApiInteraction[]>('/interactions?limit=200'),
};

export const rewardsApi = {
  balances: () => api.get<ApiBalances>('/rewards/balances'),
  ledger: () => api.get<ApiLedgerEntry[]>('/rewards/ledger?limit=200'),
};

export const packagesApi = {
  list: () => api.get<ApiPackageFull[]>('/packages'),
  subscription: () => api.get<ApiSubscription | null>('/packages/subscription'),
};

export const paymentsApi = {
  deposits: () => api.get<ApiDeposit[]>('/payments/deposits'),
  createDeposit: (packageId: string, network: ApiNetwork) =>
    api.post<ApiDeposit>('/payments/deposits', { package_id: packageId, network }),
  /** Development only (the API answers 404 elsewhere). */
  simulateDeposit: (id: string, amount: string) => api.post<ApiDeposit>(`/payments/deposits/${id}/simulate`, { amount }),
  withdrawals: () => api.get<ApiWithdrawal[]>('/payments/withdrawals'),
  requestWithdrawal: (amount: string, network: ApiNetwork, address: string) =>
    api.post<ApiWithdrawal>('/payments/withdrawals', { amount, network, address }),
};

export const analyticsApi = {
  me: () => api.get<ApiParticipantAnalytics>('/analytics/me'),
};

export const profileApi = {
  update: (body: { full_name: string }) => api.patch<ApiUser>('/users/me', body),
  changePassword: (current_password: string, new_password: string) =>
    api.post<void>('/users/me/password', { current_password, new_password }),
  health: () => api.get<{ status: string; environment?: string }>('/health'),
};
