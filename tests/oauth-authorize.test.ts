import test from "node:test";
import assert from "node:assert/strict";
import { buildAuthorizeRedirect } from "../apps/id/src/server/authorize-handler.ts";

test("redirects unauthenticated users to login", () => {
  const res = buildAuthorizeRedirect({
    sessionUserId: null,
    app: "hq",
    redirect: "https://hq.vezham.com/auth/callback",
  });
  assert.equal(res.status, 302);
});

test("rejects invalid redirect", () => {
  process.env.REDIRECT_ALLOWLIST_HQ = "https://hq.vezham.com/auth/callback";
  process.env.REDIRECT_ALLOWLIST_APPS = "https://apps.vezham.com/auth/callback";
  process.env.REDIRECT_ALLOWLIST_SCHOOLOS = "https://schoolos.vezham.com/auth/callback";
  process.env.JWT_SECRET = "dev-secret";

  const res = buildAuthorizeRedirect({
    sessionUserId: "user-1",
    app: "hq",
    redirect: "https://evil.example/callback",
  });

  assert.equal(res.status, 400);
});
