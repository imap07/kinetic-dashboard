/**
 * User quality heuristics + auth channel helpers.
 *
 * These are purely client-side derivations from existing `AdminUser` fields —
 * we don't add anything to the database. The goal is to give the admin a
 * fast visual signal on "is this user real, a bot, or dormant?" without
 * needing email verification or paid attribution SDKs.
 *
 * Quality tiers (in priority order):
 *   • new         — account < 48h old, too early to judge
 *   • engaged     — loginCount >= 5 && totalPredictions >= 10
 *   • real        — loginCount >= 2 && totalPredictions >= 1
 *   • dormant     — loginCount >= 2 but inactive >14 days
 *   • suspicious  — loginCount <= 1 && age >= 3 days  (signup & ghost)
 *                   OR predictions == 0 && age >= 7 days
 *   • unknown     — fallback when nothing fits cleanly
 *
 * Tweak thresholds here as the product matures — a single source of truth.
 */

import type { AdminUser, AuthProvider } from "./api";

export type UserQuality =
  | "new"
  | "engaged"
  | "real"
  | "dormant"
  | "suspicious"
  | "unknown";

export interface QualityBadge {
  value: UserQuality;
  label: string;
  /** Tailwind color keyword used for bg/text/border classes. */
  tone: "lime" | "emerald" | "blue" | "amber" | "red" | "gray";
  tooltip: string;
}

const DAY_MS = 86_400_000;

export function computeUserQuality(user: AdminUser): QualityBadge {
  const now = Date.now();
  const ageDays = (now - new Date(user.createdAt).getTime()) / DAY_MS;
  const lastLoginTs = user.lastLoginAt
    ? new Date(user.lastLoginAt).getTime()
    : null;
  const daysSinceLastLogin =
    lastLoginTs !== null ? (now - lastLoginTs) / DAY_MS : ageDays;

  const loginCount = user.loginCount ?? 0;
  const predictions = user.totalPredictions ?? 0;

  // Too young to classify — give the benefit of the doubt
  if (ageDays < 2) {
    return {
      value: "new",
      label: "New",
      tone: "blue",
      tooltip: "Joined less than 48 hours ago",
    };
  }

  // Power users
  if (loginCount >= 5 && predictions >= 10) {
    return {
      value: "engaged",
      label: "Engaged",
      tone: "lime",
      tooltip: `${loginCount} logins · ${predictions} predictions`,
    };
  }

  // Genuine users — came back and played
  if (loginCount >= 2 && predictions >= 1) {
    // But flag as dormant if they've gone cold
    if (daysSinceLastLogin >= 14) {
      return {
        value: "dormant",
        label: "Dormant",
        tone: "gray",
        tooltip: `Inactive for ${Math.floor(daysSinceLastLogin)} days`,
      };
    }
    return {
      value: "real",
      label: "Real",
      tone: "emerald",
      tooltip: `${loginCount} logins · ${predictions} predictions`,
    };
  }

  // Signup and ghosted — never came back
  if (loginCount <= 1 && ageDays >= 3) {
    return {
      value: "suspicious",
      label: "Suspicious",
      tone: "red",
      tooltip: `${Math.floor(ageDays)}d old, only signed up (no return visit)`,
    };
  }

  // Came back but never predicted after a week — probably browsing/testing
  if (predictions === 0 && ageDays >= 7) {
    return {
      value: "suspicious",
      label: "Suspicious",
      tone: "red",
      tooltip: `${Math.floor(ageDays)}d old, no predictions made`,
    };
  }

  // Doesn't fit a clean bucket — probably fine but not enough signal
  return {
    value: "unknown",
    label: "Unknown",
    tone: "gray",
    tooltip: `${loginCount} logins · ${predictions} predictions`,
  };
}

/**
 * Quick check: is the email from a well-known disposable/temporary provider?
 * Not exhaustive — just covers the most common ones a spammer would use.
 */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "throwawaymail.com",
  "yopmail.com",
  "trashmail.com",
  "fakeinbox.com",
  "dispostable.com",
  "maildrop.cc",
]);

export function isDisposableEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}

// ─── Auth channel helpers ────────────────────────────────────────────────────

export type LoginChannel = AuthProvider;

export interface ChannelBadge {
  value: LoginChannel;
  label: string;
  /** Tailwind color keyword. */
  tone: "gray" | "blue" | "red" | "slate" | "black";
}

/**
 * Returns the "primary" login channel for display purposes. Prefers the
 * most recently used provider (`lastLoginProvider`), falls back to the first
 * entry in `providers[]` if that's not available.
 */
export function getLoginChannel(user: AdminUser): ChannelBadge | null {
  const candidate =
    user.lastLoginProvider?.toLowerCase() ||
    user.providers?.[0]?.toLowerCase();

  if (!candidate) return null;

  switch (candidate) {
    case "apple":
      return { value: "apple", label: "Apple", tone: "black" };
    case "google":
      return { value: "google", label: "Google", tone: "blue" };
    case "email":
      return { value: "email", label: "Email", tone: "gray" };
    case "x":
      return { value: "x", label: "X", tone: "slate" };
    default:
      return null;
  }
}

// ─── Acquisition source helpers ──────────────────────────────────────────────

const ACQUISITION_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  friend: "Friend",
  appstore: "App Store",
  google: "Google Search",
  youtube: "YouTube",
  twitter: "X / Twitter",
  other: "Other",
};

export function getAcquisitionLabel(source: string | undefined): string {
  if (!source) return "—";
  return ACQUISITION_LABELS[source.toLowerCase()] ?? source;
}
