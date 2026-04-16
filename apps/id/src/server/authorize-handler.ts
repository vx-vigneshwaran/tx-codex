import { issueAccessToken, validateAuthorizeRequest } from "./oauth.ts";

export function buildAuthorizeRedirect(input: {
  sessionUserId: string | null;
  app: string;
  redirect: string;
}): { status: number; location?: string; error?: string } {
  if (!input.sessionUserId) {
    return { status: 302, location: `${process.env.BETTER_AUTH_BASE_URL}/login` };
  }

  if (!validateAuthorizeRequest(input.app, input.redirect)) {
    return { status: 400, error: "Invalid app/redirect" };
  }

  const token = issueAccessToken({
    sub: input.sessionUserId,
    app: input.app,
    scopes: [`${input.app}:access`],
  });

  const callback = new URL(input.redirect);
  callback.searchParams.set("token", token);
  return { status: 302, location: callback.toString() };
}
