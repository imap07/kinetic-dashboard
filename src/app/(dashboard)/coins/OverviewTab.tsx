"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Wallet,
  ShoppingCart,
  Gift,
  Trophy,
  Crown,
  Coins as CoinsIcon,
} from "lucide-react";
import {
  getCoinsOverview,
  SessionRevokedError,
  type CoinsOverview,
} from "@/lib/api";

function fmt(n: number) {
  return n.toLocaleString();
}

function StatRow({ label, value, mono = true }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-400">{label}</span>
      <span className={`text-white ${mono ? "tabular-nums font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function Card({
  title,
  subtitle,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#111318] border border-[#1e2530] rounded-xl p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#C6FF00]/10 border border-[#C6FF00]/20">
          <Icon className="w-4 h-4 text-[#C6FF00]" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {accent && (
          <span className="ml-auto text-xs font-mono text-[#C6FF00] tabular-nums">{accent}</span>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

const TIER_COLORS: Record<string, string> = {
  none: "text-gray-500",
  bronze: "text-amber-700",
  silver: "text-gray-300",
  gold: "text-yellow-400",
  diamond: "text-cyan-300",
  legend: "text-fuchsia-400",
};

export function OverviewTab() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;
  const [data, setData] = useState<CoinsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getCoinsOverview(token));
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-[#111318] border border-[#1e2530] rounded-xl p-5 h-44 animate-pulse" />
        ))}
      </div>
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

  const { circulation, purchases, subscriptionGrants, kineticFee, redemptions, tiers } = data;
  const totalUserTier = Object.values(tiers).reduce((s, n) => s + n, 0) || 1;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card
          title="In circulation"
          subtitle={`${fmt(circulation.wallets)} wallets`}
          icon={Wallet}
          accent={fmt(circulation.balance)}
        >
          <StatRow label="Earned coins" value={fmt(circulation.earned)} />
          <StatRow label="Purchased coins" value={fmt(circulation.purchased)} />
          <StatRow label="Locked (escrow)" value={fmt(circulation.locked)} />
          <div className="h-px bg-[#1e2530] my-1" />
          <StatRow label="Total earned (lifetime)" value={fmt(circulation.totalEarnedLifetime)} />
          <StatRow label="Total spent (lifetime)" value={fmt(circulation.totalSpentLifetime)} />
        </Card>

        <Card
          title="Coin purchases (IAP)"
          subtitle="Lifetime credited via store"
          icon={ShoppingCart}
          accent={fmt(purchases.totalCoinsCredited)}
        >
          <StatRow label="Transactions" value={fmt(purchases.transactionCount)} />
          <StatRow label="Avg coins per purchase" value={
            purchases.transactionCount === 0
              ? "—"
              : fmt(Math.round(purchases.totalCoinsCredited / purchases.transactionCount))
          } />
        </Card>

        <Card
          title="Pro subscription grants"
          subtitle="50 coins/mo per renewal"
          icon={Crown}
          accent={fmt(subscriptionGrants.totalCoinsCredited)}
        >
          <StatRow label="Grants delivered" value={fmt(subscriptionGrants.transactionCount)} />
          <StatRow label="Avg coins / grant" value={
            subscriptionGrants.transactionCount === 0
              ? "—"
              : fmt(Math.round(subscriptionGrants.totalCoinsCredited / subscriptionGrants.transactionCount))
          } />
        </Card>

        <Card
          title="Kinetic league fee"
          subtitle="10% sink of paid leagues"
          icon={Trophy}
          accent={fmt(kineticFee.totalCoins)}
        >
          <StatRow label="Completed paid leagues" value={fmt(kineticFee.completedLeagues)} />
          <StatRow
            label="Avg fee per league"
            value={
              kineticFee.completedLeagues === 0
                ? "—"
                : fmt(Math.round(kineticFee.totalCoins / kineticFee.completedLeagues))
            }
          />
        </Card>

        <Card
          title="Gift card redemptions"
          subtitle="Cost obligation"
          icon={Gift}
          accent={`$${redemptions.totalDollars.toLocaleString()}`}
        >
          <StatRow label="Coins burned" value={fmt(redemptions.totalCoins)} />
          {Object.entries(redemptions.byStatus).map(([status, v]) => (
            <StatRow
              key={status}
              label={status}
              value={`${fmt(v.count)} · $${v.dollars.toLocaleString()}`}
            />
          ))}
          {Object.keys(redemptions.byStatus).length === 0 && (
            <p className="text-xs text-gray-500">No redemptions yet.</p>
          )}
        </Card>

        <Card title="Reward tier distribution" subtitle="Users by milestone tier" icon={CoinsIcon}>
          {(["none", "bronze", "silver", "gold", "diamond", "legend"] as const).map((tier) => {
            const count = tiers[tier] ?? 0;
            const pct = Math.round((count / totalUserTier) * 1000) / 10;
            return (
              <div key={tier} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={`capitalize ${TIER_COLORS[tier]}`}>{tier}</span>
                  <span className="text-white font-mono tabular-nums">
                    {fmt(count)} <span className="text-gray-500 ml-1">{pct}%</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#1e2530] overflow-hidden">
                  <div
                    className="h-full bg-[#C6FF00]/60"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
