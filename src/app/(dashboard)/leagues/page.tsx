"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search } from "lucide-react";
import {
  getLeagues,
  SessionRevokedError,
  type AdminLeague,
  type PaginatedLeagues,
} from "@/lib/api";
import { SuspendButton } from "./SuspendButton";
import { Pagination } from "@/components/ui/pagination";

const STATUSES = ["", "OPEN", "ACTIVE", "RESOLVING", "COMPLETED", "CANCELLED"];
const LIMIT = 50;

function statusBadge(status: string) {
  const map: Record<string, string> = {
    OPEN: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    ACTIVE: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    RESOLVING: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    COMPLETED: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    CANCELLED: "bg-rose-400/10 text-rose-400 border-rose-400/20",
  };
  return map[status] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20";
}

export default function LeaguesPage() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;

  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedLeagues | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetch = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getLeagues(token, {
        status: status || undefined,
        search: debounced || undefined,
        page,
        limit: LIMIT,
      });
      setResult(res);
    } catch (e) {
      if (e instanceof SessionRevokedError) {
        window.location.href = "/api/force-logout";
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load leagues");
    } finally {
      setLoading(false);
    }
  }, [token, status, debounced, page]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const leagues: AdminLeague[] = result?.data ?? [];
  const total = result?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Leagues</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total.toLocaleString()} total • suspend triggers coin refunds
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map((s) => {
            const active = status === s;
            return (
              <button
                key={s || "all"}
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                  active
                    ? "bg-[#C6FF00]/10 text-[#C6FF00] border-[#C6FF00]/30"
                    : "bg-[#111318] text-gray-400 border-[#1e2530] hover:text-white"
                }`}
              >
                {s || "All"}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="bg-[#111318] border border-[#1e2530] rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e2530]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0B0E11] border border-[#1e2530] text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/30"
            />
          </div>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            Loading…
          </div>
        ) : leagues.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            No leagues match
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0d1117] text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium">Sport</th>
                  <th className="text-left px-5 py-3 font-medium">Creator</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">Entry</th>
                  <th className="text-right px-5 py-3 font-medium">Pool</th>
                  <th className="text-right px-5 py-3 font-medium">Members</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leagues.map((l) => (
                  <tr key={l.id} className="border-t border-[#1e2530]">
                    <td className="px-5 py-3 text-white">{l.name}</td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {l.sport}
                    </td>
                    <td className="px-5 py-3">
                      {l.creatorId ? (
                        <Link
                          href={`/users/${l.creatorId}`}
                          className="text-gray-300 hover:text-[#C6FF00] text-xs"
                        >
                          {l.creatorName || l.creatorEmail || l.creatorId}
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${statusBadge(
                          l.status,
                        )}`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-gray-300">
                      {(l.entryFee ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-[#C6FF00]">
                      {(l.prizePool ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-gray-300">
                      {l.participantCount}/{l.maxParticipants}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {["OPEN", "ACTIVE"].includes(l.status) && (
                        <SuspendButton id={l.id} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          total={total}
          limit={LIMIT}
          label="leagues"
          onChange={setPage}
        />
      </div>
    </div>
  );
}
