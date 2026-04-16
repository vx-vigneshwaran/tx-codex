import React from "react";
import ReactDOM from "react-dom/client";
import { Button, HeroUIProvider } from "@heroui/react";

function App() {
  const authorizeUrl = import.meta.env.VITE_IDP_AUTHORIZE_URL as string;
  const callback = `${window.location.origin}/auth/callback`;

  return (
    <HeroUIProvider>
      <main style={{ padding: 24 }}>
        <h1>SchoolOS</h1>
        <Button color="primary" onPress={() => (window.location.href = `${authorizeUrl}?app=schoolos&redirect=${encodeURIComponent(callback)}`)}>
          Sign in via ID
        </Button>
      </main>
    </HeroUIProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
