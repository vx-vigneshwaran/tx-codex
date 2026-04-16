export const SSO_COOKIE_NAME = "vezham_session";

export function buildSsoCookie(sessionId: string, maxAgeSeconds = 60 * 60 * 24 * 7): string {
  return `${SSO_COOKIE_NAME}=${sessionId}; Domain=.vezham.com; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
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
