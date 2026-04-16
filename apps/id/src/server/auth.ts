import { betterAuth } from "better-auth";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_BASE_URL!,
  advanced: {
    cookies: {
      sessionToken: {
        attributes: {
          domain: process.env.COOKIE_DOMAIN!,
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
        },
      },
    },
  },
});
