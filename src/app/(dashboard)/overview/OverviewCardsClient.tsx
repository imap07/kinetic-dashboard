"use client";

import { useState } from "react";
import {
  Users,
  Activity,
  Star,
  TrendingUp,
  Calendar,
  Trophy,
  Zap,
  CalendarDays,
  Sunrise,
  Crown,
} from "lucide-react";
import type { OverviewStats, OverviewSegment } from "@/lib/api";
import { SegmentDialog } from "./SegmentDialog";

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  segment?: OverviewSegment;
  onClick?: () => void;
}

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  border,
  segment,
  onClick,
}: KpiCardProps) {
  const clickable = Boolean(segment) && Boolean(onClick);
  // Render an actual <button> only when clickable so screen-readers and
  // keyboard users get the right affordance — and the cursor/border-glow
  // hover state is reserved for cards that actually open something.
  const className = `w-full text-left bg-[#111318] border border-[#1e2530] rounded-xl p-5 transition-colors ${
    clickable
      ? "hover:border-[#C6FF00]/40 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/40"
      : "hover:border-[#2a3340]"
  }`;
  const inner = (
    <>
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
    </>
  );
  if (clickable) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}

interface CardConfig {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  segment?: OverviewSegment;
  segmentTitle?: string;
}

interface OverviewCardsClientProps {
  stats: OverviewStats;
}

export function OverviewCardsClient({ stats }: OverviewCardsClientProps) {
  const [active, setActive] = useState<{
    segment: OverviewSegment;
    title: string;
  } | null>(null);

  const topSignup = stats.topSignupDay;
  const topSignupValue = topSignup
    ? `${topSignup.count} · ${new Date(topSignup.date + "T00:00:00Z").toLocaleDateString(
        undefined,
        { month: "short", day: "numeric", timeZone: "UTC" },
      )}`
    : "—";

  const cards: CardConfig[] = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20",
    },
    {
      label: "DAU · login last 24h",
      value: stats.dau,
      icon: Zap,
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
      border: "border-cyan-400/20",
      segment: "dau",
      segmentTitle: "Daily Active Users (last 24h)",
    },
    {
      label: "WAU · login last 7d",
      value: stats.wau,
      icon: Activity,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/20",
      segment: "wau",
      segmentTitle: "Weekly Active Users (last 7d)",
    },
    {
      label: "MAU · login last 30d",
      value: stats.activeUsers,
      icon: TrendingUp,
      color: "text-teal-400",
      bg: "bg-teal-400/10",
      border: "border-teal-400/20",
      segment: "mau",
      segmentTitle: "Monthly Active Users (last 30d)",
    },
    {
      label: "Premium Users",
      value: stats.premiumUsers,
      icon: Star,
      color: "text-[#C6FF00]",
      bg: "bg-[#C6FF00]/10",
      border: "border-[#C6FF00]/20",
      segment: "premium",
      segmentTitle: "Premium Users",
    },
    {
      label: "New Today",
      value: stats.newUsersToday,
      icon: Sunrise,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      border: "border-orange-400/20",
      segment: "new-today",
      segmentTitle: "New Users Today",
    },
    {
      label: "New This Week · since Monday",
      value: stats.newUsersThisWeek,
      icon: CalendarDays,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-400/20",
      segment: "new-week",
      segmentTitle: "New Users This Week",
    },
    {
      label: "New This Month · calendar",
      value: stats.newUsersThisMonth,
      icon: Calendar,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/20",
      segment: "new-month",
      segmentTitle: "New Users This Month",
    },
    {
      label: "Last 30 days · rolling",
      value: stats.newUsersLast30d,
      icon: TrendingUp,
      color: "text-pink-400",
      bg: "bg-pink-400/10",
      border: "border-pink-400/20",
      segment: "new-last-30d",
      segmentTitle: "New Users · Last 30 days (rolling)",
    },
    {
      label: "Top signup day · last 90d",
      value: topSignupValue,
      icon: Crown,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      border: "border-yellow-400/20",
      segment: "top-signup-day",
      segmentTitle: `Top Signup Day${topSignup ? ` · ${topSignup.date}` : ""}`,
    },
    {
      label: "Active Leagues",
      value: stats.activeLeagues,
      icon: Trophy,
      color: "text-rose-400",
      bg: "bg-rose-400/10",
      border: "border-rose-400/20",
    },
    {
      label: "Users in leagues · unique",
      value: stats.usersInActiveLeagues,
      icon: Users,
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
      border: "border-indigo-400/20",
      segment: "users-in-leagues",
      segmentTitle: "Users in Active Leagues",
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => (
          <KpiCard
            key={card.label}
            {...card}
            onClick={
              card.segment
                ? () =>
                    setActive({
                      segment: card.segment as OverviewSegment,
                      title: card.segmentTitle ?? card.label,
                    })
                : undefined
            }
          />
        ))}
      </div>

      {active ? (
        <SegmentDialog
          segment={active.segment}
          title={active.title}
          open={Boolean(active)}
          onOpenChange={(open) => {
            if (!open) setActive(null);
          }}
        />
      ) : null}
    </>
  );
}
