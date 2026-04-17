import crypto from "node:crypto";

type AppName = "hq" | "drive" | "notes" | "remainder" | "schoolos";

function listFromEnv(key: string): string[] {
  return (process.env[key] ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

const defaultRedirectAllowlist: Record<AppName, string[]> = {
  hq: ["https://hq.vezham.com/auth/callback", "http://localhost:3001/auth/callback"],
  drive: ["https://drive.vezham.com/auth/callback", "http://localhost:3002/auth/callback"],
  notes: ["https://notes.vezham.com/auth/callback", "http://localhost:3004/auth/callback"],
  remainder: ["https://remainder.vezham.com/auth/callback", "http://localhost:3005/auth/callback"],
  schoolos: ["https://schoolos.vezham.com/auth/callback", "http://localhost:3003/auth/callback"],
};

const redirectAllowlist: Record<AppName, string[]> = {
  hq: listFromEnv("REDIRECT_ALLOWLIST_HQ").concat(defaultRedirectAllowlist.hq),
  drive: listFromEnv("REDIRECT_ALLOWLIST_DRIVE").concat(defaultRedirectAllowlist.drive),
  notes: listFromEnv("REDIRECT_ALLOWLIST_NOTES").concat(defaultRedirectAllowlist.notes),
  remainder: listFromEnv("REDIRECT_ALLOWLIST_REMAINDER").concat(defaultRedirectAllowlist.remainder),
  schoolos: listFromEnv("REDIRECT_ALLOWLIST_SCHOOLOS").concat(defaultRedirectAllowlist.schoolos),
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
