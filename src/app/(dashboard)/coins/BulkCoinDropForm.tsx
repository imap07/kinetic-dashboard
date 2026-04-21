"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { bulkCoinDrop, type BulkCoinDropResult } from "@/lib/api";

export function BulkCoinDropForm() {
  const { data: session } = useSession();

  const [userIds, setUserIds] = useState("");
  const [amount, setAmount] = useState(100);
  const [reason, setReason] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkCoinDropResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!session?.accessToken) return;
    const ids = userIds.split(/[\s,]+/).filter(Boolean);
    if (ids.length === 0 || !reason || amount === 0) {
      setError("User IDs, amount and reason required");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await bulkCoinDrop(session.accessToken, {
        userIds: ids,
        amount,
        reason,
        dryRun,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2 text-sm rounded-md bg-[#0d1117] border border-[#1e2530] text-white placeholder-gray-600 focus:outline-none focus:border-[#C6FF00]/50";

  return (
    <div className="bg-[#111318] border border-[#1e2530] rounded-xl p-6 space-y-4 max-w-2xl">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          User IDs (comma or whitespace separated)
        </label>
        <textarea
          value={userIds}
          onChange={(e) => setUserIds(e.target.value)}
          rows={4}
          className={inputCls}
          placeholder="userId1, userId2, userId3…"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Amount (±)
          </label>
          <input
            type="number"
            min={-10000}
            max={10000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className={inputCls}
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
            />
            Dry run
          </label>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          Reason (shown in tx history)
        </label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Launch promo Feb 2026"
          className={inputCls}
        />
      </div>

      <button
        onClick={() => {
          if (
            dryRun ||
            confirm(`Credit ${amount} coins to ${userIds.split(/[\s,]+/).filter(Boolean).length} users? This cannot be undone.`)
          )
            run();
        }}
        disabled={loading}
        className="px-4 py-2 text-sm font-medium rounded-md bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/30 hover:bg-[#C6FF00]/20 disabled:opacity-50"
      >
        {dryRun ? "Dry run" : "Credit for real"}
      </button>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-[#1e2530] bg-[#0d1117] px-4 py-3 text-sm">
          <div className="text-xs text-gray-500 mb-1">Drop result</div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-white">
                {result.targetCount}
              </div>
              <div className="text-[10px] text-gray-500">Targeted</div>
            </div>
            <div>
              <div className="text-xl font-bold text-[#C6FF00]">
                {result.applied.toLocaleString()}
              </div>
              <div className="text-[10px] text-gray-500">Applied</div>
            </div>
            <div>
              <div className="text-xl font-bold text-rose-400">
                {result.failed}
              </div>
              <div className="text-[10px] text-gray-500">Failed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
