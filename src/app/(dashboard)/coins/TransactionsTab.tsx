"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  getCoinTransactions,
  SessionRevokedError,
  type CoinTxRow,
  type PaginatedCoinTx,
} from "@/lib/api";
import { Pagination } from "@/components/ui/pagination";

const TX_TYPES = [
  "",
  "purchase",
  "subscription_grant",
  "league_entry",
  "league_winnings",
  "giftcard_redemption",
  "refund",
  "welcome_bonus",
  "ad_reward",
  "streak_reward",
  "challenge_reward",
  "referral_reward",
  "season_reward",
];

const COIN_TYPES: Array<"" | "earned" | "purchased" | "mixed"> = [
  "",
  "earned",
  "purchased",
  "mixed",
];

const LIMIT = 50;

function coinTypeBadge(coinType: string | null) {
  if (coinType === "earned") return "bg-emerald-400/10 text-emerald-400 border-emerald-400/20";
  if (coinType === "purchased") return "bg-amber-400/10 text-amber-400 border-amber-400/20";
  if (coinType === "mixed") return "bg-purple-400/10 text-purple-400 border-purple-400/20";
  return "bg-gray-500/10 text-gray-400 border-gray-500/20";
}

export function TransactionsTab() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;

  const [type, setType] = useState("");
  const [coinType, setCoinType] = useState<"" | "earned" | "purchased" | "mixed">("");
  const [userId, setUserId] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedCoinTx | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getCoinTransactions(token, {
        page,
        limit: LIMIT,
        type: type || undefined,
        coinType: coinType || undefined,
        userId: userId.trim() || undefined,
      });
      setResult(res);
    } catch (e) {
      if (e instanceof SessionRevokedError) {
        window.location.href = "/api/force-logout";
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token, page, type, coinType, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const rows: CoinTxRow[] = result?.data ?? [];
  const total = result?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="bg-[#111318] border border-[#1e2530] rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="w-full px-2.5 py-1.5 text-sm rounded-md bg-[#0d1117] border border-[#1e2530] text-white focus:outline-none focus:border-[#C6FF00]/50"
          >
            {TX_TYPES.map((t) => (
              <option key={t || "all"} value={t}>
                {t || "All types"}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1">Coin type</label>
          <select
            value={coinType}
            onChange={(e) => {
              setCoinType(e.target.value as "" | "earned" | "purchased" | "mixed");
              setPage(1);
            }}
            className="w-full px-2.5 py-1.5 text-sm rounded-md bg-[#0d1117] border border-[#1e2530] text-white focus:outline-none focus:border-[#C6FF00]/50"
          >
            {COIN_TYPES.map((t) => (
              <option key={t || "all"} value={t}>
                {t || "All"}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1">User ID</label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            onBlur={() => setPage(1)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setPage(1);
            }}
            placeholder="ObjectId (paste from /users)"
            className="w-full px-2.5 py-1.5 text-sm rounded-md bg-[#0d1117] border border-[#1e2530] text-white placeholder-gray-600 focus:outline-none focus:border-[#C6FF00]/50"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="bg-[#111318] border border-[#1e2530] rounded-xl overflow-hidden">
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            No transactions match.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0d1117] text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">When</th>
                  <th className="text-left px-5 py-3 font-medium">User</th>
                  <th className="text-left px-5 py-3 font-medium">Type</th>
                  <th className="text-left px-5 py-3 font-medium">Coin type</th>
                  <th className="text-right px-5 py-3 font-medium">Amount</th>
                  <th className="text-right px-5 py-3 font-medium">Balance after</th>
                  <th className="text-left px-5 py-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-[#1e2530]">
                    <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/users/${r.userId}`}
                        className="text-white hover:text-[#C6FF00]"
                      >
                        {r.userName || r.userEmail || r.userId.slice(-6)}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-300 text-xs">{r.type}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${coinTypeBadge(
                          r.coinType,
                        )}`}
                      >
                        {r.coinType || "—"}
                      </span>
                    </td>
                    <td
                      className={`px-5 py-3 text-right tabular-nums font-mono ${
                        r.amount >= 0 ? "text-[#C6FF00]" : "text-rose-400"
                      }`}
                    >
                      {r.amount >= 0 ? "+" : ""}
                      {r.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-gray-300 font-mono">
                      {r.balanceAfter.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400 max-w-[280px] truncate">
                      {r.description || r.referenceId || "—"}
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
          label="transactions"
          onChange={setPage}
        />
      </div>
    </div>
  );
}
