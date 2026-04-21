"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { setFeatureFlag } from "@/lib/api";

export function FlagToggle({
  flagKey,
  initialValue,
}: {
  flagKey: string;
  initialValue: boolean;
}) {
  const { data: session } = useSession();
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (!session?.accessToken) return;
    setSaving(true);
    setError(null);
    const next = !value;
    try {
      await setFeatureFlag(session.accessToken, flagKey, next);
      setValue(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        onClick={toggle}
        disabled={saving}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? "bg-[#C6FF00]" : "bg-gray-700"
        } ${saving ? "opacity-50" : ""}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      {error && <span className="text-[10px] text-rose-400">{error}</span>}
    </div>
  );
}
