import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { fetchIdSession } from "../../../packages/core/src/id-session";

type DriveItem = {
  id: string;
  name: string;
  kind: "folder" | "file";
  meta: string;
};

type AuthView = "booting" | "signed_in" | "signed_out" | "session_ended";

const seedItems: DriveItem[] = [
  { id: "1", name: "Admissions", kind: "folder", meta: "12 docs" },
  { id: "2", name: "Parent Outreach", kind: "folder", meta: "7 docs" },
  { id: "3", name: "budget-q2.xlsx", kind: "file", meta: "248 KB" },
];

function driveDebug(event: string, details?: Record<string, unknown>) {
  if (!import.meta.env.DEV) return;
  const time = new Date().toISOString().slice(11, 23);
  console.log(`[drive ${time}] ${event}`, details ?? {});
}

function App() {
  const authorizeUrl = (import.meta.env.VITE_IDP_AUTHORIZE_URL as string | undefined) || "http://localhost:3000/api/oauth/authorize";
  const callback = `${window.location.origin}/auth/callback`;
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("token");
  const loggedOut = params.get("logged_out") === "1";
  const logoutRedirect = `${window.location.origin}/?logged_out=1`;
  const idBaseUrl = new URL(authorizeUrl).origin;
  const [authView, setAuthView] = useState<AuthView>(() => {
    if (loggedOut) return "session_ended";
    if (tokenFromUrl) return "booting";
    return sessionStorage.getItem("vezham_drive_token") ? "booting" : "signed_out";
  });
  const [items, setItems] = useState(seedItems);
  const [uploadLabel, setUploadLabel] = useState("Drop in a file to stage it");
  const latestSyncId = useRef(0);

  const storageUsed = useMemo(() => `${items.filter((item) => item.kind === "file").length * 18 + 22}% used`, [items]);

  useEffect(() => {
    driveDebug("authView", {
      authView,
      path: window.location.pathname,
      search: window.location.search,
      hasToken: Boolean(sessionStorage.getItem("vezham_drive_token")),
    });
  }, [authView]);

  useEffect(() => {
    driveDebug("boot", {
      tokenFromUrl: Boolean(tokenFromUrl),
      loggedOut,
      path: window.location.pathname,
      search: window.location.search,
    });

    if (tokenFromUrl) {
      driveDebug("token_from_url", { tokenLength: tokenFromUrl.length });
      sessionStorage.setItem("vezham_drive_token", tokenFromUrl);
      setAuthView("signed_in");
      window.history.replaceState({}, "", "/");
      return;
    }

    if (!sessionStorage.getItem("vezham_drive_token") && authView === "booting") {
      driveDebug("boot_without_token", {});
      setAuthView("signed_out");
      return;
    }

    if (authView === "session_ended") {
      driveDebug("boot_session_ended_skip", {});
      return;
    }

    if (!sessionStorage.getItem("vezham_drive_token") && authView === "signed_out") {
      driveDebug("redirect_authorize_from_signed_out", {});
      window.location.replace(`${authorizeUrl}?app=drive&redirect=${encodeURIComponent(callback)}`);
      return;
    }
  }, [authView, authorizeUrl, callback, tokenFromUrl]);

  useEffect(() => {
    if (authView === "session_ended" || authView === "signed_out") {
      driveDebug("sync_effect_skip", { authView });
      return;
    }

    let disposed = false;

    async function syncSession() {
      const syncId = ++latestSyncId.current;
      driveDebug("sync_start", {
        syncId,
        authView,
        hasToken: Boolean(sessionStorage.getItem("vezham_drive_token")),
      });
      const session = await fetchIdSession(idBaseUrl);
      if (disposed || syncId !== latestSyncId.current) return;

      driveDebug("sync_result", {
        syncId,
        authenticated: session?.authenticated ?? null,
        hasToken: Boolean(sessionStorage.getItem("vezham_drive_token")),
      });

      if (!session) {
        if (authView === "booting") {
          driveDebug("sync_no_session_response", {});
          setAuthView(sessionStorage.getItem("vezham_drive_token") ? "signed_in" : "signed_out");
        }
        return;
      }

      const hasToken = Boolean(sessionStorage.getItem("vezham_drive_token"));

      if (!session.authenticated && hasToken) {
        driveDebug("remote_logout_detected", { syncId });
        sessionStorage.removeItem("vezham_drive_token");
        setAuthView("session_ended");
        window.history.replaceState({}, "", "/?logged_out=1");
        return;
      }

      if (session.authenticated && !hasToken) {
        driveDebug("redirect_authorize_missing_local_token", { syncId });
        window.location.replace(`${authorizeUrl}?app=drive&redirect=${encodeURIComponent(callback)}`);
        return;
      }

      driveDebug("sync_set_auth_view", { syncId, nextAuthView: hasToken ? "signed_in" : "signed_out" });
      setAuthView(hasToken ? "signed_in" : "signed_out");
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
      driveDebug("sync_effect_cleanup", { authView });
      window.clearInterval(intervalId);
      window.removeEventListener("focus", syncSession);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [authView, authorizeUrl, callback, idBaseUrl]);

  function logout() {
    driveDebug("local_logout_click", {});
    sessionStorage.removeItem("vezham_drive_token");
    setAuthView("session_ended");
    window.location.href = `${idBaseUrl}/logout?redirect=${encodeURIComponent(logoutRedirect)}`;
  }

  if (authView === "booting") {
    return (
      <main style={shellStyle}>
        <section style={heroStyle}>
          <div>
            <p style={eyebrowStyle}>Drive</p>
            <h1 style={titleStyle}>Reconnecting your workspace...</h1>
            <p style={copyStyle}>We are checking whether your Vezham ID session is still active.</p>
          </div>
        </section>
      </main>
    );
  }

  if (authView === "signed_out") {
    return (
      <main style={shellStyle}>
        <section style={heroStyle}>
          <div>
            <p style={eyebrowStyle}>Drive</p>
            <h1 style={titleStyle}>Shared files without the fake demo energy.</h1>
            <p style={copyStyle}>Sign in with Vezham ID to browse folders, stage uploads, and keep the workspace grounded in a real app shape.</p>
          </div>
          <button
            onClick={() => {
              window.location.href = `${authorizeUrl}?app=drive&redirect=${encodeURIComponent(callback)}`;
            }}
            style={primaryButtonStyle}
          >
            Sign in to Drive
          </button>
        </section>
      </main>
    );
  }

  return (
    <main style={shellStyle}>
      <section style={appShellStyle}>
        <div style={panelStyle}>
          <p style={eyebrowStyle}>Storage</p>
          <h1 style={sectionTitleStyle}>Team Drive</h1>
          <p style={mutedStyle}>{storageUsed}</p>
          <button onClick={logout} style={secondaryButtonStyle}>
            Logout
          </button>
          <label style={uploadBoxStyle}>
            <span style={{ fontWeight: 600 }}>Upload a file</span>
            <span style={mutedStyle}>{uploadLabel}</span>
            <input
              type="file"
              style={{ display: "none" }}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setItems((current) => [{ id: crypto.randomUUID(), name: file.name, kind: "file", meta: `${Math.max(1, Math.round(file.size / 1024))} KB` }, ...current]);
                setUploadLabel(`${file.name} staged just now`);
              }}
            />
          </label>
        </div>
        <section style={listPanelStyle}>
          <div style={listHeaderStyle}>
            <div>
              <p style={eyebrowStyle}>Workspace</p>
              <h2 style={sectionTitleStyle}>Recent folders and files</h2>
            </div>
          </div>
          <div style={listStyle}>
            {items.map((item) => (
              <article key={item.id} style={listItemStyle}>
                <div>
                  <strong>{item.name}</strong>
                  <p style={mutedStyle}>{item.kind === "folder" ? "Folder" : "File"}</p>
                </div>
                <span style={pillStyle}>{item.meta}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
      {authView === "session_ended" ? (
        <section style={overlayStyle}>
          <div style={overlayCardStyle}>
            <p style={eyebrowStyle}>Drive</p>
            <h2 style={sectionTitleStyle}>Your session ended.</h2>
            <p style={copyStyle}>Sign in again to get back to your files.</p>
            <button
              onClick={() => {
                driveDebug("overlay_sign_in_click", {});
                setAuthView("booting");
                window.location.href = `${authorizeUrl}?app=drive&redirect=${encodeURIComponent(callback)}`;
              }}
              style={primaryButtonStyle}
            >
              Sign in to Drive
            </button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  margin: 0,
  padding: 24,
  background: "linear-gradient(135deg, #f7f4ea 0%, #d9eef6 100%)",
  color: "#13212d",
  fontFamily: "ui-sans-serif, system-ui, sans-serif",
};

const heroStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: "0 auto",
  minHeight: "calc(100vh - 48px)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: 24,
  padding: 32,
  borderRadius: 8,
  background: "rgba(255,255,255,0.74)",
  boxShadow: "0 24px 60px rgba(19,33,45,0.08)",
};

const appShellStyle: React.CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "minmax(260px, 320px) minmax(0, 1fr)",
  gap: 20,
};

const panelStyle: React.CSSProperties = {
  padding: 24,
  borderRadius: 8,
  background: "rgba(255,255,255,0.78)",
  boxShadow: "0 24px 60px rgba(19,33,45,0.08)",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const listPanelStyle: React.CSSProperties = {
  ...panelStyle,
  minHeight: "calc(100vh - 48px)",
};

const listHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const listItemStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  padding: 16,
  borderRadius: 8,
  background: "#fffdfa",
  border: "1px solid rgba(19,33,45,0.08)",
};

const uploadBoxStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  padding: 16,
  borderRadius: 8,
  border: "1px dashed rgba(19,33,45,0.24)",
  background: "rgba(255,255,255,0.55)",
  cursor: "pointer",
};

const primaryButtonStyle: React.CSSProperties = {
  border: 0,
  borderRadius: 8,
  padding: "14px 18px",
  background: "#0d8f6f",
  color: "#ffffff",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  alignSelf: "flex-start",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  background: "#20485d",
};

const titleStyle: React.CSSProperties = {
  margin: "8px 0 12px",
  fontSize: 44,
  lineHeight: 1,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "6px 0",
  fontSize: 28,
  lineHeight: 1.1,
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 0,
  textTransform: "uppercase",
  color: "#0d8f6f",
};

const copyStyle: React.CSSProperties = {
  maxWidth: 620,
  fontSize: 18,
  lineHeight: 1.5,
};

const mutedStyle: React.CSSProperties = {
  margin: 0,
  color: "#53606d",
};

const pillStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 999,
  background: "#dff6ee",
  color: "#0f5d49",
  fontSize: 13,
  fontWeight: 700,
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "grid",
  placeItems: "center",
  padding: 24,
  background: "rgba(19,33,45,0.26)",
  backdropFilter: "blur(8px)",
};

const overlayCardStyle: React.CSSProperties = {
  width: "min(100%, 520px)",
  padding: 24,
  borderRadius: 8,
  background: "rgba(255,255,255,0.96)",
  boxShadow: "0 24px 60px rgba(19,33,45,0.16)",
  display: "grid",
  gap: 14,
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <App />,
);
