import React from "react";
import ReactDOM from "react-dom/client";
import { Button } from "@heroui/react";

function App() {
  const authorizeUrl = (import.meta.env.VITE_IDP_AUTHORIZE_URL as string | undefined) || "http://localhost:3000/api/oauth/authorize";
  const callback = `${window.location.origin}/auth/callback`;
  const tokenFromUrl = new URLSearchParams(window.location.search).get("token");

  if (tokenFromUrl) {
    sessionStorage.setItem("vezham_apps_token", tokenFromUrl);
    window.history.replaceState({}, "", "/");
  }

  const isSignedIn = Boolean(tokenFromUrl || sessionStorage.getItem("vezham_apps_token"));

  return (
    <main style={{ padding: 24 }}>
      <h1>Apps Hub</h1>
      {isSignedIn ? (
        <p>Signed in via Vezham ID.</p>
      ) : (
        <Button onPress={() => (window.location.href = `${authorizeUrl}?app=apps&redirect=${encodeURIComponent(callback)}`)}>
          Sign in via ID
        </Button>
      )}
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
