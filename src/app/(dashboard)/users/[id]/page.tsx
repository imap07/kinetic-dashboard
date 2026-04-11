"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Star,
  Ban,
  LogOut,
  Coins,
  CheckCircle2,
  Percent,
  Zap,
  Hash,
} from "lucide-react";
import {
  getUserDetail,
  banUser,
  unbanUser,
  forceLogout,
  adjustCoins,
} from "@/lib/api";
import type { AdminUser } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "from-blue-500 to-blue-700",
  "from-purple-500 to-purple-700",
  "from-emerald-500 to-emerald-700",
  "from-amber-500 to-amber-700",
  "from-rose-500 to-rose-700",
  "from-indigo-500 to-indigo-700",
];

function avatarGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type DialogType = "ban" | "unban" | "logout" | "coins" | null;

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [coinAmount, setCoinAmount] = useState(0);
  const [coinReason, setCoinReason] = useState("");

  const token = (session as { accessToken?: string })?.accessToken;

  const fetchUser = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserDetail(token, id);
      setUser(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  async function handleAction() {
    if (!token || !user) return;
    setActionLoading(true);
    try {
      const uid = user._id;
      if (dialogType === "ban") {
        await banUser(token, uid, banReason);
        toast({ title: "User banned", description: banReason });
      } else if (dialogType === "unban") {
        await unbanUser(token, uid);
        toast({ title: "User unbanned" });
      } else if (dialogType === "logout") {
        await forceLogout(token, uid);
        toast({ title: "User force-logged out" });
      } else if (dialogType === "coins") {
        await adjustCoins(token, uid, coinAmount, coinReason);
        toast({
          title: "Coins adjusted",
          description: `${coinAmount > 0 ? "+" : ""}${coinAmount} — ${coinReason}`,
        });
      }
      setDialogType(null);
      setBanReason("");
      setCoinAmount(0);
      setCoinReason("");
      await fetchUser();
    } catch (e) {
      toast({
        title: "Action failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  }

  const isBanned = user?.isBanned ?? (user?.isActive === false);
  const correctPct =
    user && user.totalPredictions && user.totalPredictions > 0
      ? Math.round(((user.correctPredictions ?? 0) / user.totalPredictions) * 100)
      : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/users"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to users
      </Link>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        {loading ? (
          <>
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-52" />
            </div>
          </>
        ) : user ? (
          <>
            <div
              className={`flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradient(user._id)} text-white text-xl font-bold shrink-0`}
            >
              {getInitials(user.displayName || user.email || "?")}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white">
                  {user.displayName || user.username || "Unknown"}
                </h1>
                {user.isPremium && (
                  <Badge className="bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/20 text-[10px] uppercase tracking-wide font-semibold hover:bg-[#C6FF00]/10">
                    Pro
                  </Badge>
                )}
                {user.role === "admin" && (
                  <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] uppercase tracking-wide font-semibold hover:bg-blue-500/10">
                    Admin
                  </Badge>
                )}
                {isBanned && (
                  <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] uppercase tracking-wide font-semibold hover:bg-red-500/10">
                    Banned
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
            </div>
          </>
        ) : null}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-[#111318] border border-[#1e2530] rounded-xl p-4">
              <Skeleton className="h-4 w-4 mb-3" />
              <Skeleton className="h-6 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))
        ) : user ? (
          [
            {
              label: "Total Points",
              value: (user.totalPoints ?? 0).toLocaleString(),
              icon: Star,
              color: "text-[#C6FF00]",
            },
            {
              label: "Predictions",
              value: (user.totalPredictions ?? 0).toLocaleString(),
              icon: Hash,
              color: "text-blue-400",
            },
            {
              label: "Correct %",
              value: `${correctPct}%`,
              icon: Percent,
              color: "text-emerald-400",
            },
            {
              label: "Streak",
              value: user.currentStreak ?? 0,
              icon: Zap,
              color: "text-amber-400",
            },
            {
              label: "Logins",
              value: (user.loginCount ?? 0).toLocaleString(),
              icon: CheckCircle2,
              color: "text-purple-400",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-[#111318] border border-[#1e2530] rounded-xl p-4"
            >
              <Icon className={`w-4 h-4 ${color} mb-3`} />
              <p className="text-lg font-bold text-white tabular-nums">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))
        ) : null}
      </div>

      {/* Details card */}
      {user && (
        <div className="bg-[#111318] border border-[#1e2530] rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300">Account Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <DetailRow
              label="Last login"
              value={
                user.lastLoginAt
                  ? `${new Date(user.lastLoginAt).toLocaleString()}${user.lastLoginCountry ? ` ${user.lastLoginCountry}` : ""}${user.lastLoginProvider ? ` via ${user.lastLoginProvider}` : ""}`
                  : "—"
              }
            />
            <DetailRow
              label="Coins balance"
              value={
                user.kineticCoins !== undefined
                  ? user.kineticCoins.toLocaleString()
                  : "—"
              }
            />
            <DetailRow
              label="Plan"
              value={user.plan ?? (user.isPremium ? "Pro" : "Free")}
            />
            <DetailRow
              label="Member since"
              value={new Date(user.createdAt).toLocaleDateString()}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      {user && (
        <div className="bg-[#111318] border border-[#1e2530] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              disabled={isBanned}
              onClick={() => setDialogType("ban")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Ban className="w-3.5 h-3.5" />
              Ban User
            </button>
            <button
              disabled={!isBanned}
              onClick={() => setDialogType("unban")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Shield className="w-3.5 h-3.5" />
              Unban User
            </button>
            <button
              onClick={() => setDialogType("logout")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Force Logout
            </button>
            <button
              onClick={() => setDialogType("coins")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 transition-all"
            >
              <Coins className="w-3.5 h-3.5" />
              Adjust Coins
            </button>
          </div>
        </div>
      )}

      {/* Ban dialog */}
      <Dialog open={dialogType === "ban"} onOpenChange={(o) => !o && setDialogType(null)}>
        <DialogContent className="bg-[#111318] border border-[#1e2530] text-white">
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription className="text-gray-400">
              This will prevent {user?.displayName || user?.email} from accessing the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400">
              Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Reason for ban..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[#0B0E11] border border-[#1e2530] text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/30 resize-none"
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setDialogType(null)}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={!banReason.trim() || actionLoading}
              onClick={handleAction}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {actionLoading ? "Banning..." : "Ban User"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unban dialog */}
      <Dialog open={dialogType === "unban"} onOpenChange={(o) => !o && setDialogType(null)}>
        <DialogContent className="bg-[#111318] border border-[#1e2530] text-white">
          <DialogHeader>
            <DialogTitle>Unban User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Restore access for {user?.displayName || user?.email}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setDialogType(null)}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={actionLoading}
              onClick={handleAction}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {actionLoading ? "Unbanning..." : "Unban User"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force logout dialog */}
      <Dialog open={dialogType === "logout"} onOpenChange={(o) => !o && setDialogType(null)}>
        <DialogContent className="bg-[#111318] border border-[#1e2530] text-white">
          <DialogHeader>
            <DialogTitle>Force Logout</DialogTitle>
            <DialogDescription className="text-gray-400">
              All active sessions for {user?.displayName || user?.email} will be invalidated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setDialogType(null)}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={actionLoading}
              onClick={handleAction}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-[#0B0E11] hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {actionLoading ? "Logging out..." : "Force Logout"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust coins dialog */}
      <Dialog open={dialogType === "coins"} onOpenChange={(o) => !o && setDialogType(null)}>
        <DialogContent className="bg-[#111318] border border-[#1e2530] text-white">
          <DialogHeader>
            <DialogTitle>Adjust KineticCoins</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter a positive or negative amount (−10,000 to +10,000).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400">Amount</label>
              <input
                type="number"
                min={-10000}
                max={10000}
                value={coinAmount}
                onChange={(e) => setCoinAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#0B0E11] border border-[#1e2530] text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400">
                Reason <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={coinReason}
                onChange={(e) => setCoinReason(e.target.value)}
                placeholder="Reason for adjustment..."
                className="w-full px-3 py-2 rounded-lg bg-[#0B0E11] border border-[#1e2530] text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/30"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setDialogType(null)}
              className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={
                !coinReason.trim() ||
                coinAmount === 0 ||
                coinAmount < -10000 ||
                coinAmount > 10000 ||
                actionLoading
              }
              onClick={handleAction}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {actionLoading ? "Adjusting..." : "Apply Adjustment"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm text-gray-200">{value}</span>
    </div>
  );
}
