
import { createFileRoute } from "@tanstack/start"
import { issueToken } from "../../oauth"
import { auth } from "../../auth"

export const Route = createFileRoute("/api/oauth/authorize")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const app = url.searchParams.get("app")!
        const redirect = url.searchParams.get("redirect")!

        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session) {
          return Response.redirect(`/login?redirect=${redirect}`)
        }

        const token = issueToken(session.user.id, app)

        return Response.redirect(`${redirect}?token=${token}`)
      },
    },
  },
})
