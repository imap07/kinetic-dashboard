"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { approveGiftcard, rejectGiftcard } from "@/lib/api";

export function GiftcardActions({ id }: { id: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    if (!session?.accessToken) return;
    const code = prompt("Giftcard code (optional):") || undefined;
    setLoading(true);
    setError(null);
    try {
      await approveGiftcard(session.accessToken, id, code);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function reject() {
    if (!session?.accessToken) return;
    const reason = prompt("Rejection reason (refunds coins):");
    if (!reason) return;
    setLoading(true);
    setError(null);
    try {
      await rejectGiftcard(session.accessToken, id, reason);
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
          onClick={approve}
          disabled={loading}
          className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 hover:bg-emerald-400/20 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={reject}
          disabled={loading}
          className="px-2.5 py-1 text-xs font-medium rounded-md bg-rose-400/10 text-rose-400 border border-rose-400/20 hover:bg-rose-400/20 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
      {error && <span className="text-[10px] text-rose-400">{error}</span>}
    </div>
  );
}
