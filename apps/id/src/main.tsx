import React from "react";
import ReactDOM from "react-dom/client";
import { HeroUIProvider, Button } from "@heroui/react";

function App() {
  return (
    <HeroUIProvider>
      <main style={{ fontFamily: "Inter, sans-serif", padding: 24 }}>
        <h1>Vezham ID</h1>
        <p>Central identity app running as a standalone TanStack/Vite app.</p>
        <Button color="primary">Login with Better Auth</Button>
      </main>
    </HeroUIProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
