import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { fetchIdSession } from "../../../packages/core/src/id-session";

type Reminder = {
  id: string;
  title: string;
  due: string;
  done: boolean;
};

const seedReminders: Reminder[] = [
  { id: "1", title: "Call back the parent council", due: "Today 4:00 PM", done: false },
  { id: "2", title: "Review transport budget", due: "Tomorrow 9:30 AM", done: true },
];

function App() {
  const authorizeUrl = (import.meta.env.VITE_IDP_AUTHORIZE_URL as string | undefined) || "http://localhost:3000/api/oauth/authorize";
  const callback = `${window.location.origin}/auth/callback`;
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("token");
  const loggedOut = params.get("logged_out") === "1";
  const logoutRedirect = `${window.location.origin}/?logged_out=1`;
  const idBaseUrl = new URL(authorizeUrl).origin;
  const [isSignedIn, setIsSignedIn] = useState(() => Boolean(sessionStorage.getItem("vezham_remainder_token")));
  const [isLoggedOut, setIsLoggedOut] = useState(loggedOut);
  const [isBooting, setIsBooting] = useState(() => !loggedOut && !tokenFromUrl);
  const [reminders, setReminders] = useState(seedReminders);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDue, setDraftDue] = useState("");

  useEffect(() => {
    if (tokenFromUrl) {
      sessionStorage.setItem("vezham_remainder_token", tokenFromUrl);
      setIsSignedIn(true);
      setIsLoggedOut(false);
      setIsBooting(false);
      window.history.replaceState({}, "", "/");
      return;
    }

    if (!sessionStorage.getItem("vezham_remainder_token") && !isLoggedOut) {
      window.location.replace(`${authorizeUrl}?app=remainder&redirect=${encodeURIComponent(callback)}`);
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

      const hasToken = Boolean(sessionStorage.getItem("vezham_remainder_token"));

      if (!session.authenticated && hasToken) {
        sessionStorage.removeItem("vezham_remainder_token");
        setIsSignedIn(false);
        setIsLoggedOut(true);
        setIsBooting(false);
        window.history.replaceState({}, "", "/?logged_out=1");
        return;
      }

      if (session.authenticated && !hasToken && !isLoggedOut) {
        window.location.replace(`${authorizeUrl}?app=remainder&redirect=${encodeURIComponent(callback)}`);
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
    sessionStorage.removeItem("vezham_remainder_token");
    setIsSignedIn(false);
    setIsLoggedOut(true);
    setIsBooting(false);
    window.location.href = `${idBaseUrl}/logout?redirect=${encodeURIComponent(logoutRedirect)}`;
  }

  if (isBooting) {
    return (
      <main style={shellStyle}>
        <section style={heroStyle}>
          <div>
            <p style={eyebrowStyle}>Remainder</p>
            <h1 style={titleStyle}>Checking your reminders...</h1>
            <p style={copyStyle}>We are checking whether your Vezham ID session is still active.</p>
          </div>
        </section>
      </main>
    );
  }

  if (isLoggedOut) {
    return (
      <main style={shellStyle}>
        <section style={heroStyle}>
          <div>
            <p style={eyebrowStyle}>Remainder</p>
            <h1 style={titleStyle}>Your session ended.</h1>
            <p style={copyStyle}>Sign in again to get back to your reminders.</p>
          </div>
          <button
            onClick={() => {
              setIsLoggedOut(false);
              setIsBooting(true);
              window.location.href = `${authorizeUrl}?app=remainder&redirect=${encodeURIComponent(callback)}`;
            }}
            style={primaryButtonStyle}
          >
            Sign in to Remainder
          </button>
        </section>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main style={shellStyle}>
        <section style={heroStyle}>
          <div>
            <p style={eyebrowStyle}>Remainder</p>
            <h1 style={titleStyle}>Keep the loose ends from running the day.</h1>
            <p style={copyStyle}>This one tracks actual reminders, even if the app name is still spelled exactly how you asked for it.</p>
          </div>
          <button
            onClick={() => {
              window.location.href = `${authorizeUrl}?app=remainder&redirect=${encodeURIComponent(callback)}`;
            }}
            style={primaryButtonStyle}
          >
            Sign in to Remainder
          </button>
        </section>
      </main>
    );
  }

  return (
    <main style={shellStyle}>
      <section style={plannerLayoutStyle}>
        <section style={plannerPanelStyle}>
          <div>
            <p style={eyebrowStyle}>Planner</p>
            <h1 style={sectionTitleStyle}>Today and next</h1>
          </div>
          <button style={secondaryButtonStyle} onClick={logout}>
            Logout
          </button>
          <div style={composerRowStyle}>
            <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="Reminder" style={inputStyle} />
            <input value={draftDue} onChange={(event) => setDraftDue(event.target.value)} placeholder="When" style={inputStyle} />
            <button
              style={primaryButtonStyle}
              onClick={() => {
                if (!draftTitle.trim() || !draftDue.trim()) return;
                setReminders((current) => [{ id: crypto.randomUUID(), title: draftTitle.trim(), due: draftDue.trim(), done: false }, ...current]);
                setDraftTitle("");
                setDraftDue("");
              }}
            >
              Add reminder
            </button>
          </div>
          <div style={listStyle}>
            {reminders.map((reminder) => (
              <article key={reminder.id} style={reminderCardStyle}>
                <label style={reminderLabelStyle}>
                  <input
                    type="checkbox"
                    checked={reminder.done}
                    onChange={() => {
                      setReminders((current) =>
                        current.map((entry) => (entry.id === reminder.id ? { ...entry, done: !entry.done } : entry)),
                      );
                    }}
                  />
                  <div>
                    <strong style={{ textDecoration: reminder.done ? "line-through" : "none" }}>{reminder.title}</strong>
                    <p style={mutedStyle}>{reminder.due}</p>
                  </div>
                </label>
                <span style={reminder.done ? pillDoneStyle : pillOpenStyle}>{reminder.done ? "Done" : "Open"}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  margin: 0,
  padding: 24,
  background: "linear-gradient(135deg, #f7e9e1 0%, #efeabf 100%)",
  color: "#241915",
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
  background: "rgba(255,255,255,0.8)",
  boxShadow: "0 24px 60px rgba(36,25,21,0.08)",
};

const plannerLayoutStyle: React.CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
};

const plannerPanelStyle: React.CSSProperties = {
  padding: 24,
  borderRadius: 8,
  background: "rgba(255,255,255,0.82)",
  boxShadow: "0 24px 60px rgba(36,25,21,0.08)",
  display: "grid",
  gap: 16,
  minHeight: "calc(100vh - 48px)",
  alignContent: "start",
};

const composerRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 2fr) minmax(180px, 1fr) auto",
  gap: 12,
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const reminderCardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  padding: 16,
  borderRadius: 8,
  background: "#fffdfa",
  border: "1px solid rgba(36,25,21,0.08)",
};

const reminderLabelStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 12,
};

const inputStyle: React.CSSProperties = {
  borderRadius: 8,
  border: "1px solid rgba(36,25,21,0.14)",
  padding: "12px 14px",
  fontSize: 16,
};

const primaryButtonStyle: React.CSSProperties = {
  border: 0,
  borderRadius: 8,
  padding: "14px 18px",
  background: "#ba3f29",
  color: "#ffffff",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  alignSelf: "flex-start",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  background: "#4e5f28",
};

const pillOpenStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 999,
  background: "#fde5d8",
  color: "#8a341c",
  fontSize: 13,
  fontWeight: 700,
};

const pillDoneStyle: React.CSSProperties = {
  ...pillOpenStyle,
  background: "#d9f3d9",
  color: "#25623a",
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
  color: "#ba3f29",
};

const copyStyle: React.CSSProperties = {
  maxWidth: 620,
  fontSize: 18,
  lineHeight: 1.5,
};

const mutedStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#6c5a52",
  lineHeight: 1.5,
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
