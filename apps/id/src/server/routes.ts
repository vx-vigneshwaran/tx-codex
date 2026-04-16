import { auth } from "./auth.ts";
import { buildAuthorizeRedirect } from "./authorize-handler.ts";

export async function oauthAuthorizeHandler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const app = url.searchParams.get("app") ?? "";
  const redirect = url.searchParams.get("redirect") ?? "";

  const session = await auth.api.getSession({ headers: request.headers });

  const result = buildAuthorizeRedirect({
    sessionUserId: session?.user?.id ?? null,
    app,
    redirect,
  });

  if (result.error) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: result.status,
      headers: { "content-type": "application/json" },
    });
  }

  return Response.redirect(result.location!, result.status as 302);
}
