import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { assertTenantMembership, verifyAccessToken } from "../apps/hq/src/server/authz.ts";

test("tenant membership is enforced server-side", () => {
  assert.throws(
    () =>
      assertTenantMembership({
        userId: "u1",
        tenantSlug: "acme",
        memberships: [{ userId: "u2", tenantSlug: "acme" }],
      }),
    /Forbidden tenant/,
  );
});

test("verifies signed token", () => {
  process.env.JWT_SECRET = "dev-secret";
  const payload = {
    sub: "u1",
    app: "hq",
    scopes: ["hq:access"],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 120,
  };
  const h = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const p = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const s = crypto.createHmac("sha256", process.env.JWT_SECRET).update(`${h}.${p}`).digest("base64url");
  const parsed = verifyAccessToken(`${h}.${p}.${s}`, "hq");
  assert.equal(parsed.sub, "u1");
});
