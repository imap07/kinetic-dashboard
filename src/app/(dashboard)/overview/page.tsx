import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  Users,
  Activity,
  Star,
  TrendingUp,
  Calendar,
  Trophy,
  ExternalLink,
} from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getStats, SessionRevokedError } from "@/lib/api";
import type { OverviewStats } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Overview",
};

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
}

function KpiCard({ label, value, icon: Icon, color, bg, border }: KpiCardProps) {
  return (
    <div className="bg-[#111318] border border-[#1e2530] rounded-xl p-5 hover:border-[#2a3340] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`flex items-center justify-center w-9 h-9 rounded-lg ${bg} border ${border}`}
        >
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-white tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-xs font-medium text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="bg-[#111318] border border-[#1e2530] rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-9 h-9 rounded-lg" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

async function StatsGrid() {
  const session = await auth();
  const token = session?.accessToken;

  let stats: OverviewStats | null = null;
  let error: string | null = null;

  if (token) {
    try {
      stats = await getStats(token);
    } catch (e) {
      // Stale JWT (tokenVersion changed on the server) — boot the user
      // out to /login via our force-logout route instead of rendering
      // a broken page with a red banner they can't recover from.
      if (e instanceof SessionRevokedError) {
        redirect("/api/force-logout");
      }
      error = e instanceof Error ? e.message : "Failed to load stats";
    }
  } else {
    redirect("/api/force-logout");
  }

  const cards = [
    {
      label: "Total Users",
      value: stats?.totalUsers ?? "—",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20",
    },
    {
      label: "Active Users",
      value: stats?.activeUsers ?? "—",
      icon: Activity,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/20",
    },
    {
      label: "Premium Users",
      value: stats?.premiumUsers ?? "—",
      icon: Star,
      color: "text-[#C6FF00]",
      bg: "bg-[#C6FF00]/10",
      border: "border-[#C6FF00]/20",
    },
    {
      label: "New This Week",
      value: stats?.newUsersLast7d ?? "—",
      icon: TrendingUp,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-400/20",
    },
    {
      label: "New This Month",
      value: stats?.newUsersLast30d ?? "—",
      icon: Calendar,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/20",
    },
    {
      label: "Active Leagues",
      value: stats?.activeLeagues ?? "—",
      icon: Trophy,
      color: "text-rose-400",
      bg: "bg-rose-400/10",
      border: "border-rose-400/20",
    },
  ];

  return (
    <>
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>
    </>
  );
}

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Platform health and key metrics at a glance
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <KpiSkeleton key={i} />
            ))}
          </div>
        }
      >
        <StatsGrid />
      </Suspense>

      {/* Firebase Analytics link card */}
      <Link
        href="https://console.firebase.google.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between bg-[#111318] border border-[#1e2530] rounded-xl p-5 hover:border-[#C6FF00]/30 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-400/10 border border-orange-400/20">
            <Activity className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Firebase Analytics</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Session data, funnel analysis, and retention metrics
            </p>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-[#C6FF00] transition-colors" />
      </Link>
    </div>
  );
}
