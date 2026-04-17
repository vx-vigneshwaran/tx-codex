import { defineConfig } from "vite";
import { createSession, destroySession, getSession } from "../../packages/core/src/sessions";
import { issueAccessToken, validateRedirect } from "../../packages/core/src/oauth";

const sessionCookieName = "vezham_session";

function parseCookies(cookieHeader = ""): Record<string, string> {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => {
        const index = value.indexOf("=");
        if (index === -1) return [value, ""];
        return [value.slice(0, index), decodeURIComponent(value.slice(index + 1))];
      }),
  );
}

function applyCors(req: { headers: { origin?: string } }, res: { setHeader(name: string, value: string): void }): void {
  const origin = req.headers.origin;

  if (!origin) return;

  try {
    const url = new URL(origin);
    const isAllowedLocalOrigin = url.hostname === "localhost" && ["3001", "3002", "3003", "3004", "3005"].includes(url.port);

    if (!isAllowedLocalOrigin) return;

    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("access-control-allow-credentials", "true");
    res.setHeader("vary", "Origin");
  } catch {
    return;
  }
}

export default defineConfig({
  server: {
    host: true,
    port: Number(process.env.PORT ?? 3000),
  },
  plugins: [
    {
      name: "vezham-local-id-api",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = new URL(req.url ?? "/", "http://localhost:3000");

          if (req.method === "OPTIONS" && url.pathname === "/api/session") {
            applyCors(req, res);
            res.statusCode = 204;
            res.setHeader("access-control-allow-methods", "GET, OPTIONS");
            res.setHeader("access-control-allow-headers", "content-type");
            res.end();
            return;
          }

          if (url.pathname === "/health") {
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ ok: true, service: "id" }));
            return;
          }

          if (url.pathname === "/login" && req.method === "POST") {
            const sessionId = createSession("user-1");
            res.statusCode = 200;
            res.setHeader("content-type", "application/json");
            res.setHeader("set-cookie", `${sessionCookieName}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          if (url.pathname === "/api/session" && req.method === "GET") {
            const cookies = parseCookies(req.headers.cookie);
            const session = getSession(cookies[sessionCookieName]);
            res.statusCode = 200;
            res.setHeader("content-type", "application/json");
            applyCors(req, res);
            res.end(JSON.stringify({ authenticated: Boolean(session), userId: session?.userId ?? null }));
            return;
          }

          if (url.pathname === "/logout" && (req.method === "GET" || req.method === "POST")) {
            const cookies = parseCookies(req.headers.cookie);
            destroySession(cookies[sessionCookieName]);
            res.setHeader("set-cookie", `${sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);

            if (req.method === "GET") {
              const redirect = url.searchParams.get("redirect");
              if (redirect) {
                res.statusCode = 302;
                res.setHeader("location", redirect);
                res.end();
                return;
              }
            }

            res.statusCode = 200;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          if (url.pathname === "/api/oauth/authorize" && req.method === "GET") {
            const app = url.searchParams.get("app") ?? "";
            const redirect = url.searchParams.get("redirect") ?? "";
            const cookies = parseCookies(req.headers.cookie);
            const session = getSession(cookies[sessionCookieName]);

            if (!session) {
              const loginUrl = new URL("/login", "http://localhost:3000");
              loginUrl.searchParams.set("app", app);
              loginUrl.searchParams.set("redirect", redirect);
              res.statusCode = 302;
              res.setHeader("location", loginUrl.toString());
              res.end();
              return;
            }

            if (!validateRedirect(app, redirect)) {
              res.statusCode = 400;
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify({ error: "Invalid app/redirect" }));
              return;
            }

            const token = issueAccessToken({
              secret: process.env.JWT_SECRET ?? "dev-secret",
              sub: session.userId,
              app,
              scopes: [`${app}:access`],
            });
            const callback = new URL(redirect);
            callback.searchParams.set("token", token);
            res.statusCode = 302;
            res.setHeader("location", callback.toString());
            res.end();
            return;
          }

          next();
        });
      },
    },
  ],
});
