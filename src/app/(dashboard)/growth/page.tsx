import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  TrendingUp,
  Users2,
  Send,
  Share2,
  Flame,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { auth } from "@/lib/auth";
import {
  getActivationFunnel,
  getRetention,
  getPushVolume,
  getAcquisition,
  getStreakDistribution,
  getMonetization,
  SessionRevokedError,
} from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Growth",
};

async function requireToken() {
  const session = await auth();
  if (!session?.accessToken) redirect("/api/force-logout");
  return session.accessToken;
}

function handleErr(e: unknown): string {
  if (e instanceof SessionRevokedError) redirect("/api/force-logout");
  return e instanceof Error ? e.message : "Failed to load";
}

function Card({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#111318] border border-[#1e2530] rounded-xl p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#C6FF00]/10 border border-[#C6FF00]/20">
          <Icon className="w-4 h-4 text-[#C6FF00]" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="bg-[#111318] border border-[#1e2530] rounded-xl p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}

// ─── 1. Activation funnel ─────────────────────────────────────────
async function ActivationFunnelCard() {
  const token = await requireToken();
  let data;
  try {
    data = await getActivationFunnel(token, 30);
  } catch (e) {
    return <ErrorCard title="Activation funnel" message={handleErr(e)} />;
  }
  const top = data.steps[0]?.count ?? 0;
  return (
    <Card
      title="Activation funnel"
      subtitle={`Users signed up in last ${data.windowDays}d`}
      icon={TrendingUp}
    >
      <div className="space-y-2">
        {data.steps.map((s, i) => {
          const pct = top === 0 ? 0 : Math.round((s.count / top) * 100);
          const prev = i === 0 ? null : data.steps[i - 1].count;
          const dropPct =
            prev && prev > 0 ? Math.round(((prev - s.count) / prev) * 100) : 0;
          return (
            <div key={s.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">{s.label}</span>
                <span className="font-mono text-white tabular-nums">
                  {s.count.toLocaleString()}
                  <span className="text-gray-500 ml-2">{pct}%</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#1e2530] overflow-hidden">
                <div
                  className="h-full bg-[#C6FF00]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {i > 0 && dropPct > 0 && (
                <div className="text-[10px] text-red-400 text-right">
                  −{dropPct}% drop from prev
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── 2. Retention cohorts ─────────────────────────────────────────
async function RetentionCard() {
  const token = await requireToken();
  let data;
  try {
    data = await getRetention(token, 8);
  } catch (e) {
    return <ErrorCard title="Retention cohorts" message={handleErr(e)} />;
  }
  return (
    <Card
      title="Retention cohorts"
      subtitle="Signup week → % still picking at day N"
      icon={Users2}
    >
      {data.cohorts.length === 0 ? (
        <p className="text-xs text-gray-500">No cohort data yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 text-left">
                <th className="py-1.5 pr-2 font-medium">Week</th>
                <th className="py-1.5 pr-2 font-medium text-right">Size</th>
                <th className="py-1.5 pr-2 font-medium text-right">D1</th>
                <th className="py-1.5 pr-2 font-medium text-right">D7</th>
                <th className="py-1.5 font-medium text-right">D30</th>
              </tr>
            </thead>
            <tbody>
              {data.cohorts.map((c) => {
                const pct = (n: number) =>
                  c.size === 0 ? 0 : Math.round((n / c.size) * 100);
                return (
                  <tr key={c.weekStart} className="border-t border-[#1e2530]">
                    <td className="py-1.5 pr-2 text-gray-300 font-mono">
                      {c.weekStart}
                    </td>
                    <td className="py-1.5 pr-2 text-right text-white tabular-nums">
                      {c.size}
                    </td>
                    <td className="py-1.5 pr-2 text-right text-white tabular-nums">
                      {pct(c.d1)}%
                    </td>
                    <td className="py-1.5 pr-2 text-right text-white tabular-nums">
                      {pct(c.d7)}%
                    </td>
                    <td className="py-1.5 text-right text-white tabular-nums">
                      {pct(c.d30)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ─── 3. Push volume ───────────────────────────────────────────────
async function PushVolumeCard() {
  const token = await requireToken();
  let data;
  try {
    data = await getPushVolume(token, 30);
  } catch (e) {
    return <ErrorCard title="Push volume" message={handleErr(e)} />;
  }
  const max = data.rows[0]?.sent ?? 0;
  return (
    <Card
      title="Push volume & CTR by type"
      subtitle={`Last ${data.windowDays}d · sends vs taps (in-app tracked)`}
      icon={Send}
    >
      {data.rows.length === 0 ? (
        <p className="text-xs text-gray-500">No pushes sent in window.</p>
      ) : (
        <div className="space-y-2">
          {data.rows.map((r) => {
            const pct = max === 0 ? 0 : Math.round((r.sent / max) * 100);
            const ctrColor =
              r.ctr >= 15
                ? "text-emerald-400"
                : r.ctr >= 5
                ? "text-yellow-400"
                : "text-gray-500";
            return (
              <div key={r.type}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300 font-mono">{r.type}</span>
                  <span className="font-mono tabular-nums flex gap-3">
                    <span className="text-white">
                      {r.sent.toLocaleString()}
                    </span>
                    <span className="text-gray-500">
                      {r.opened.toLocaleString()} opens
                    </span>
                    <span className={ctrColor}>{r.ctr}%</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#1e2530] overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-blue-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── 6. Monetization ──────────────────────────────────────────────
async function MonetizationCard() {
  const token = await requireToken();
  let data;
  try {
    data = await getMonetization(token);
  } catch (e) {
    return <ErrorCard title="Monetization" message={handleErr(e)} />;
  }
  const tierTotal = data.monthly + data.annual + data.unknownTier;
  const pct = (n: number) =>
    tierTotal === 0 ? 0 : Math.round((n / tierTotal) * 100);
  return (
    <Card
      title="Monetization"
      subtitle="Active Pro subscribers · estimated MRR"
      icon={DollarSign}
    >
      <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#1e2530]">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">
            Pro subscribers
          </p>
          <p className="text-2xl font-bold text-white tabular-nums mt-0.5">
            {data.totalPro}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">
            Estimated MRR
          </p>
          <p className="text-2xl font-bold text-[#C6FF00] tabular-nums mt-0.5">
            ${data.mrrUsd.toFixed(2)}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            ARPU ${data.arpuUsd.toFixed(2)} / Pro
          </p>
        </div>
      </div>
      <div className="space-y-1.5 pt-3">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
          Tier split
        </p>
        {[
          {
            label: `Monthly · $${data.pricing.monthly}`,
            count: data.monthly,
            color: "bg-emerald-400",
          },
          {
            label: `Annual · $${data.pricing.annual}`,
            count: data.annual,
            color: "bg-purple-400",
          },
          {
            label: "Unknown (pre-tracking)",
            count: data.unknownTier,
            color: "bg-gray-500",
          },
        ].map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300">{row.label}</span>
              <span className="font-mono text-white tabular-nums">
                {row.count}
                <span className="text-gray-500 ml-2">{pct(row.count)}%</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[#1e2530] overflow-hidden mt-0.5">
              <div
                className={`h-full ${row.color}`}
                style={{ width: `${pct(row.count)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 4. Acquisition breakdown ─────────────────────────────────────
async function AcquisitionCard() {
  const token = await requireToken();
  let data;
  try {
    data = await getAcquisition(token, 30);
  } catch (e) {
    return <ErrorCard title="Acquisition" message={handleErr(e)} />;
  }
  return (
    <Card
      title="Acquisition source"
      subtitle={`Last ${data.windowDays}d (${data.total} signups)`}
      icon={Share2}
    >
      {data.rows.length === 0 ? (
        <p className="text-xs text-gray-500">No signups in window.</p>
      ) : (
        <div className="space-y-1.5">
          {data.rows.map((r) => (
            <div key={r.source}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-mono">{r.source}</span>
                <span className="font-mono text-white tabular-nums">
                  {r.count}
                  <span className="text-gray-500 ml-2">{r.pctOfTotal}%</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[#1e2530] overflow-hidden mt-0.5">
                <div
                  className="h-full bg-purple-400"
                  style={{ width: `${r.pctOfTotal}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── 5. Streak distribution ───────────────────────────────────────
async function StreakCard() {
  const token = await requireToken();
  let data;
  try {
    data = await getStreakDistribution(token);
  } catch (e) {
    return <ErrorCard title="Streaks" message={handleErr(e)} />;
  }
  const max = Math.max(...data.buckets.map((b) => b.count), 1);
  return (
    <Card
      title="Streak distribution"
      subtitle="Current streak length · active users"
      icon={Flame}
    >
      <div className="space-y-1.5 mb-4">
        {data.buckets.map((b) => {
          const pct = Math.round((b.count / max) * 100);
          return (
            <div key={b.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-mono">
                  {b.label === "14+" ? "14+ 🔥" : `${b.label} days`}
                </span>
                <span className="font-mono text-white tabular-nums">
                  {b.count}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[#1e2530] overflow-hidden mt-0.5">
                <div
                  className="h-full bg-orange-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#1e2530]">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">
            At risk today
          </p>
          <p className="text-xl font-bold text-white tabular-nums mt-0.5">
            {data.atRiskToday}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">streak-save targets</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">
            Reactivation pool
          </p>
          <p className="text-xl font-bold text-white tabular-nums mt-0.5">
            {data.reactivationCandidates}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">3-7 days inactive</p>
        </div>
      </div>
    </Card>
  );
}

function ErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="bg-[#111318] border border-red-500/20 rounded-xl p-5">
      <div className="flex items-center gap-2.5 mb-2">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <p className="text-xs text-red-400">{message}</p>
    </div>
  );
}

export default function GrowthPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Growth</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Activation, retention, and engagement health
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Suspense fallback={<CardSkeleton />}>
          <ActivationFunnelCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <RetentionCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <PushVolumeCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <AcquisitionCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <StreakCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <MonetizationCard />
        </Suspense>
      </div>
    </div>
  );
}
