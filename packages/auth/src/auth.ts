import { db } from "@repo/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  baseURL:
    process.env.NODE_ENV === "production"
      ? "https://travelbot-dashboard.vercel.app"
      : undefined,
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      partitioned: true,
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://travelbot-dashboard.vercel.app",
    "https://travelbot-widget.vercel.app",
  ],
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60,
    },
  },
  plugins: [admin()],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
});
