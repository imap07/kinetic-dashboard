import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getCronSummary,
  getCronRecent,
  SessionRevokedError,
  type CronSummaryEntry,
  type CronRunEntry,
} from "@/lib/api";

export const metadata: Metadata = { title: "System" };

function statusBadge(status: string) {
  const map: Record<string, string> = {
    ok: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    running: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    error: "bg-rose-400/10 text-rose-400 border-rose-400/20",
  };
  return map[status] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20";
}

function fmtDuration(ms?: number) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default async function SystemPage() {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) redirect("/api/force-logout");

  let summary: CronSummaryEntry[] = [];
  let recent: CronRunEntry[] = [];
  let error: string | null = null;

  try {
    [summary, recent] = await Promise.all([
      getCronSummary(token),
      getCronRecent(token, 50),
    ]);
  } catch (e) {
    if (e instanceof SessionRevokedError) redirect("/api/force-logout");
    error = e instanceof Error ? e.message : "Failed to load system state";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">System</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Cron executions, errors and last-run visibility
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="bg-[#111318] border border-[#1e2530] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e2530]">
          <h2 className="text-sm font-semibold text-white">Cron summary</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Last status per cron, and error counts in the last hour
          </p>
        </div>
        {summary.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            No cron runs yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0d1117] text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Cron</th>
                  <th className="text-left px-5 py-3 font-medium">Last run</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">Duration</th>
                  <th className="text-right px-5 py-3 font-medium">
                    Runs / Errors (1h)
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr
                    key={s.name}
                    className="border-t border-[#1e2530] hover:bg-[#0d1117]/50"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-white">
                      {s.name}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(s.lastStartedAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${statusBadge(
                          s.lastStatus,
                        )}`}
                      >
                        {s.lastStatus}
                      </span>
                      {s.lastError && (
                        <div className="text-xs text-rose-400 mt-1 max-w-[380px] truncate">
                          {s.lastError}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-gray-300">
                      {fmtDuration(s.lastDurationMs)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      <span className="text-gray-300">{s.recentRunCount}</span>
                      <span className="text-gray-600"> / </span>
                      <span
                        className={
                          s.recentErrorCount > 0
                            ? "text-rose-400 font-semibold"
                            : "text-gray-500"
                        }
                      >
                        {s.recentErrorCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-[#111318] border border-[#1e2530] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e2530]">
          <h2 className="text-sm font-semibold text-white">Recent runs</h2>
          <p className="text-xs text-gray-500 mt-0.5">Last 50 executions</p>
        </div>
        {recent.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            No recent runs
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0d1117] text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Cron</th>
                  <th className="text-left px-5 py-3 font-medium">Started</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">Duration</th>
                  <th className="text-right px-5 py-3 font-medium">Items</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r._id} className="border-t border-[#1e2530]">
                    <td className="px-5 py-3 font-mono text-xs text-white">
                      {r.name}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {new Date(r.startedAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${statusBadge(
                          r.status,
                        )}`}
                      >
                        {r.status}
                      </span>
                      {r.errorMessage && (
                        <div className="text-xs text-rose-400 mt-1 max-w-[380px] truncate">
                          {r.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-gray-300">
                      {fmtDuration(r.durationMs)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-gray-300">
                      {r.itemsProcessed ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
