import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { fetchIdSession } from "../../../packages/core/src/id-session";

type Note = {
  id: string;
  title: string;
  body: string;
};

const seedNotes: Note[] = [
  { id: "1", title: "Monday standup", body: "Open with admissions status, then move to parent outreach." },
  { id: "2", title: "Hiring loop", body: "Bundle scorecards into one review note before Friday afternoon." },
];

function App() {
  const authorizeUrl = (import.meta.env.VITE_IDP_AUTHORIZE_URL as string | undefined) || "http://localhost:3000/api/oauth/authorize";
  const callback = `${window.location.origin}/auth/callback`;
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("token");
  const loggedOut = params.get("logged_out") === "1";
  const logoutRedirect = `${window.location.origin}/?logged_out=1`;
  const idBaseUrl = new URL(authorizeUrl).origin;
  const [isSignedIn, setIsSignedIn] = useState(() => Boolean(sessionStorage.getItem("vezham_notes_token")));
  const [isLoggedOut, setIsLoggedOut] = useState(loggedOut);
  const [isBooting, setIsBooting] = useState(() => !loggedOut && !tokenFromUrl);
  const [notes, setNotes] = useState(seedNotes);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (tokenFromUrl) {
      sessionStorage.setItem("vezham_notes_token", tokenFromUrl);
      setIsSignedIn(true);
      setIsLoggedOut(false);
      setIsBooting(false);
      window.history.replaceState({}, "", "/");
      return;
    }

    if (!sessionStorage.getItem("vezham_notes_token") && !isLoggedOut) {
      window.location.replace(`${authorizeUrl}?app=notes&redirect=${encodeURIComponent(callback)}`);
      return;
    }

    if (isLoggedOut) {
      setIsBooting(false);
    }
  }, [authorizeUrl, callback, isLoggedOut, tokenFromUrl]);

  useEffect(() => {
    if (isLoggedOut) {
      setIsBooting(false);
      return;
    }

    let disposed = false;

    async function syncSession() {
      const session = await fetchIdSession(idBaseUrl);
      if (disposed) return;

      if (!session) {
        setIsBooting(false);
        return;
      }

      const hasToken = Boolean(sessionStorage.getItem("vezham_notes_token"));

      if (!session.authenticated && hasToken) {
        sessionStorage.removeItem("vezham_notes_token");
        setIsLoggedOut(true);
        setIsBooting(false);
        window.history.replaceState({}, "", "/?logged_out=1");
        return;
      }

      if (session.authenticated && !hasToken && !isLoggedOut) {
        window.location.replace(`${authorizeUrl}?app=notes&redirect=${encodeURIComponent(callback)}`);
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
    sessionStorage.removeItem("vezham_notes_token");
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
            <p style={eyebrowStyle}>Notes</p>
            <h1 style={titleStyle}>Bringing your notes back...</h1>
            <p style={copyStyle}>We are checking whether your Vezham ID session is still active.</p>
          </div>
        </section>
      </main>
    );
  }

  if (!isSignedIn && !isLoggedOut) {
    return (
      <main style={shellStyle}>
        <section style={heroStyle}>
          <div>
            <p style={eyebrowStyle}>Notes</p>
            <h1 style={titleStyle}>Capture the good ideas before they wander off.</h1>
            <p style={copyStyle}>This app now behaves like an actual notes workspace, not a spare OAuth landing page with a lonely button.</p>
          </div>
          <button
            onClick={() => {
              window.location.href = `${authorizeUrl}?app=notes&redirect=${encodeURIComponent(callback)}`;
            }}
            style={primaryButtonStyle}
          >
            Sign in to Notes
          </button>
        </section>
      </main>
    );
  }

  return (
    <main style={shellStyle}>
      <section style={notesLayoutStyle}>
        <section style={composerStyle}>
          <p style={eyebrowStyle}>New note</p>
          <h1 style={sectionTitleStyle}>Write something worth keeping</h1>
          <button style={secondaryButtonStyle} onClick={logout}>
            Logout
          </button>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" style={inputStyle} />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Start typing"
            rows={10}
            style={textareaStyle}
          />
          <button
            style={primaryButtonStyle}
            onClick={() => {
              if (!title.trim() || !body.trim()) return;
              setNotes((current) => [{ id: crypto.randomUUID(), title: title.trim(), body: body.trim() }, ...current]);
              setTitle("");
              setBody("");
            }}
          >
            Save note
          </button>
        </section>
        <section style={notesPanelStyle}>
          <div>
            <p style={eyebrowStyle}>Library</p>
            <h2 style={sectionTitleStyle}>Recent notes</h2>
          </div>
          <div style={noteListStyle}>
            {notes.map((note) => (
              <article key={note.id} style={noteCardStyle}>
                <h3 style={{ margin: 0 }}>{note.title}</h3>
                <p style={mutedStyle}>{note.body}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
      {isLoggedOut ? (
        <section style={overlayStyle}>
          <div style={overlayCardStyle}>
            <p style={eyebrowStyle}>Notes</p>
            <h2 style={sectionTitleStyle}>Your session ended.</h2>
            <p style={copyStyle}>Sign in again to get back to your notes.</p>
            <button
              onClick={() => {
                setIsLoggedOut(false);
                setIsBooting(true);
                window.location.href = `${authorizeUrl}?app=notes&redirect=${encodeURIComponent(callback)}`;
              }}
              style={primaryButtonStyle}
            >
              Sign in to Notes
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
  background: "linear-gradient(135deg, #fff1db 0%, #d8f2ea 100%)",
  color: "#1f1b16",
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
  background: "rgba(255,255,255,0.78)",
  boxShadow: "0 24px 60px rgba(31,27,22,0.08)",
};

const notesLayoutStyle: React.CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)",
  gap: 20,
};

const composerStyle: React.CSSProperties = {
  padding: 24,
  borderRadius: 8,
  background: "rgba(255,255,255,0.8)",
  boxShadow: "0 24px 60px rgba(31,27,22,0.08)",
  display: "grid",
  gap: 14,
  alignContent: "start",
};

const notesPanelStyle: React.CSSProperties = {
  ...composerStyle,
  minHeight: "calc(100vh - 48px)",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(31,27,22,0.2)",
  display: "grid",
  placeItems: "center",
  padding: 24,
};

const overlayCardStyle: React.CSSProperties = {
  width: "min(420px, 100%)",
  padding: 24,
  borderRadius: 8,
  background: "rgba(255,255,255,0.96)",
  boxShadow: "0 24px 60px rgba(31,27,22,0.18)",
  display: "grid",
  gap: 16,
};

const noteListStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const noteCardStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 8,
  background: "#fffdfa",
  border: "1px solid rgba(31,27,22,0.08)",
  display: "grid",
  gap: 8,
};

const inputStyle: React.CSSProperties = {
  borderRadius: 8,
  border: "1px solid rgba(31,27,22,0.14)",
  padding: "12px 14px",
  fontSize: 16,
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  minHeight: 220,
  fontFamily: "inherit",
};

const primaryButtonStyle: React.CSSProperties = {
  border: 0,
  borderRadius: 8,
  padding: "14px 18px",
  background: "#d1541f",
  color: "#ffffff",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  alignSelf: "flex-start",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  background: "#295c66",
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
  color: "#d1541f",
};

const copyStyle: React.CSSProperties = {
  maxWidth: 620,
  fontSize: 18,
  lineHeight: 1.5,
};

const mutedStyle: React.CSSProperties = {
  margin: 0,
  color: "#64584e",
  lineHeight: 1.5,
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
