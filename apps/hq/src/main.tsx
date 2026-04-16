import React from "react";
import ReactDOM from "react-dom/client";
import { Button, Card, CardContent } from "@heroui/react";
import { WorkspaceSwitcher } from "./components/workspace-switcher";

const tenants = [
  { id: "1", slug: "acme", name: "Acme" },
  { id: "2", slug: "globex", name: "Globex" },
];

function App() {
  const currentTenant = (import.meta.env.VITE_DEFAULT_TENANT_SLUG as string) || "acme";
  const authorizeUrl = (import.meta.env.VITE_IDP_AUTHORIZE_URL as string | undefined) || "http://localhost:3000/api/oauth/authorize";
  const callbackUrl = `${window.location.origin}/auth/callback`;
  const tokenFromUrl = new URLSearchParams(window.location.search).get("token");

  if (tokenFromUrl) {
    sessionStorage.setItem("vezham_hq_token", tokenFromUrl);
    window.history.replaceState({}, "", "/");
  }

  const isSignedIn = Boolean(tokenFromUrl || sessionStorage.getItem("vezham_hq_token"));

  return (
    <main style={{ padding: 24 }}>
      <h1>HQ</h1>
      <WorkspaceSwitcher tenants={tenants} currentSlug={currentTenant} />
      <Card style={{ marginTop: 16 }}>
        <CardContent>
          {isSignedIn ? (
            <p>Signed in via Vezham ID.</p>
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
