"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  broadcastPush,
  type PushSegment,
  type PushBroadcastResult,
} from "@/lib/api";

const SEGMENTS: PushSegment[] = [
  "all",
  "premium",
  "free",
  "inactive_7d",
  "sport",
  "country",
  "userIds",
];

export function PushBroadcastForm() {
  const { data: session } = useSession();

  const [segment, setSegment] = useState<PushSegment>("all");
  const [sport, setSport] = useState("");
  const [country, setCountry] = useState("");
  const [userIds, setUserIds] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PushBroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(dryRun: boolean) {
    if (!session?.accessToken) return;
    if (!title || !body) {
      setError("Title and body required");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await broadcastPush(session.accessToken, {
        segment,
        title,
        body,
        dryRun,
        sport: segment === "sport" ? sport : undefined,
        country: segment === "country" ? country : undefined,
        userIds:
          segment === "userIds"
            ? userIds.split(/[\s,]+/).filter(Boolean)
            : undefined,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2 text-sm rounded-md bg-[#0d1117] border border-[#1e2530] text-white placeholder-gray-600 focus:outline-none focus:border-[#C6FF00]/50";

  return (
    <div className="bg-[#111318] border border-[#1e2530] rounded-xl p-6 space-y-4 max-w-2xl">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          Segment
        </label>
        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value as PushSegment)}
          className={inputCls}
        >
          {SEGMENTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {segment === "sport" && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Sport
          </label>
          <input
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            placeholder="football, basketball, hockey..."
            className={inputCls}
          />
        </div>
      )}

      {segment === "country" && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Country code (ISO-2)
          </label>
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="US, CA, MX..."
            className={inputCls}
          />
        </div>
      )}

      {segment === "userIds" && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            User IDs (comma or space separated)
          </label>
          <textarea
            value={userIds}
            onChange={(e) => setUserIds(e.target.value)}
            rows={3}
            className={inputCls}
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputCls}
          maxLength={64}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          Body
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className={inputCls}
          maxLength={180}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => send(true)}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium rounded-md bg-blue-400/10 text-blue-400 border border-blue-400/20 hover:bg-blue-400/20 disabled:opacity-50"
        >
          Dry run
        </button>
        <button
          onClick={() => {
            if (confirm(`Send real push to ${segment}?`)) send(false);
          }}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium rounded-md bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/30 hover:bg-[#C6FF00]/20 disabled:opacity-50"
        >
          Send for real
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-[#1e2530] bg-[#0d1117] px-4 py-3 text-sm">
          <div className="text-xs text-gray-500 mb-1">
            {result.dryRun ? "Dry run — nothing sent" : "Broadcast complete"}
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-white">
                {result.targetCount}
              </div>
              <div className="text-[10px] text-gray-500">Targeted</div>
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-400">
                {result.delivered}
              </div>
              <div className="text-[10px] text-gray-500">Delivered</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
