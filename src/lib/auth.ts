/**
 * Required environment variables:
 *   BACKEND_URL        — NestJS API base URL (no trailing slash)
 *   AUTH_SECRET        — NextAuth secret (openssl rand -base64 32)
 *   NEXTAUTH_URL       — canonical URL of this dashboard (e.g. https://dashboard.kineticapp.ca)
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

declare module "next-auth" {
  interface User {
    accessToken?: string;
    role?: string;
  }
  interface Session {
    accessToken?: string;
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}


export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: "credentials",
      name: "Admin credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "Authenticator code", type: "text" },
        backupCode: { label: "Recovery code", type: "text" },
      },
      async authorize(credentials) {
        const backendUrl =
          process.env.BACKEND_URL ||
          "https://kinectic-app-test.4a7ymmxg576we.ca-central-1.cs.amazonlightsail.com";

        const res = await fetch(`${backendUrl}/api/admin/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
            ...(credentials?.totpCode
              ? { totpCode: credentials.totpCode }
              : {}),
            ...(credentials?.backupCode
              ? { backupCode: credentials.backupCode }
              : {}),
          }),
        });

        if (!res.ok) return null;

        const data = await res.json();
        return {
          ...data.user,
          id: data.user.id,
          name: data.user.displayName,
          accessToken: data.accessToken,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        session.user.role = token.role as string;
      }
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
  },
});
