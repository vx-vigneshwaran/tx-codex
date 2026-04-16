import React from "react";
import ReactDOM from "react-dom/client";
import { Button } from "@heroui/react";

function App() {
  const params = new URLSearchParams(window.location.search);
  const app = params.get("app");
  const redirect = params.get("redirect");
  const canContinue = Boolean(app && redirect);

  async function login() {
    await fetch("/login", { method: "POST" });
    if (canContinue) {
      window.location.href = `/api/oauth/authorize?app=${encodeURIComponent(app!)}&redirect=${encodeURIComponent(redirect!)}`;
    }
  }

  return (
    <main style={{ fontFamily: "Inter, sans-serif", padding: 24 }}>
      <h1>Vezham ID</h1>
      <p>Central identity app running as a standalone TanStack/Vite app.</p>
      {canContinue ? <p>Sign in to continue to {app}.</p> : null}
      <Button onPress={login}>Login with Better Auth</Button>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
