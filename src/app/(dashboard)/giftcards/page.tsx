"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  getGiftcards,
  SessionRevokedError,
  type AdminGiftcard,
  type PaginatedGiftcards,
} from "@/lib/api";
import { GiftcardActions } from "./GiftcardActions";
import { Pagination } from "@/components/ui/pagination";

const STATUSES = [
  "",
  "PENDING",
  "PROCESSING",
  "PENDING_FULFILLMENT",
  "ISSUED",
  "FAILED",
];
const LIMIT = 50;

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    PROCESSING: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    PENDING_FULFILLMENT: "bg-purple-400/10 text-purple-400 border-purple-400/20",
    ISSUED: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    FAILED: "bg-rose-400/10 text-rose-400 border-rose-400/20",
  };
  return map[status] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20";
}

export default function GiftcardsPage() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;

  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedGiftcards | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getGiftcards(token, {
        status: status || undefined,
        page,
        limit: LIMIT,
      });
      setResult(res);
    } catch (e) {
      if (e instanceof SessionRevokedError) {
        window.location.href = "/api/force-logout";
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load giftcards");
    } finally {
      setLoading(false);
    }
  }, [token, status, page]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const cards: AdminGiftcard[] = result?.data ?? [];
  const total = result?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Giftcards</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total.toLocaleString()} redemptions • manual approve / reject
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
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            Loading…
          </div>
        ) : cards.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            No giftcards match
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0d1117] text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">User</th>
                  <th className="text-left px-5 py-3 font-medium">Brand</th>
                  <th className="text-right px-5 py-3 font-medium">Amount</th>
                  <th className="text-right px-5 py-3 font-medium">Coins</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Requested</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c) => (
                  <tr key={c.id} className="border-t border-[#1e2530]">
                    <td className="px-5 py-3">
                      <Link
                        href={`/users/${c.userId}`}
                        className="text-white hover:text-[#C6FF00]"
                      >
                        {c.userName || c.userEmail || c.userId}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-300">
                      {c.giftcardType}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-white">
                      ${c.dollarValue}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-[#C6FF00]">
                      {(c.coinsSpent ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${statusBadge(
                          c.status,
                        )}`}
                      >
                        {c.status}
                      </span>
                      {c.failReason && (
                        <div className="text-xs text-rose-400 mt-1 max-w-[240px] truncate">
                          {c.failReason}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {c.requestedAt
                        ? new Date(c.requestedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {["PENDING", "PENDING_FULFILLMENT"].includes(c.status) && (
                        <GiftcardActions id={c.id} />
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
          label="giftcards"
          onChange={setPage}
        />
      </div>
    </div>
  );
}
