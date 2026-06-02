import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Activity, ExternalLink } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getStats, SessionRevokedError } from "@/lib/api";
import type { OverviewStats } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { OverviewCardsClient } from "./OverviewCardsClient";

export const metadata: Metadata = {
  title: "Overview",
};

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

  if (!stats) {
    return (
      <>
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
      </>
    );
  }

  return <OverviewCardsClient stats={stats} />;
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
            {Array.from({ length: 12 }).map((_, i) => (
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
