"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { suspendLeague } from "@/lib/api";

export function SuspendButton({ id }: { id: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function suspend() {
    if (!session?.accessToken) return;
    const reason = prompt(
      "Suspend league — reason (all entry fees will be refunded):",
    );
    if (!reason) return;
    setLoading(true);
    setError(null);
    try {
      await suspendLeague(session.accessToken, id, reason);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        onClick={suspend}
        disabled={loading}
        className="px-2.5 py-1 text-xs font-medium rounded-md bg-rose-400/10 text-rose-400 border border-rose-400/20 hover:bg-rose-400/20 disabled:opacity-50"
      >
        Suspend
      </button>
      {error && <span className="text-[10px] text-rose-400">{error}</span>}
    </div>
  );
}
