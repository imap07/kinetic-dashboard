"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  getCoinPackages,
  SessionRevokedError,
  type CoinPackagesResponse,
} from "@/lib/api";

export function PackagesTab() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;
  const [data, setData] = useState<CoinPackagesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getCoinPackages(token));
    } catch (e) {
      if (e instanceof SessionRevokedError) {
        window.location.href = "/api/force-logout";
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="bg-[#111318] border border-[#1e2530] rounded-xl p-5 h-44 animate-pulse" />
    );
  }
  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error}
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-[#111318] border border-[#1e2530] rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Packages</p>
          <p className="text-2xl font-bold text-white">{data.totals.packages}</p>
        </div>
        <div className="bg-[#111318] border border-[#1e2530] rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total purchases</p>
          <p className="text-2xl font-bold text-[#C6FF00] tabular-nums font-mono">
            {data.totals.totalPurchases.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#111318] border border-[#1e2530] rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Gross revenue (est.)</p>
          <p className="text-2xl font-bold text-white tabular-nums font-mono">
            ${data.totals.totalGrossRevenueUsd.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-600 mt-1">Pre store cut (15-30%)</p>
        </div>
      </div>

      <div className="bg-[#111318] border border-[#1e2530] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0d1117] text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Product ID</th>
                <th className="text-right px-5 py-3 font-medium">Coins</th>
                <th className="text-right px-5 py-3 font-medium">Bonus</th>
                <th className="text-right px-5 py-3 font-medium">Total</th>
                <th className="text-right px-5 py-3 font-medium">Price</th>
                <th className="text-right px-5 py-3 font-medium">$/coin</th>
                <th className="text-left px-5 py-3 font-medium">Tag</th>
                <th className="text-right px-5 py-3 font-medium">Purchases</th>
                <th className="text-right px-5 py-3 font-medium">Gross USD</th>
              </tr>
            </thead>
            <tbody>
              {data.packages.map((p) => (
                <tr key={p.id} className="border-t border-[#1e2530]">
                  <td className="px-5 py-3 text-white font-mono text-xs">{p.id}</td>
                  <td className="px-5 py-3 text-right text-gray-300 tabular-nums">
                    {p.coins.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right text-[#C6FF00] tabular-nums">
                    {p.bonusCoins > 0 ? `+${p.bonusCoins}` : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-white tabular-nums font-mono">
                    {p.totalCoins.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right text-white tabular-nums font-mono">
                    ${p.priceUsd.toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-400 tabular-nums">
                    ${(p.priceUsd / p.totalCoins).toFixed(4)}
                  </td>
                  <td className="px-5 py-3 text-xs">
                    {p.tag ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border bg-[#C6FF00]/10 text-[#C6FF00] border-[#C6FF00]/20">
                        {p.tag}
                      </span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-white tabular-nums font-mono">
                    {p.purchases.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right text-white tabular-nums font-mono">
                    ${p.grossRevenueUsd.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Purchase counts are inferred from coin-transaction sums grouped by total coins
        credited. They may slightly differ from RevenueCat&apos;s authoritative counts.
      </p>
    </div>
  );
}
