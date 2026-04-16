
import { betterAuth } from "better-auth"
import { tanstackStartCookies } from "better-auth/tanstack-start"

export const auth = betterAuth({
  emailAndPassword: { enabled: true },
  cookies: {
    domain: ".vezham.com",
    secure: true,
    httpOnly: true,
    sameSite: "lax",
  },
  plugins: [tanstackStartCookies()],
})
