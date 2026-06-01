"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Footprints, ChevronLeft, ChevronRight } from "lucide-react";
import { getUserActivityFeed, SessionRevokedError } from "@/lib/api";
import type { UserActivityEntry, PaginatedUserActivity } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const ACTION_COLORS: Record<string, string> = {
  "auth.signup": "bg-[#C6FF00]/10 text-[#C6FF00] border-[#C6FF00]/20",
  "auth.signin": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "auth.signout": "bg-gray-500/10 text-gray-400 border-gray-500/20",
  "auth.account_deleted": "bg-red-500/10 text-red-400 border-red-500/20",
  "birthdate.set": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "prediction.created": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "prediction.updated": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "prediction.deleted": "bg-red-500/10 text-red-400 border-red-500/20",
  "league.created": "bg-[#C6FF00]/10 text-[#C6FF00] border-[#C6FF00]/20",
  "league.joined": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "league.left": "bg-gray-500/10 text-gray-400 border-gray-500/20",
  "giftcard.requested": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "subscription.started": "bg-[#C6FF00]/10 text-[#C6FF00] border-[#C6FF00]/20",
  "subscription.renewed": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "subscription.cancelled": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "subscription.expired": "bg-red-500/10 text-red-400 border-red-500/20",
  "coins.purchased": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  default: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

function actionBadgeClass(action: string): string {
  return ACTION_COLORS[action] ?? ACTION_COLORS.default;
}

const ACTION_TYPES = [
  "All",
  "auth.signup",
  "auth.signin",
  "auth.signout",
  "auth.account_deleted",
  "birthdate.set",
  "prediction.created",
  "prediction.updated",
  "prediction.deleted",
  "league.created",
  "league.joined",
  "league.left",
  "giftcard.requested",
  "subscription.started",
  "subscription.renewed",
  "subscription.cancelled",
  "subscription.expired",
  "coins.purchased",
];

function SkeletonRow() {
  return (
    <tr className="border-b border-[#1e2530]">
      <td className="px-4 py-3"><Skeleton className="h-3 w-40" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-28 rounded-full" /></td>
      <td className="px-4 py-3"><Skeleton className="h-3 w-48" /></td>
      <td className="px-4 py-3"><Skeleton className="h-3 w-32" /></td>
    </tr>
  );
}

export default function UserActivityPage() {
  const { data: session } = useSession();

  const [actionFilter, setActionFilter] = useState("All");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedUserActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = (session as { accessToken?: string })?.accessToken;

  const fetchFeed = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserActivityFeed(token, {
        page,
        limit: 50,
        action: actionFilter === "All" ? undefined : actionFilter,
        userId: userIdFilter.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setResult(data);
    } catch (e) {
      if (e instanceof SessionRevokedError) {
        window.location.href = "/api/force-logout";
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load user activity");
    } finally {
      setLoading(false);
    }
  }, [token, page, actionFilter, userIdFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const totalPages = result ? Math.max(1, result.pages) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">User Activity</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Real-time trace of what users do in the app — signups, picks, league joins, redemptions, subscriptions
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="bg-[#111318] border border-[#1e2530] rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[#1e2530]">
          <div className="flex-1 min-w-[200px]">
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg bg-[#0B0E11] border border-[#1e2530] text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/30 focus:border-[#C6FF00]/40"
            >
              {ACTION_TYPES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Filter by user id (Mongo ObjectId)"
              value={userIdFilter}
              onChange={(e) => { setUserIdFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg bg-[#0B0E11] border border-[#1e2530] text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/30 focus:border-[#C6FF00]/40 font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg bg-[#0B0E11] border border-[#1e2530] text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/30"
            />
            <span className="text-gray-600 text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg bg-[#0B0E11] border border-[#1e2530] text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/30"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e2530] bg-[#0d1117]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">When</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
                : result?.data.map((entry) => (
                    <ActivityRow key={entry._id} entry={entry} />
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && !result?.data.length && (
          <div className="flex flex-col items-center justify-center py-12 border-t border-[#1e2530]">
            <Footprints className="w-10 h-10 text-gray-700 mb-3" />
            <p className="text-sm font-medium text-gray-400">No activity found</p>
            <p className="text-xs text-gray-600 mt-1">Try adjusting your filters</p>
          </div>
        )}

        {result && result.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e2530]">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages} &mdash; {result.total.toLocaleString()} events
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#1e2530] text-gray-400 hover:text-gray-100 hover:border-[#2a3340] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#1e2530] text-gray-400 hover:text-gray-100 hover:border-[#2a3340] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityRow({ entry }: { entry: UserActivityEntry }) {
  const badgeClass = actionBadgeClass(entry.action);
  const payloadStr = entry.payload && Object.keys(entry.payload).length
    ? JSON.stringify(entry.payload)
    : "";
  const details = payloadStr
    ? payloadStr.slice(0, 100) + (payloadStr.length > 100 ? "…" : "")
    : "—";

  const userLabel = entry.userDisplayName
    ? entry.userDisplayName
    : entry.userEmail ?? entry.userId.slice(0, 8);

  return (
    <tr className="border-b border-[#1e2530] hover:bg-white/[0.02] transition-colors">
      <td className="px-4 py-3">
        <div className="text-xs text-gray-300">{userLabel}</div>
        {entry.userEmail && entry.userDisplayName && (
          <div className="text-[10px] text-gray-600">{entry.userEmail}</div>
        )}
        <div className="text-[10px] text-gray-700 font-mono">{entry.userId.slice(0, 12)}</div>
      </td>
      <td className="px-4 py-3">
        <Badge
          className={`${badgeClass} border text-[10px] uppercase tracking-wide font-semibold hover:opacity-100`}
        >
          {entry.action}
        </Badge>
      </td>
      <td
        className="px-4 py-3 text-xs text-gray-500 max-w-md truncate font-mono"
        title={payloadStr}
      >
        {details}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
        {new Date(entry.createdAt).toLocaleString()}
      </td>
    </tr>
  );
}
