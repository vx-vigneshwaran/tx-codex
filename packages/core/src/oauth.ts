import crypto from "node:crypto";

type SupportedApp = "hq" | "drive" | "notes" | "remainder" | "schoolos";

const REDIRECT_ALLOWLIST: Record<SupportedApp, string[]> = {
  hq: ["https://hq.vezham.com/auth/callback", "http://localhost:3001/auth/callback"],
  drive: ["https://drive.vezham.com/auth/callback", "http://localhost:3002/auth/callback"],
  notes: ["https://notes.vezham.com/auth/callback", "http://localhost:3004/auth/callback"],
  remainder: ["https://remainder.vezham.com/auth/callback", "http://localhost:3005/auth/callback"],
  schoolos: ["https://schoolos.vezham.com/auth/callback", "http://localhost:3003/auth/callback"],
};

const DEFAULT_SCOPES: Record<SupportedApp, string[]> = {
  hq: ["hq:access"],
  drive: ["drive:access"],
  notes: ["notes:access"],
  remainder: ["remainder:access"],
  schoolos: ["schoolos:access"],
};

export type AccessTokenPayload = {
  sub: string;
  app: string;
  scopes: string[];
  iat: number;
  exp: number;
};

export function validateRedirect(app: string, redirect: string): boolean {
  return app in REDIRECT_ALLOWLIST && REDIRECT_ALLOWLIST[app as SupportedApp].includes(redirect);
}

export function issueAccessToken({
  secret,
  sub,
  app,
  scopes,
  ttlSeconds = 300,
}: {
  secret: string;
  sub: string;
  app: string;
  scopes?: string[];
  ttlSeconds?: number;
}): string {
  const header = { alg: "HS256", typ: "JWT" };
  const payload: AccessTokenPayload = {
    sub,
    app,
    scopes: scopes ?? DEFAULT_SCOPES[app as SupportedApp] ?? [],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };

  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

export function verifyAccessToken({ token, secret, app }: { token: string; secret: string; app: string }): AccessTokenPayload {
  const [encodedHeader, encodedPayload, signature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error("Malformed token");
  }

  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const expected = crypto.createHmac("sha256", secret).update(unsigned).digest("base64url");
  if (signature !== expected) {
    throw new Error("Invalid signature");
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as AccessTokenPayload;
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp <= now) {
    throw new Error("Token expired");
  }

  if (payload.app !== app) {
    throw new Error("App mismatch");
  }

  return payload;
}

function base64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}
