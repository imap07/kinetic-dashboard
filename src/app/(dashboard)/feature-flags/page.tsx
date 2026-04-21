import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listFeatureFlags, SessionRevokedError, type FeatureFlagEntry } from "@/lib/api";
import { FlagToggle } from "./FlagToggle";

export const metadata: Metadata = { title: "Feature Flags" };

export default async function FeatureFlagsPage() {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) redirect("/api/force-logout");

  let flags: FeatureFlagEntry[] = [];
  let error: string | null = null;
  try {
    flags = await listFeatureFlags(token);
  } catch (e) {
    if (e instanceof SessionRevokedError) redirect("/api/force-logout");
    error = e instanceof Error ? e.message : "Failed to load flags";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Feature Flags</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Runtime toggles — changes take effect within 60s
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="bg-[#111318] border border-[#1e2530] rounded-xl overflow-hidden">
        {flags.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            No flags registered
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#0d1117] text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Key</th>
                <th className="text-left px-5 py-3 font-medium">Default</th>
                <th className="text-right px-5 py-3 font-medium">Active</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((f) => (
                <tr key={f.key} className="border-t border-[#1e2530]">
                  <td className="px-5 py-3 font-mono text-xs text-white">
                    {f.key}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {f.default ? "on" : "off"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <FlagToggle flagKey={f.key} initialValue={f.value} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
