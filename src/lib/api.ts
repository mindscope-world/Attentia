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
