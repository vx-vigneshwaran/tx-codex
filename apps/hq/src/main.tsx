import React from "react";
import ReactDOM from "react-dom/client";
import { Button, Card, CardBody, HeroUIProvider } from "@heroui/react";
import { WorkspaceSwitcher } from "./components/workspace-switcher";

const tenants = [
  { id: "1", slug: "acme", name: "Acme" },
  { id: "2", slug: "globex", name: "Globex" },
];

function App() {
  const currentTenant = (import.meta.env.VITE_DEFAULT_TENANT_SLUG as string) || "acme";
  const authorizeUrl = import.meta.env.VITE_IDP_AUTHORIZE_URL as string;
  const callbackUrl = `${window.location.origin}/auth/callback`;

  return (
    <HeroUIProvider>
      <main style={{ padding: 24 }}>
        <h1>HQ</h1>
        <WorkspaceSwitcher tenants={tenants} currentSlug={currentTenant} />
        <Card style={{ marginTop: 16 }}>
          <CardBody>
            <Button
              color="primary"
              onPress={() => {
                window.location.href = `${authorizeUrl}?app=hq&redirect=${encodeURIComponent(callbackUrl)}`;
              }}
            >
              Continue with Vezham ID
            </Button>
          </CardBody>
        </Card>
      </main>
    </HeroUIProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
