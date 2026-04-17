import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { Button } from "@heroui/react";
import { fetchIdSession } from "../../../packages/core/src/id-session";

function App() {
  const authorizeUrl = (import.meta.env.VITE_IDP_AUTHORIZE_URL as string | undefined) || "http://localhost:3000/api/oauth/authorize";
  const callback = `${window.location.origin}/auth/callback`;
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("token");
  const loggedOut = params.get("logged_out") === "1";
  const logoutRedirect = `${window.location.origin}/?logged_out=1`;
  const idBaseUrl = new URL(authorizeUrl).origin;
  const [isSignedIn, setIsSignedIn] = useState(() => Boolean(sessionStorage.getItem("vezham_schoolos_token")));
  const [isLoggedOut, setIsLoggedOut] = useState(loggedOut);
  const [isBooting, setIsBooting] = useState(() => !loggedOut && !tokenFromUrl);

  useEffect(() => {
    if (tokenFromUrl) {
      sessionStorage.setItem("vezham_schoolos_token", tokenFromUrl);
      setIsSignedIn(true);
      setIsLoggedOut(false);
      setIsBooting(false);
      window.history.replaceState({}, "", "/");
      return;
    }

    if (!sessionStorage.getItem("vezham_schoolos_token") && !isLoggedOut) {
      window.location.replace(`${authorizeUrl}?app=schoolos&redirect=${encodeURIComponent(callback)}`);
      return;
    }

    if (isLoggedOut) {
      setIsBooting(false);
    }
  }, [authorizeUrl, callback, isLoggedOut, tokenFromUrl]);

  useEffect(() => {
    let disposed = false;

    async function syncSession() {
      const session = await fetchIdSession(idBaseUrl);
      if (disposed) return;

      if (!session) {
        setIsBooting(false);
        return;
      }

      const hasToken = Boolean(sessionStorage.getItem("vezham_schoolos_token"));

      if (!session.authenticated && hasToken) {
        sessionStorage.removeItem("vezham_schoolos_token");
        setIsSignedIn(false);
        setIsLoggedOut(true);
        setIsBooting(false);
        window.history.replaceState({}, "", "/?logged_out=1");
        return;
      }

      if (session.authenticated && !hasToken && !isLoggedOut) {
        window.location.replace(`${authorizeUrl}?app=schoolos&redirect=${encodeURIComponent(callback)}`);
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
  }, [authorizeUrl, callback, idBaseUrl, isLoggedOut]);

  function logout() {
    sessionStorage.removeItem("vezham_schoolos_token");
    setIsSignedIn(false);
    setIsLoggedOut(true);
    setIsBooting(false);
    window.location.href = `${idBaseUrl}/logout?redirect=${encodeURIComponent(logoutRedirect)}`;
  }

  if (isBooting) {
    return (
      <main style={{ padding: 24 }}>
        <h1>SchoolOS</h1>
        <p>Checking your school session...</p>
      </main>
    );
  }

  if (isLoggedOut) {
    return (
      <main style={{ padding: 24 }}>
        <h1>SchoolOS</h1>
        <p>Your session ended.</p>
        <Button
          onPress={() => {
            setIsLoggedOut(false);
            setIsBooting(true);
            window.location.href = `${authorizeUrl}?app=schoolos&redirect=${encodeURIComponent(callback)}`;
          }}
        >
          Sign in via ID
        </Button>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>SchoolOS</h1>
      {isSignedIn ? (
        <>
          <p>Signed in via Vezham ID.</p>
          <Button onPress={logout}>Logout</Button>
        </>
      ) : (
        <Button onPress={() => (window.location.href = `${authorizeUrl}?app=schoolos&redirect=${encodeURIComponent(callback)}`)}>
          Sign in via ID
        </Button>
      )}
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
