import http from "node:http";
import { verifyAccessToken } from "../../../packages/core/src/oauth.ts";
import { assertMembership, listTenantsForUser } from "../../../packages/core/src/tenants.ts";

const port = Number(process.env.PORT ?? 4001);
const jwtSecret = process.env.JWT_SECRET ?? "dev-secret";

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${port}`);

  if (url.pathname === "/health") {
    return json(res, 200, { ok: true, service: "hq" });
  }

  if (url.pathname === "/api/tenants" && req.method === "GET") {
    const userId = "user-1";
    return json(res, 200, { tenants: listTenantsForUser(userId) });
  }

  if (url.pathname.startsWith("/t/") && req.method === "GET") {
    const tenantSlug = url.pathname.split("/")[2];
    const token = readBearer(req.headers.authorization);

    if (!token) return json(res, 401, { error: "Missing bearer token" });

    try {
      const payload = verifyAccessToken({ token, secret: jwtSecret, app: "hq" });
      assertMembership({ userId: payload.sub, tenantSlug });
      return json(res, 200, { ok: true, tenantSlug, userId: payload.sub });
    } catch (error) {
      return json(res, 403, { error: (error as Error).message });
    }
  }

  return json(res, 404, { error: "not found" });
});

server.listen(port, () => {
  console.log(`[hq] listening on http://localhost:${port}`);
});

function readBearer(authorization = ""): string | null {
  if (!authorization.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim();
}

function json(res: http.ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}
