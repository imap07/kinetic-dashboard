"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { getUsers, SessionRevokedError } from "@/lib/api";
import type { AdminUser, PaginatedUsers } from "@/lib/api";
import {
  computeUserQuality,
  getLoginChannel,
  isDisposableEmail,
  type QualityBadge as QualityBadgeInfo,
  type ChannelBadge as ChannelBadgeInfo,
} from "@/lib/quality";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// ─── Tailwind class maps for the quality + channel pills ─────────────────────
// Keeping them as a static lookup so Tailwind's JIT picks up the full class
// strings at build time (dynamic classnames get purged otherwise).
const QUALITY_TONE_CLASSES: Record<QualityBadgeInfo["tone"], string> = {
  lime: "bg-[#C6FF00]/10 text-[#C6FF00] border-[#C6FF00]/20",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  gray: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const CHANNEL_TONE_CLASSES: Record<ChannelBadgeInfo["tone"], string> = {
  black: "bg-white/5 text-gray-100 border-white/10",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  slate: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  gray: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

type FilterType = "all" | "active" | "banned" | "premium" | "deleted";

const HARD_DELETE_GRACE_DAYS = 30;

function daysUntilHardDelete(deletedAt: string): number {
  const deletedMs = new Date(deletedAt).getTime();
  const elapsedDays = (Date.now() - deletedMs) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(HARD_DELETE_GRACE_DAYS - elapsedDays));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
];

function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[#1e2530]">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-2.5 w-36" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><Skeleton className="h-3 w-32" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-12 rounded-full" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full" /></td>
      <td className="px-4 py-3"><Skeleton className="h-3 w-20" /></td>
    </tr>
  );
}

export default function UsersPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    const token = (session as { accessToken?: string })?.accessToken;
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: 50 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filter === "active") params.isActive = "true";
      if (filter === "banned") params.isActive = "false";
      if (filter === "premium") params.isPremium = "true";
      if (filter === "deleted") params.deleted = "true";

      const data = await getUsers(token, params as Parameters<typeof getUsers>[1]);
      setResult(data);
    } catch (e) {
      if (e instanceof SessionRevokedError) {
        // Stale session — bounce to /login via force-logout route
        window.location.href = "/api/force-logout";
        return;
      }
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [session, page, debouncedSearch, filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = result ? Math.ceil(result.total / 50) : 1;

  const filterButtons: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Banned", value: "banned" },
    { label: "Premium", value: "premium" },
    { label: "Deleted", value: "deleted" },
  ];

  function handleFilterChange(f: FilterType) {
    setFilter(f);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage and inspect platform users
          </p>
        </div>
        {result && (
          <span className="text-xs text-gray-500">
            {result.total.toLocaleString()} total
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="bg-[#111318] border border-[#1e2530] rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[#1e2530]">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0B0E11] border border-[#1e2530] text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/30 focus:border-[#C6FF00]/40 transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => handleFilterChange(btn.value)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === btn.value
                    ? "bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/20"
                    : "text-gray-500 hover:text-gray-300 border border-transparent"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e2530] bg-[#0d1117]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Channel
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Quality
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                : result?.data.map((user) => (
                    <UserRow
                      key={user._id}
                      user={user}
                      onClick={() => router.push(`/users/${user._id}`)}
                    />
                  ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {!loading && (!result?.data.length) && (
          <div className="flex flex-col items-center justify-center py-12 border-t border-[#1e2530]">
            <Users className="w-10 h-10 text-gray-700 mb-3" />
            <p className="text-sm font-medium text-gray-400">No users found</p>
            <p className="text-xs text-gray-600 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Pagination */}
        {result && result.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e2530]">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages} &mdash; {result.total.toLocaleString()} users
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#1e2530] text-gray-400 hover:text-gray-100 hover:border-[#2a3340] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#1e2530] text-gray-400 hover:text-gray-100 hover:border-[#2a3340] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UserRow({ user, onClick }: { user: AdminUser; onClick: () => void }) {
  const uid = user._id;
  const initials = getInitials(user.displayName || user.email || "?");
  const bgColor = avatarColor(uid);
  const isDeleted = !!user.deletedAt;
  const isBanned = user.isBanned ?? (user.isActive === false);
  const isPremium = user.isPremium;
  const quality = computeUserQuality(user);
  const channel = getLoginChannel(user);
  const disposable = isDisposableEmail(user.email);

  return (
    <tr
      className="border-b border-[#1e2530] hover:bg-white/[0.02] cursor-pointer transition-colors"
      onClick={onClick}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${bgColor} text-white text-xs font-bold shrink-0`}
          >
            {initials}
          </div>
          <div>
            <p className="font-medium text-gray-100 leading-none">
              {user.displayName || user.username || "—"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-400 text-xs">
        <div className="flex items-center gap-1.5">
          <span>{user.email}</span>
          {disposable && (
            <span
              className="text-[9px] uppercase tracking-wider font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1 py-0.5 rounded"
              title="Disposable email domain"
            >
              Temp
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {channel ? (
          <Badge
            className={`${CHANNEL_TONE_CLASSES[channel.tone]} border text-[10px] uppercase tracking-wide font-semibold hover:bg-transparent`}
          >
            {channel.label}
          </Badge>
        ) : (
          <span className="text-gray-700 text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge
          title={quality.tooltip}
          className={`${QUALITY_TONE_CLASSES[quality.tone]} border text-[10px] uppercase tracking-wide font-semibold hover:bg-transparent`}
        >
          {quality.label}
        </Badge>
      </td>
      <td className="px-4 py-3">
        {isPremium ? (
          <Badge className="bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/20 hover:bg-[#C6FF00]/10 text-[10px] uppercase tracking-wide font-semibold">
            Pro
          </Badge>
        ) : (
          <Badge variant="outline" className="text-gray-500 border-gray-700 text-[10px] uppercase tracking-wide">
            Free
          </Badge>
        )}
      </td>
      <td className="px-4 py-3">
        {isDeleted ? (
          <Badge
            title={`Soft-deleted on ${new Date(user.deletedAt!).toLocaleString()} — hard-delete in ${daysUntilHardDelete(user.deletedAt!)}d`}
            className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/10 text-[10px] uppercase tracking-wide font-semibold"
          >
            Deleted · {daysUntilHardDelete(user.deletedAt!)}d
          </Badge>
        ) : isBanned ? (
          <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/10 text-[10px] uppercase tracking-wide font-semibold">
            Banned
          </Badge>
        ) : (
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 text-[10px] uppercase tracking-wide font-semibold">
            Active
          </Badge>
        )}
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
    </tr>
  );
}
