"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { QRCodeSVG } from "qrcode.react";
import {
  totpSetup,
  totpConfirm,
  totpDisable,
  totpRegenerateCodes,
  type TotpStatus,
} from "@/lib/api";

type Mode = "idle" | "enrolling" | "showing-codes" | "disabling" | "regenerating";

export function SecurityClient({ initialStatus }: { initialStatus: TotpStatus }) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [status, setStatus] = useState<TotpStatus>(initialStatus);
  const [mode, setMode] = useState<Mode>("idle");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Enrollment state
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  if (!token) return null;

  async function startEnroll(password: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await totpSetup(token!, password);
      setSecret(res.secret);
      setOtpauthUrl(res.otpauthUrl);
      setMode("enrolling");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Setup failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnroll(code: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await totpConfirm(token!, code);
      setRecoveryCodes(res.recoveryCodes);
      setSecret(null);
      setOtpauthUrl(null);
      setMode("showing-codes");
      setStatus({ enrolled: true, remainingBackupCodes: res.recoveryCodes.length });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Confirmation failed");
    } finally {
      setBusy(false);
    }
  }

  async function disable(password: string, code: string) {
    setError(null);
    setBusy(true);
    try {
      await totpDisable(token!, password, code);
      setStatus({ enrolled: false, remainingBackupCodes: 0 });
      setMode("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Disable failed");
    } finally {
      setBusy(false);
    }
  }

  async function regenerate(password: string, code: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await totpRegenerateCodes(token!, password, code);
      setRecoveryCodes(res.recoveryCodes);
      setMode("showing-codes");
      setStatus({ enrolled: true, remainingBackupCodes: res.recoveryCodes.length });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Regenerate failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Status card */}
      <div className="bg-[#141920] border border-[#1e2530] rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Two-factor authentication (TOTP)
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {status.enrolled
                ? `Enabled. ${status.remainingBackupCodes} recovery code${status.remainingBackupCodes === 1 ? "" : "s"} remaining.`
                : "Not enabled. Anyone with your password can sign in."}
            </p>
          </div>
          <span
            className={
              "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium " +
              (status.enrolled
                ? "bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20")
            }
          >
            {status.enrolled ? "Enabled" : "Off"}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {!status.enrolled && mode === "idle" && (
            <PasswordPromptButton
              label="Set up 2FA"
              onSubmit={(password) => startEnroll(password)}
              busy={busy}
            />
          )}
          {status.enrolled && mode === "idle" && (
            <>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode("regenerating");
                }}
                className="px-3.5 py-2 rounded-lg bg-[#1e2530] text-gray-200 text-sm hover:bg-[#252b35] transition-colors"
              >
                Regenerate recovery codes
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode("disabling");
                }}
                className="px-3.5 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-sm hover:bg-red-500/15 transition-colors"
              >
                Disable 2FA
              </button>
            </>
          )}
        </div>
      </div>

      {/* Enrollment flow */}
      {mode === "enrolling" && otpauthUrl && secret && (
        <div className="bg-[#141920] border border-[#1e2530] rounded-xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-white">Scan with your authenticator</h3>
          <p className="text-sm text-gray-500">
            Use Google Authenticator, 1Password, Authy, or any TOTP-compatible app. If
            you can&apos;t scan, enter the key manually.
          </p>

          <div className="flex flex-col items-center gap-4 py-2">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={otpauthUrl} size={180} level="M" />
            </div>
            <div className="text-xs text-gray-500 text-center">
              <div className="font-medium text-gray-300 mb-1">Manual key</div>
              <code className="font-mono text-[11px] text-gray-200 break-all">
                {secret}
              </code>
            </div>
          </div>

          <ConfirmCodeForm
            onSubmit={(code) => confirmEnroll(code)}
            busy={busy}
            label="Enter the 6-digit code your app generates to finish enrollment"
          />
        </div>
      )}

      {/* Recovery codes display (post-enroll or post-regenerate) */}
      {mode === "showing-codes" && recoveryCodes && (
        <div className="bg-[#141920] border border-[#C6FF00]/30 rounded-xl p-6 space-y-4">
          <h3 className="text-base font-semibold text-white">
            Save these recovery codes
          </h3>
          <p className="text-sm text-amber-400">
            These codes are shown <strong>once</strong>. Store them somewhere safe. Each
            is single-use; use one to sign in if you lose your authenticator.
          </p>
          <div className="grid grid-cols-2 gap-2 font-mono text-sm text-gray-200">
            {recoveryCodes.map((c) => (
              <div
                key={c}
                className="bg-[#0B0E11] border border-[#1e2530] rounded-md px-3 py-2 tracking-[0.15em]"
              >
                {c}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(recoveryCodes.join("\n"));
              }}
              className="px-3.5 py-2 rounded-lg bg-[#1e2530] text-gray-200 text-sm hover:bg-[#252b35] transition-colors"
            >
              Copy all
            </button>
            <button
              type="button"
              onClick={() => {
                setRecoveryCodes(null);
                setMode("idle");
              }}
              className="px-3.5 py-2 rounded-lg bg-[#C6FF00] text-[#0B0E11] text-sm font-medium hover:bg-[#d4ff33] transition-colors"
            >
              I&apos;ve saved them
            </button>
          </div>
        </div>
      )}

      {mode === "disabling" && (
        <ReauthForm
          title="Disable 2FA"
          description="Confirm your password and a TOTP or recovery code to turn off 2FA."
          submitLabel="Disable 2FA"
          destructive
          busy={busy}
          onCancel={() => setMode("idle")}
          onSubmit={(p, c) => disable(p, c)}
        />
      )}

      {mode === "regenerating" && (
        <ReauthForm
          title="Regenerate recovery codes"
          description="Existing codes will be invalidated. Confirm your password and a TOTP or recovery code."
          submitLabel="Generate new codes"
          busy={busy}
          onCancel={() => setMode("idle")}
          onSubmit={(p, c) => regenerate(p, c)}
        />
      )}
    </div>
  );
}

