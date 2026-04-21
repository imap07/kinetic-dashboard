"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { unblockReferral, forceRewardReferral } from "@/lib/api";

export function ReferralModActions({ id }: { id: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "unblock" | "reward") {
    if (!session?.accessToken) return;
    const label = action === "unblock" ? "unblock (re-pend)" : "force reward (credit both sides)";
    if (!confirm(`Confirm ${label}?`)) return;
    setLoading(true);
    setError(null);
    try {
      if (action === "unblock") {
        await unblockReferral(session.accessToken, id);
      } else {
        await forceRewardReferral(session.accessToken, id);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        <button
          onClick={() => run("unblock")}
          disabled={loading}
          className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-400/10 text-blue-400 border border-blue-400/20 hover:bg-blue-400/20 disabled:opacity-50"
        >
          Unblock
        </button>
        <button
          onClick={() => run("reward")}
          disabled={loading}
          className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/30 hover:bg-[#C6FF00]/20 disabled:opacity-50"
        >
          Force reward
        </button>
      </div>
      {error && <span className="text-[10px] text-rose-400">{error}</span>}
    </div>
  );
}
