// NOTE: `api.ts` is imported by both server components (where
// `process.env.BACKEND_URL` is available) and client components (where only
// `NEXT_PUBLIC_*` vars survive the bundler). We check both so a single source
// of truth works in both environments.
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "https://kinectic-app-test.4a7ymmxg576we.ca-central-1.cs.amazonlightsail.com";

interface FetchOptions extends RequestInit {
  token?: string;
}

/**
 * Thrown when the backend rejects our JWT because the user's tokenVersion
 * changed (password reset, forced logout, role change, etc.) or the token
 * is otherwise invalid. Callers should treat this as "log the user out and
 * bounce them to /login" — there's no way to recover in-place.
 */
export class SessionRevokedError extends Error {
  constructor(message = "Session revoked") {
    super(message);
    this.name = "SessionRevokedError";
  }
}

function isRevokedResponse(status: number, body: unknown): boolean {
  if (status !== 401 && status !== 403) return false;
  const msg =
    typeof body === "object" && body !== null && "message" in body
      ? String((body as { message?: unknown }).message ?? "")
      : "";
  return (
    msg.toLowerCase().includes("revoked") ||
    msg.toLowerCase().includes("user not found or inactive") ||
    status === 401
  );
}

/**
 * Base fetch wrapper for Kinetic backend API calls.
 * Automatically attaches the admin JWT if provided, sets JSON content-type,
 * and throws on non-OK responses with the server error message.
 */
