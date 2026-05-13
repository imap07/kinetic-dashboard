import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTotpStatus, SessionRevokedError, type TotpStatus } from "@/lib/api";
import { SecurityClient } from "./SecurityClient";

export const metadata: Metadata = { title: "Security" };

export default async function SecurityPage() {
  const session = await auth();
  const token = session?.accessToken;
  if (!token) redirect("/api/force-logout");

  let status: TotpStatus | null = null;
  let error: string | null = null;
  try {
    status = await getTotpStatus(token);
  } catch (e) {
    if (e instanceof SessionRevokedError) redirect("/api/force-logout");
    error = e instanceof Error ? e.message : "Failed to load 2FA status";
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">Security</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Two-factor authentication and recovery codes for your admin account.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {status && <SecurityClient initialStatus={status} />}
    </div>
  );
}
