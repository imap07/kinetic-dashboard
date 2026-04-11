// ─── User ────────────────────────────────────────────────────────────────────

export type UserPlan = "free" | "pro_monthly" | "pro_annual";

export interface KineticUser {
  _id: string;
  email: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  isPremium: boolean;
  plan: UserPlan;
  kineticCoins: number;
  totalPredictions: number;
  correctPredictions: number;
  createdAt: string;
  updatedAt: string;
  lastSeenAt?: string;
  isDeleted?: boolean;
}

// ─── League ──────────────────────────────────────────────────────────────────

export type LeagueStatus = "open" | "in_progress" | "completed" | "cancelled";

export interface League {
  _id: string;
  name: string;
  creatorId: string;
  status: LeagueStatus;
  entryFee: number;
  prizePool: number;
  memberCount: number;
  maxMembers?: number;
  sport: string;
  createdAt: string;
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export type AuditEventType =
  | "user.created"
  | "user.deleted"
  | "user.suspended"
  | "user.coins_adjusted"
  | "league.created"
  | "league.cancelled"
  | "admin.login"
  | "admin.logout";

export interface AuditEvent {
  _id: string;
  eventType: AuditEventType;
  actorId: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

// ─── Dashboard KPIs ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalUsers: number;
  activeLeagues: number;
  totalCoinsInCirculation: number;
  proSubscribers: number;
  newUsersToday: number;
  predictionsToday: number;
}
