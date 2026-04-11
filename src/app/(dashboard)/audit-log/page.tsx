"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ScrollText, ChevronLeft, ChevronRight } from "lucide-react";
import { getAuditLog } from "@/lib/api";
import type { AuditLogEntry, PaginatedAuditLog } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const ACTION_COLORS: Record<string, string> = {
  "user.ban": "bg-red-500/10 text-red-400 border-red-500/20",
  "user.unban": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "user.force_logout": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "user.coins_adjusted": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "user.created": "bg-[#C6FF00]/10 text-[#C6FF00] border-[#C6FF00]/20",
  "user.deleted": "bg-red-500/10 text-red-400 border-red-500/20",
  "admin.login": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "admin.logout": "bg-gray-500/10 text-gray-400 border-gray-500/20",
  default: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

function actionBadgeClass(action: string): string {
  return ACTION_COLORS[action] ?? ACTION_COLORS.default;
}

const ACTION_TYPES = [
  "All",
  "user.ban",
  "user.unban",
  "user.force_logout",
  "user.coins_adjusted",
  "user.created",
  "user.deleted",
  "admin.login",
  "admin.logout",
];

function SkeletonLogRow() {
  return (
    <tr className="border-b border-[#1e2530]">
      <td className="px-4 py-3"><Skeleton className="h-3 w-36" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-24 rounded-full" /></td>
      <td className="px-4 py-3"><Skeleton className="h-3 w-28" /></td>
      <td className="px-4 py-3"><Skeleton className="h-3 w-48" /></td>
      <td className="px-4 py-3"><Skeleton className="h-3 w-32" /></td>
    </tr>
  );
}

export default function AuditLogPage() {
  const { data: session } = useSession();

  const [actionFilter, setActionFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedAuditLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = (session as { accessToken?: string })?.accessToken;

  const fetchLog = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAuditLog(token, {
        page,
        limit: 50,
        action: actionFilter === "All" ? undefined : actionFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [token, page, actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  function handleFilterChange(f: string) {
    setActionFilter(f);
    setPage(1);
  }

  const totalPages = result ? Math.ceil(result.total / 50) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">Admin actions and system events — read only</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="bg-[#111318] border border-[#1e2530] rounded-xl overflow-hidden">
        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[#1e2530]">
          {/* Action type */}
          <div className="flex-1 min-w-[200px]">
            <select
              value={actionFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0B0E11] border border-[#1e2530] text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/30 focus:border-[#C6FF00]/40"
            >
              {ACTION_TYPES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Date range */}
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e2530] bg-[#0d1117]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Target</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date / Time</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 10 }).map((_, i) => <SkeletonLogRow key={i} />)
                : result?.data.map((entry) => (
                    <AuditRow key={entry._id} entry={entry} />
                  ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {!loading && (!result?.data.length) && (
          <div className="flex flex-col items-center justify-center py-12 border-t border-[#1e2530]">
            <ScrollText className="w-10 h-10 text-gray-700 mb-3" />
            <p className="text-sm font-medium text-gray-400">No audit events found</p>
            <p className="text-xs text-gray-600 mt-1">
              Try adjusting your filters
            </p>
          </div>
        )}

        {/* Pagination */}
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

function AuditRow({ entry }: { entry: AuditLogEntry }) {
  const badgeClass = actionBadgeClass(entry.action);
  const details = entry.details
    ? JSON.stringify(entry.details).slice(0, 80) + (JSON.stringify(entry.details).length > 80 ? "…" : "")
    : "—";

  return (
    <tr className="border-b border-[#1e2530] hover:bg-white/[0.02] transition-colors">
      <td className="px-4 py-3 text-xs text-gray-400">{entry.adminEmail || "—"}</td>
      <td className="px-4 py-3">
        <Badge
          className={`${badgeClass} border text-[10px] uppercase tracking-wide font-semibold hover:opacity-100`}
        >
          {entry.action}
        </Badge>
      </td>
      <td className="px-4 py-3 text-xs text-gray-400 font-mono">
        {entry.targetEmail || entry.targetId?.slice(0, 12) || "—"}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title={entry.details ? JSON.stringify(entry.details) : ""}>
        {details}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
        {new Date(entry.createdAt).toLocaleString()}
      </td>
    </tr>
  );
}
