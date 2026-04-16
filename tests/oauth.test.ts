import test from "node:test";
import assert from "node:assert/strict";
import { issueAccessToken, validateRedirect, verifyAccessToken } from "../packages/core/src/oauth.ts";

test("issues and verifies short-lived tokens", () => {
  const token = issueAccessToken({
    secret: "test-secret",
    sub: "user-1",
    app: "hq",
    scopes: ["hq:access"],
    ttlSeconds: 60,
  });

  const payload = verifyAccessToken({ token, secret: "test-secret", app: "hq" });
  assert.equal(payload.sub, "user-1");
  assert.deepEqual(payload.scopes, ["hq:access"]);
});

test("checks redirect allowlist", () => {
  assert.equal(validateRedirect("hq", "http://localhost:3001/auth/callback"), true);
  assert.equal(validateRedirect("hq", "https://evil.example/callback"), false);
});
