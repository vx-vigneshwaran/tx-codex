/**
 * Example Better Auth adapter setup for Neon.
 * Install deps in production app:
 *   pnpm add better-auth @neondatabase/serverless
 */
import { neon } from "@neondatabase/serverless";
import { betterAuth } from "better-auth";

const sql = neon(process.env.DATABASE_URL!);

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  database: {
    provider: "pg",
    execute: async (query: string, params: unknown[]) => sql(query, params),
  },
  cookies: {
    sessionToken: {
      attributes: {
        domain: ".vezham.com",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
      },
    },
  },
});
