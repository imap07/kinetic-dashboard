"use client";

import type { Metadata } from "next";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    reason === "revoked"
      ? "Your session expired or was revoked. Please sign in again."
      : null,
  );
  const [loading, setLoading] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const totpCode = useRecoveryCode
      ? undefined
      : (form.get("totp") as string) || undefined;
    const backupCode = useRecoveryCode
      ? ((form.get("backup") as string) || undefined)?.toUpperCase()
      : undefined;

    const result = await signIn("credentials", {
      email,
      password,
      totpCode,
      backupCode,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(
        useRecoveryCode
          ? "Sign-in failed. Check your email, password, and recovery code."
          : "Sign-in failed. Check your email, password, and authenticator code.",
      );
    } else {
      router.push("/overview");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center px-4">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#C6FF00 1px, transparent 1px), linear-gradient(90deg, #C6FF00 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#C6FF00]/10 border border-[#C6FF00]/20 mb-4">
            <span className="text-[#C6FF00] font-bold text-xl">K</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Kinetic Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">Internal admin access only</p>
        </div>

        {/* Card */}
        <div className="bg-[#141920] border border-[#1e2530] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to continue</h2>

          {notice && !error && (
            <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3.5 py-3 text-sm text-amber-400">
              {notice}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="admin@kineticapp.ca"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E11] border border-[#1e2530] text-gray-100 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/40 focus:border-[#C6FF00]/50 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E11] border border-[#1e2530] text-gray-100 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/40 focus:border-[#C6FF00]/50 transition-all"
              />
            </div>

            {/* Second factor */}
            {useRecoveryCode ? (
              <div>
                <label
                  htmlFor="backup"
                  className="block text-sm font-medium text-gray-300 mb-1.5"
                >
                  Recovery code
                  <span className="text-gray-500 font-normal ml-1.5">
                    (10 chars from your saved list)
                  </span>
                </label>
                <input
                  id="backup"
                  name="backup"
                  type="text"
                  autoComplete="one-time-code"
                  maxLength={10}
                  placeholder="ABCDEFGHJK"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E11] border border-[#1e2530] text-gray-100 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/40 focus:border-[#C6FF00]/50 transition-all tracking-[0.2em] font-mono uppercase"
                />
              </div>
            ) : (
              <div>
                <label
                  htmlFor="totp"
                  className="block text-sm font-medium text-gray-300 mb-1.5"
                >
                  Authenticator code
                  <span className="text-gray-500 font-normal ml-1.5">(6-digit TOTP)</span>
                </label>
                <input
                  id="totp"
                  name="totp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0E11] border border-[#1e2530] text-gray-100 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/40 focus:border-[#C6FF00]/50 transition-all tracking-[0.3em] font-mono"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setUseRecoveryCode((v) => !v);
                setError(null);
              }}
              className="text-xs text-gray-500 hover:text-[#C6FF00] transition-colors"
            >
              {useRecoveryCode
                ? "← Use authenticator code instead"
                : "Lost your authenticator? Use a recovery code →"}
            </button>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#C6FF00] text-[#0B0E11] font-semibold text-sm hover:bg-[#d4ff33] active:scale-[0.98] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/50 focus:ring-offset-2 focus:ring-offset-[#141920] mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          Redak Code Inc., operating as Kinetic &mdash; Internal use only
        </p>
      </div>
    </div>
  );
}
