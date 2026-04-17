export type IdSessionState = {
  authenticated: boolean;
  userId: string | null;
};

export async function fetchIdSession(idBaseUrl: string): Promise<IdSessionState | null> {
  try {
    const response = await fetch(`${idBaseUrl}/api/session`, {
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as IdSessionState;
  } catch {
    return null;
  }
}
