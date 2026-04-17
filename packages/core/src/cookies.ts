export const SSO_COOKIE_NAME = "vezham_session";

export function buildSsoCookie(sessionId: string, maxAgeSeconds = 60 * 60 * 24 * 7): string {
  const cookieDomain = process.env.COOKIE_DOMAIN;
  const isLocalCookieDomain = !cookieDomain || cookieDomain === "localhost";

  const parts = [`${SSO_COOKIE_NAME}=${sessionId}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAgeSeconds}`];

  if (cookieDomain && !isLocalCookieDomain) {
    parts.push(`Domain=${cookieDomain}`);
  }

  if (!isLocalCookieDomain) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function clearSsoCookie(): string {
  const cookieDomain = process.env.COOKIE_DOMAIN;
  const isLocalCookieDomain = !cookieDomain || cookieDomain === "localhost";
  const parts = [`${SSO_COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];

  if (cookieDomain && !isLocalCookieDomain) {
    parts.push(`Domain=${cookieDomain}`);
  }

  if (!isLocalCookieDomain) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export function parseCookies(cookieHeader = ""): Record<string, string> {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => {
        const idx = v.indexOf("=");
        if (idx === -1) return [v, ""];
        return [v.slice(0, idx), decodeURIComponent(v.slice(idx + 1))];
      }),
  );
}
