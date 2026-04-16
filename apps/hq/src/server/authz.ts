import crypto from "node:crypto";

type AccessPayload = {
  sub: string;
  app: string;
  scopes: string[];
  iat: number;
  exp: number;
};

export function verifyAccessToken(token: string, expectedApp: string): AccessPayload {
  const [h, p, s] = token.split(".");
  if (!h || !p || !s) throw new Error("Malformed token");

  const unsigned = `${h}.${p}`;
  const expectedSig = crypto.createHmac("sha256", process.env.JWT_SECRET!).update(unsigned).digest("base64url");
  if (s !== expectedSig) throw new Error("Invalid token signature");

  const payload = JSON.parse(Buffer.from(p, "base64url").toString("utf8")) as AccessPayload;
  if (payload.app !== expectedApp) throw new Error("App mismatch");
  if (payload.exp <= Math.floor(Date.now() / 1000)) throw new Error("Token expired");
  return payload;
}

export function assertTenantMembership(input: { userId: string; tenantSlug: string; memberships: Array<{ userId: string; tenantSlug: string }> }) {
  const ok = input.memberships.some((m) => m.userId === input.userId && m.tenantSlug === input.tenantSlug);
  if (!ok) throw new Error("Forbidden tenant");
}
