/**
 * Server-side forced logout.
 *
 * Called when a protected page catches a SessionRevokedError (the backend
 * said our stored admin JWT is no longer valid — password reset, role
 * change, tokenVersion bump, etc.). We can't safely reuse the session,
 * so we call NextAuth's server-side `signOut()` to clear the session
 * cookie and bounce the user to /login with a reason query string.
 *
 * We accept both GET (redirect chain from page catch block) and POST
 * (manual trigger) so that plain `redirect('/api/force-logout')` from
 * a Server Component just works.
 */
import { signOut } from "@/lib/auth";
import { NextResponse } from "next/server";

async function handle() {
  try {
    await signOut({ redirect: false });
  } catch {
    // If signOut throws (already signed out / cookie already gone),
    // we still want to land the user on /login so they can re-auth.
  }
  return NextResponse.redirect(
    new URL(
      "/login?reason=revoked",
      process.env.NEXTAUTH_URL || "http://localhost:3000",
    ),
  );
}

export async function GET() {
  return handle();
}

export async function POST() {
  return handle();
}
