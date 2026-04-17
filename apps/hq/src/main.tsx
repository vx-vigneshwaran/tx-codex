import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { Button, Card, CardContent } from "@heroui/react";
import { WorkspaceSwitcher } from "./components/workspace-switcher";
import { fetchIdSession } from "../../../packages/core/src/id-session";

const tenants = [
  { id: "1", slug: "acme", name: "Acme" },
  { id: "2", slug: "globex", name: "Globex" },
];

function App() {
  const currentTenant = (import.meta.env.VITE_DEFAULT_TENANT_SLUG as string) || "acme";
  const authorizeUrl = (import.meta.env.VITE_IDP_AUTHORIZE_URL as string | undefined) || "http://localhost:3000/api/oauth/authorize";
  const callbackUrl = `${window.location.origin}/auth/callback`;
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("token");
  const loggedOut = params.get("logged_out") === "1";
  const logoutRedirect = `${window.location.origin}/?logged_out=1`;
  const idBaseUrl = new URL(authorizeUrl).origin;
  const [isSignedIn, setIsSignedIn] = useState(() => Boolean(sessionStorage.getItem("vezham_hq_token")));
  const [isLoggedOut, setIsLoggedOut] = useState(loggedOut);
  const [isBooting, setIsBooting] = useState(() => !loggedOut && !tokenFromUrl);

  useEffect(() => {
    if (tokenFromUrl) {
      sessionStorage.setItem("vezham_hq_token", tokenFromUrl);
      setIsSignedIn(true);
      setIsLoggedOut(false);
      setIsBooting(false);
      window.history.replaceState({}, "", "/");
      return;
    }

    if (!sessionStorage.getItem("vezham_hq_token") && !isLoggedOut) {
      window.location.replace(`${authorizeUrl}?app=hq&redirect=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    if (isLoggedOut) {
      setIsBooting(false);
    }
  }, [authorizeUrl, callbackUrl, isLoggedOut, tokenFromUrl]);

  useEffect(() => {
    let disposed = false;

    async function syncSession() {
      const session = await fetchIdSession(idBaseUrl);
      if (disposed) return;

      if (!session) {
        setIsBooting(false);
        return;
      }

      const hasToken = Boolean(sessionStorage.getItem("vezham_hq_token"));

      if (!session.authenticated && hasToken) {
        sessionStorage.removeItem("vezham_hq_token");
        setIsSignedIn(false);
        setIsLoggedOut(true);
        setIsBooting(false);
        window.history.replaceState({}, "", "/?logged_out=1");
        return;
      }

      if (session.authenticated && !hasToken && !isLoggedOut) {
        window.location.replace(`${authorizeUrl}?app=hq&redirect=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      setIsBooting(false);
    }

    function handleVisible() {
      if (!document.hidden) {
        void syncSession();
      }
    }

    void syncSession();
    const intervalId = window.setInterval(() => void syncSession(), 5000);
    window.addEventListener("focus", syncSession);
    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", syncSession);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [authorizeUrl, callbackUrl, idBaseUrl, isLoggedOut]);

  function logout() {
    sessionStorage.removeItem("vezham_hq_token");
    setIsSignedIn(false);
    setIsLoggedOut(true);
    setIsBooting(false);
    window.location.href = `${idBaseUrl}/logout?redirect=${encodeURIComponent(logoutRedirect)}`;
  }

  if (isBooting) {
    return (
      <main style={{ padding: 24 }}>
        <h1>HQ</h1>
        <p>Checking your workspace session...</p>
      </main>
    );
  }

  if (isLoggedOut) {
    return (
      <main style={{ padding: 24 }}>
        <h1>HQ</h1>
        <p>Your session ended.</p>
        <Button
          onPress={() => {
            setIsLoggedOut(false);
            setIsBooting(true);
            window.location.href = `${authorizeUrl}?app=hq&redirect=${encodeURIComponent(callbackUrl)}`;
          }}
        >
          Continue with Vezham ID
        </Button>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>HQ</h1>
      <WorkspaceSwitcher tenants={tenants} currentSlug={currentTenant} />
      <Card style={{ marginTop: 16 }}>
        <CardContent>
          {isSignedIn ? (
            <>
              <p>Signed in via Vezham ID.</p>
              <Button onPress={logout}>Logout</Button>
            </>
          ) : (
            <Button
              onPress={() => {
                window.location.href = `${authorizeUrl}?app=hq&redirect=${encodeURIComponent(callbackUrl)}`;
              }}
            >
              Continue with Vezham ID
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
