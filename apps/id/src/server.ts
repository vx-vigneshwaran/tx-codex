import http from "node:http";
import crypto from "node:crypto";
import { buildSsoCookie, clearSsoCookie, parseCookies, SSO_COOKIE_NAME } from "../../../packages/core/src/cookies.ts";
import { createSession, destroySession, getSession } from "../../../packages/core/src/sessions.ts";
import { issueAccessToken, validateRedirect } from "../../../packages/core/src/oauth.ts";
import { addMembership, createTenant } from "../../../packages/core/src/tenants.ts";

const port = Number(process.env.PORT ?? 3000);
const jwtSecret = process.env.JWT_SECRET ?? "dev-secret";

createTenant({ id: crypto.randomUUID(), name: "Acme", slug: "acme" });
addMembership({ userId: "user-1", tenantSlug: "acme", role: "owner" });

function applyCors(req: http.IncomingMessage, res: http.ServerResponse): void {
  const origin = req.headers.origin;
  if (!origin) return;

  try {
    const url = new URL(origin);
    const isAllowedLocalOrigin = url.hostname === "localhost" && ["3001", "3002", "3003", "3004", "3005"].includes(url.port);

    if (!isAllowedLocalOrigin) return;

    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  } catch {
    return;
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);

  if (req.method === "OPTIONS" && url.pathname === "/api/session") {
    applyCors(req, res);
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    res.end();
    return;
  }

  if (url.pathname === "/health") {
    json(res, 200, { ok: true, service: "id" });
    return;
  }

  if (url.pathname === "/login" && req.method === "POST") {
    const sessionId = createSession("user-1");
    res.setHeader("Set-Cookie", buildSsoCookie(sessionId));
    json(res, 200, { ok: true, message: "Logged in", cookie: SSO_COOKIE_NAME });
    return;
  }

  if (url.pathname === "/api/session" && req.method === "GET") {
    const cookies = parseCookies(req.headers.cookie ?? "");
    const session = getSession(cookies[SSO_COOKIE_NAME]);
    applyCors(req, res);
    json(res, 200, { authenticated: Boolean(session), userId: session?.userId ?? null });
    return;
  }

  if (url.pathname === "/logout" && (req.method === "GET" || req.method === "POST")) {
    const cookies = parseCookies(req.headers.cookie ?? "");
    destroySession(cookies[SSO_COOKIE_NAME]);
    res.setHeader("Set-Cookie", clearSsoCookie());

    if (req.method === "GET") {
      const redirect = url.searchParams.get("redirect");
      if (redirect) {
        res.statusCode = 302;
        res.setHeader("Location", redirect);
        res.end();
        return;
      }
    }

    json(res, 200, { ok: true, message: "Logged out" });
    return;
  }

  if (url.pathname === "/api/oauth/authorize" && req.method === "GET") {
    const cookies = parseCookies(req.headers.cookie ?? "");
    const session = getSession(cookies[SSO_COOKIE_NAME]);
    const app = url.searchParams.get("app");
    const redirect = url.searchParams.get("redirect");

    if (!session) {
      const loginUrl = new URL(`${process.env.BETTER_AUTH_BASE_URL ?? `http://localhost:${port}`}/login`);
      loginUrl.searchParams.set("app", app ?? "");
      loginUrl.searchParams.set("redirect", redirect ?? "");
      res.statusCode = 302;
      res.setHeader("Location", loginUrl.toString());
      res.end();
      return;
    }

    if (!app || !redirect || !validateRedirect(app, redirect)) {
      json(res, 400, { error: "Invalid redirect/app" });
      return;
    }

    const token = issueAccessToken({
      secret: jwtSecret,
      sub: session.userId,
      app,
      scopes: [`${app}:access`],
      ttlSeconds: 300,
    });

    const callback = new URL(redirect);
    callback.searchParams.set("token", token);

    res.statusCode = 302;
    res.setHeader("Location", callback.toString());
    res.end();
    return;
  }

  json(res, 404, { error: "not found" });
});

server.listen(port, () => {
  console.log(`[id] listening on http://localhost:${port}`);
});

function json(res: http.ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
