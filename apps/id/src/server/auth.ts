import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

const cookieDomain = process.env.COOKIE_DOMAIN;
const isLocalCookieDomain = !cookieDomain || cookieDomain === "localhost";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-secret",
  baseURL: process.env.BETTER_AUTH_BASE_URL ?? "http://localhost:3000",
  emailAndPassword: { enabled: true },
  advanced: {
    cookies: {
      sessionToken: {
        attributes: {
          ...(cookieDomain && !isLocalCookieDomain ? { domain: cookieDomain } : {}),
          httpOnly: true,
          secure: !isLocalCookieDomain,
          sameSite: "lax",
          path: "/",
        },
      },
    },
  },
  plugins: [tanstackStartCookies()],
});