function PasswordPromptButton({
  label,
  onSubmit,
  busy,
}: {
  label: string;
  onSubmit: (password: string) => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3.5 py-2 rounded-lg bg-[#C6FF00] text-[#0B0E11] text-sm font-medium hover:bg-[#d4ff33] transition-colors"
      >
        {label}
      </button>
    );
  }
  return (
    <form
      className="w-full flex gap-2 items-end"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(password);
      }}
    >
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Your password
        </label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-lg bg-[#0B0E11] border border-[#1e2530] text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/40 focus:border-[#C6FF00]/50"
        />
      </div>
      <button
        type="submit"
        disabled={busy || !password}
        className="px-3.5 py-2 rounded-lg bg-[#C6FF00] text-[#0B0E11] text-sm font-medium hover:bg-[#d4ff33] disabled:opacity-50 transition-colors"
      >
        {busy ? "..." : "Continue"}
      </button>
    </form>
  );
}

function ConfirmCodeForm({
  onSubmit,
  busy,
  label,
}: {
  onSubmit: (code: string) => void;
  busy: boolean;
  label: string;
}) {
  const [code, setCode] = useState("");
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(code);
      }}
    >
      <label className="block text-xs font-medium text-gray-400">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          required
          className="flex-1 px-3 py-2 rounded-lg bg-[#0B0E11] border border-[#1e2530] text-gray-100 text-sm font-mono tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/40 focus:border-[#C6FF00]/50"
        />
        <button
          type="submit"
          disabled={busy || code.length !== 6}
          className="px-3.5 py-2 rounded-lg bg-[#C6FF00] text-[#0B0E11] text-sm font-medium hover:bg-[#d4ff33] disabled:opacity-50 transition-colors"
        >
          {busy ? "..." : "Verify"}
        </button>
      </div>
    </form>
  );
}

function ReauthForm({
  title,
  description,
  submitLabel,
  destructive,
  busy,
  onCancel,
  onSubmit,
}: {
  title: string;
  description: string;
  submitLabel: string;
  destructive?: boolean;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (password: string, code: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(password, code.trim().toUpperCase());
      }}
      className="bg-[#141920] border border-[#1e2530] rounded-xl p-6 space-y-4"
    >
      <div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-[#0B0E11] border border-[#1e2530] text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/40 focus:border-[#C6FF00]/50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">
            Authenticator code or recovery code
          </label>
          <input
            type="text"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={32}
            placeholder="000000 or ABCDEFGHJK"
            className="w-full px-3 py-2 rounded-lg bg-[#0B0E11] border border-[#1e2530] text-gray-100 text-sm font-mono tracking-[0.15em] focus:outline-none focus:ring-2 focus:ring-[#C6FF00]/40 focus:border-[#C6FF00]/50"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-2 rounded-lg bg-[#1e2530] text-gray-200 text-sm hover:bg-[#252b35] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy || !password || !code}
          className={
            "px-3.5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 " +
            (destructive
              ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15"
              : "bg-[#C6FF00] text-[#0B0E11] hover:bg-[#d4ff33]")
          }
        >
          {busy ? "..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
