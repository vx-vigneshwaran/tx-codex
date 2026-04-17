import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { Button } from "@heroui/react";
import { fetchIdSession } from "../../../packages/core/src/id-session";

function App() {
  const params = new URLSearchParams(window.location.search);
  const app = params.get("app");
  const redirect = params.get("redirect");
  const canContinue = Boolean(app && redirect);
  const [isBusy, setIsBusy] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [status, setStatus] = useState("Checking session...");

  const message = useMemo(() => {
    if (canContinue) {
      return isAuthenticated ? `You are signed in. Continue back to ${app}.` : `Sign in to continue to ${app}.`;
    }

    return isAuthenticated ? "Signed in to Vezham ID." : "Use the button below to start a local ID session.";
  }, [app, canContinue, isAuthenticated]);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      const data = await fetchIdSession(window.location.origin);
      if (cancelled) return;

      if (!data) {
        setStatus("Could not reach the local ID session endpoint.");
        return;
      }

      setIsAuthenticated(Boolean(data.authenticated));
      setStatus(Boolean(data.authenticated) ? "Session ready." : "No active session yet.");
    }

    function handleVisible() {
      if (!document.hidden) {
        void loadSession();
      }
    }

    void loadSession();
    const intervalId = window.setInterval(() => void loadSession(), 5000);
    window.addEventListener("focus", loadSession);
    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", loadSession);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, []);

  async function login() {
    setIsBusy(true);
    setStatus("Signing in...");

    try {
      const response = await fetch("/login", { method: "POST", credentials: "include" });
      if (!response.ok) {
        throw new Error("Login failed");
      }

      setIsAuthenticated(true);
      setStatus("Signed in.");

      if (canContinue) {
        window.location.href = `/api/oauth/authorize?app=${encodeURIComponent(app!)}&redirect=${encodeURIComponent(redirect!)}`;
        return;
      }
    } catch {
      setStatus("Login failed. Check the local ID server and try again.");
    } finally {
      setIsBusy(false);
    }
  }

  async function logout() {
    setIsBusy(true);
    setStatus("Signing out...");

    try {
      const response = await fetch("/logout", { method: "POST", credentials: "include" });
      if (!response.ok) {
        throw new Error("Logout failed");
      }

      setIsAuthenticated(false);
      setStatus("Signed out.");
    } catch {
      setStatus("Logout failed. Check the local ID server and try again.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main style={{ fontFamily: "Inter, sans-serif", padding: 24 }}>
      <h1>Vezham ID</h1>
      <p>Central identity app running as a standalone TanStack/Vite app.</p>
      <p>{message}</p>
      <p>{status}</p>
      {isAuthenticated ? (
        <Button onPress={logout} isDisabled={isBusy}>
          Logout
        </Button>
      ) : (
        <Button onPress={login} isDisabled={isBusy}>
          Login with Better Auth
        </Button>
      )}
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
