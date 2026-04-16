import crypto from "node:crypto";

type Session = {
  userId: string;
  createdAt: number;
};

const sessions = new Map<string, Session>();

export function createSession(userId: string): string {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, {
    userId,
    createdAt: Date.now(),
  });
  return sessionId;
}

export function getSession(sessionId?: string): Session | null {
  if (!sessionId) return null;
  return sessions.get(sessionId) ?? null;
}
