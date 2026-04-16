import crypto from "node:crypto";

type AppName = "hq" | "apps" | "schoolos";

function listFromEnv(key: string): string[] {
  return (process.env[key] ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

const redirectAllowlist: Record<AppName, string[]> = {
  hq: listFromEnv("REDIRECT_ALLOWLIST_HQ"),
  apps: listFromEnv("REDIRECT_ALLOWLIST_APPS"),
  schoolos: listFromEnv("REDIRECT_ALLOWLIST_SCHOOLOS"),
};

export function validateAuthorizeRequest(app: string, redirect: string): boolean {
  if (!(app in redirectAllowlist)) return false;
  return redirectAllowlist[app as AppName].includes(redirect);
}

export function issueAccessToken(params: { sub: string; app: string; scopes: string[]; ttlSeconds?: number }): string {
  const ttlSeconds = params.ttlSeconds ?? 300;
  const payload = {
    sub: params.sub,
    app: params.app,
    scopes: params.scopes,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };

  const encodedHeader = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac("sha256", process.env.JWT_SECRET!).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}
