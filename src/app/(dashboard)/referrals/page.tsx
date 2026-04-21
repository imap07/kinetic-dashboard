import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  Share2,
  Clock,
  CheckCircle2,
  Gift,
  ShieldAlert,
  Coins,
} from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getReferralStats,
  getTopReferrers,
  getBlockedReferrals,
  SessionRevokedError,
  type ReferralStats,
  type TopReferrer,
  type BlockedReferral,
} from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { ReferralModActions } from "./ReferralModActions";

export const metadata: Metadata = {
  title: "Referrals",
};

// Funnel snapshot at the top of the page.
//
// Deliberately read-only — this dashboard surface is for observability,
// not moderation. Blocking a referral is a rare enough action that it
// doesn't justify a manage-UI yet; when it does, add it behind a
// confirm modal + audit log entry.

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}

function KpiCard({ label, value, icon: Icon, color, bg, border }: KpiCardProps) {
  return (
    <div className="bg-[#111318] border border-[#1e2530] rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`flex items-center justify-center w-9 h-9 rounded-lg ${bg} border ${border}`}
        >
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-white tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-xs font-medium text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="bg-[#111318] border border-[#1e2530] rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-9 h-9 rounded-lg" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

async function ReferralsPanel() {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) redirect("/api/force-logout");

  let stats: ReferralStats | null = null;
  let top: TopReferrer[] = [];
  let blocked: BlockedReferral[] = [];
  let error: string | null = null;

  try {
    [stats, top, blocked] = await Promise.all([
      getReferralStats(token),
      getTopReferrers(token, 20),
      getBlockedReferrals(token, 50).catch(() => []),
    ]);
  } catch (e) {
    if (e instanceof SessionRevokedError) redirect("/api/force-logout");
    error = e instanceof Error ? e.message : "Failed to load referrals";
  }

  const cards = [
    {
      label: "Total referrals",
      value: stats?.total ?? "—",
      icon: Share2,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20",
    },
    {
      label: "Pending",
      value: stats?.pending ?? "—",
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/20",
    },
    {
      label: "Qualified",
      value: stats?.qualified ?? "—",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/20",
    },
    {
      label: "Rewarded",
      value: stats?.rewarded ?? "—",
      icon: Gift,
      color: "text-[#C6FF00]",
      bg: "bg-[#C6FF00]/10",
      border: "border-[#C6FF00]/20",
    },
    {
      label: "Blocked (fraud)",
      value: stats?.blocked ?? "—",
      icon: ShieldAlert,
      color: "text-rose-400",
      bg: "bg-rose-400/10",
      border: "border-rose-400/20",
    },
    {
      label: "Coins distributed",
      value: stats?.coinsDistributed ?? "—",
      icon: Coins,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-400/20",
    },
  ];

  return (
    <>
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      {/* Top referrers table */}
      <div className="bg-[#111318] border border-[#1e2530] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e2530]">
          <h2 className="text-sm font-semibold text-white">Top referrers</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Sorted by rewarded count, then coins earned
          </p>
        </div>
        {top.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            No referrals yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0d1117] text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">User</th>
                  <th className="text-left px-5 py-3 font-medium">Code</th>
                  <th className="text-right px-5 py-3 font-medium">Rewarded</th>
                  <th className="text-right px-5 py-3 font-medium">Pending</th>
                  <th className="text-right px-5 py-3 font-medium">Coins</th>
                </tr>
              </thead>
              <tbody>
                {top.map((r) => (
                  <tr
                    key={r.userId}
                    className="border-t border-[#1e2530] hover:bg-[#0d1117]/50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/users/${r.userId}`}
                        className="text-white hover:text-[#C6FF00] transition-colors"
                      >
                        {r.displayName || r.email || r.userId}
                      </Link>
                      {r.email && r.displayName && (
                        <div className="text-xs text-gray-500">{r.email}</div>
                      )}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-300">
                      {r.referralCode || "—"}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-emerald-400 font-semibold">
                      {r.rewardedCount}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-amber-400">
                      {r.pendingCount}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-[#C6FF00] font-semibold">
                      {r.coinsEarned.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Blocked (moderation) */}
      <div className="bg-[#111318] border border-[#1e2530] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e2530]">
          <h2 className="text-sm font-semibold text-white">Blocked referrals</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Fraud-flagged — review, unblock, or force reward if legit
          </p>
        </div>
        {blocked.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-gray-500">
            No blocked referrals
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0d1117] text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Referrer</th>
                  <th className="text-left px-5 py-3 font-medium">Referee</th>
                  <th className="text-left px-5 py-3 font-medium">Reason</th>
                  <th className="text-left px-5 py-3 font-medium">When</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blocked.map((b) => (
                  <tr key={b._id} className="border-t border-[#1e2530]">
                    <td className="px-5 py-3 text-xs">
                      {b.referrer ? (
                        <Link
                          href={`/users/${b.referrer._id}`}
                          className="text-white hover:text-[#C6FF00]"
                        >
                          {b.referrer.displayName || b.referrer.email}
                        </Link>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {b.referee ? (
                        <Link
                          href={`/users/${b.referee._id}`}
                          className="text-white hover:text-[#C6FF00]"
                        >
                          {b.referee.displayName || b.referee.email}
                        </Link>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-rose-400 max-w-[260px] truncate">
                      {b.blockReason ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ReferralModActions id={b._id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default function ReferralsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Referrals</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Invite funnel, rewards distributed, and top inviters
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <KpiSkeleton key={i} />
            ))}
          </div>
        }
      >
        <ReferralsPanel />
      </Suspense>
    </div>
  );
}