export async function apiFetch<T = unknown>(
  path: string,
  { token, ...options }: FetchOptions = {}
): Promise<T> {
  const url = `${BACKEND_URL}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    cache: options.cache ?? "no-store",
  });

  if (!res.ok) {
    let errorMessage = `API error ${res.status}`;
    let body: unknown = null;
    try {
      body = await res.json();
      errorMessage =
        (body as { message?: string })?.message ?? errorMessage;
    } catch {
      // ignore parse error, keep default message
    }
    if (isRevokedResponse(res.status, body)) {
      throw new SessionRevokedError(errorMessage);
    }
    throw new Error(errorMessage);
  }

  if (res.status === 204) return null as T;

  return res.json() as Promise<T>;
}

// ── Convenience base methods ──────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: "GET", ...opts }),

  post: <T>(path: string, body: unknown, opts?: FetchOptions) =>
    apiFetch<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
      ...opts,
    }),

  patch: <T>(path: string, body: unknown, opts?: FetchOptions) =>
    apiFetch<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
      ...opts,
    }),

  delete: <T>(path: string, opts?: FetchOptions) =>
    apiFetch<T>(path, { method: "DELETE", ...opts }),
};

// ── fetchWithAuth helper ──────────────────────────────────────────────────────

export async function fetchWithAuth<T = unknown>(
  url: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options?.headers as Record<string, string>),
  };

  const res = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    let errorMessage = `API error ${res.status}`;
    let body: unknown = null;
    try {
      body = await res.json();
      errorMessage =
        (body as { message?: string })?.message ?? errorMessage;
    } catch {
      // ignore
    }
    if (isRevokedResponse(res.status, body)) {
      throw new SessionRevokedError(errorMessage);
    }
    throw new Error(errorMessage);
  }

  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

// ── Typed wrappers ────────────────────────────────────────────────────────────

export interface OverviewStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  newUsersLast7d: number;
  newUsersLast30d: number;
  activeLeagues: number;
}

export type AuthProvider = "email" | "google" | "apple" | "x";

export type AcquisitionSource =
  | "instagram"
  | "tiktok"
  | "friend"
  | "appstore"
  | "google"
  | "youtube"
  | "twitter"
  | "other";

export interface AdminUser {
  _id: string;
  id?: string;
  email: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  isPremium: boolean;
  isBanned?: boolean;
  isActive?: boolean;
  plan?: string;
  kineticCoins?: number;
  totalPoints?: number;
  totalPredictions?: number;
  correctPredictions?: number;
  currentStreak?: number;
  loginCount?: number;
  lastLoginAt?: string;
  lastSeenAt?: string;
  lastLoginCountry?: string;
  lastLoginProvider?: string;
  /** All providers linked to the account (from User.providers[]). */
  providers?: AuthProvider[];
  /** Whether the user finished the onboarding flow. */
  onboardingCompleted?: boolean;
  /** Self-reported acquisition channel (collected at onboarding). */
  acquisitionSource?: AcquisitionSource;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: string;
  isPremium?: string;
}

export interface PaginatedUsers {
  data: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditLogEntry {
  _id: string;
  adminEmail?: string;
  action: string;
  targetId?: string;
  targetEmail?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedAuditLog {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

export function getStats(token: string): Promise<OverviewStats> {
  return fetchWithAuth<OverviewStats>("/api/admin/stats/overview", token);
}

export function getUsers(
  token: string,
  params: AdminUsersParams = {}
): Promise<PaginatedUsers> {
  const qs = new URLSearchParams();
  if (params.page !== undefined) qs.set("page", String(params.page));
  if (params.limit !== undefined) qs.set("limit", String(params.limit));
  if (params.search) qs.set("search", params.search);
  if (params.isActive !== undefined && params.isActive !== "")
    qs.set("isActive", params.isActive);
  if (params.isPremium !== undefined && params.isPremium !== "")
    qs.set("isPremium", params.isPremium);
  const query = qs.toString();
  return fetchWithAuth<PaginatedUsers>(
    `/api/admin/users${query ? `?${query}` : ""}`,
    token
  );
}

/**
 * The backend wraps the user in `{ user, wallet, loginSummary }`. The dashboard
 * only cares about the user fields today, so we unwrap here to keep call sites
 * simple. If a future page needs wallet/loginSummary, expose a second wrapper
 * rather than changing this signature.
 */
export async function getUserDetail(
  token: string,
  id: string,
): Promise<AdminUser> {
  const res = await fetchWithAuth<{
    user: AdminUser;
    wallet?: unknown;
    loginSummary?: unknown;
  }>(`/api/admin/users/${id}`, token);
  return res.user;
}

export function banUser(
  token: string,
  id: string,
  reason: string
): Promise<void> {
  return fetchWithAuth<void>(`/api/admin/users/${id}/ban`, token, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function unbanUser(token: string, id: string): Promise<void> {
  return fetchWithAuth<void>(`/api/admin/users/${id}/unban`, token, {
    method: "POST",
  });
}

export function forceLogout(token: string, id: string): Promise<void> {
  return fetchWithAuth<void>(`/api/admin/users/${id}/force-logout`, token, {
    method: "POST",
  });
}

export function adjustCoins(
  token: string,
  id: string,
  amount: number,
  reason: string
): Promise<void> {
  return fetchWithAuth<void>(`/api/admin/users/${id}/adjust-coins`, token, {
    method: "POST",
    body: JSON.stringify({ amount, reason }),
  });
}

// ─── Referrals (admin read-only) ───────────────────────────────

export interface ReferralStats {
  total: number;
  pending: number;
  qualified: number;
  rewarded: number;
  blocked: number;
  coinsDistributed: number;
}

export interface TopReferrer {
  userId: string;
  displayName: string | null;
  email: string | null;
  referralCode: string | null;
  rewardedCount: number;
  pendingCount: number;
  coinsEarned: number;
}

export function getReferralStats(token: string): Promise<ReferralStats> {
  return fetchWithAuth<ReferralStats>("/api/admin/referrals/stats", token);
}

export function getTopReferrers(
  token: string,
  limit = 20,
): Promise<TopReferrer[]> {
  return fetchWithAuth<TopReferrer[]>(
    `/api/admin/referrals/top?limit=${limit}`,
    token,
  );
}

export function getAuditLog(
  token: string,
  params: AuditLogParams = {}
): Promise<PaginatedAuditLog> {
  const qs = new URLSearchParams();
  if (params.page !== undefined) qs.set("page", String(params.page));
  if (params.limit !== undefined) qs.set("limit", String(params.limit));
  if (params.action) qs.set("action", params.action);
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom);
  if (params.dateTo) qs.set("dateTo", params.dateTo);
  const query = qs.toString();
  return fetchWithAuth<PaginatedAuditLog>(
    `/api/admin/audit-log${query ? `?${query}` : ""}`,
    token
  );
}
