import { useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";
import spheraLogo from "../assets/sphera.jpeg";

function Stars() {
  const stars = useMemo(() => Array.from({ length: 120 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 1.8 + 0.4,
    opacity: Math.random() * 0.55 + 0.08,
    duration: Math.random() * 4 + 2,
    delay: Math.random() * 5,
  })), []);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position: "absolute",
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          borderRadius: "50%",
          background: s.size > 1.8 ? "#a0b8ff" : "#ffffff",
          "--star-opacity": s.opacity,
          opacity: s.opacity,
          animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}

function AnimatedLogo() {
  return (
    <div className="orb-anim" style={{ position: "relative", display: "inline-block" }}>
      <img
        src={spheraLogo}
        alt="Sphēra"
        style={{ width: 260, display: "block", borderRadius: 12 }}
      />
    </div>
  );
}

export function LoginPage({ onLogin }) {
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError(t("loginError"));
        return;
      }
      const { token } = await res.json();
      localStorage.setItem("sphera_token", token);
      onLogin(token);
    } catch {
      setError(t("connectionFailed"));
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "9px 12px", fontSize: 13,
    background: "rgba(255,255,255,.04)", border: "0.5px solid rgba(255,255,255,.1)",
    borderRadius: "var(--border-radius-md)", color: "var(--color-text-primary)",
    outline: "none", transition: "border-color .2s",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", position: "relative",
      background: "radial-gradient(ellipse at 50% 40%, #0a0520 0%, #060610 60%, #03030a 100%)",
    }}>
      <Stars />
      <div className="form-anim" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28, width: 320 }}>

        {/* Logo animado */}
        <AnimatedLogo />

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="text" placeholder={t("username")} autoComplete="username"
            value={username} onChange={e => setUsername(e.target.value)}
            style={inputStyle} required
          />
          <input
            type="password" placeholder={t("password")} autoComplete="current-password"
            value={password} onChange={e => setPassword(e.target.value)}
            style={inputStyle} required
          />

          {error && (
            <div style={{ fontSize: 12, color: "var(--color-text-danger)", textAlign: "center" }}>{error}</div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: "100%", padding: "10px", fontSize: 13, fontWeight: 600,
              background: loading ? "rgba(74,127,212,.4)" : "rgba(74,127,212,.85)",
              border: "none", borderRadius: "var(--border-radius-md)",
              color: "#fff", cursor: loading ? "default" : "pointer",
              letterSpacing: "0.06em", transition: "background .2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading && <span className="spin-anim" style={{ display: "inline-block", fontSize: 14 }}>◌</span>}
            {loading ? t("loggingIn") : t("loginBtn")}
          </button>
        </form>
      </div>
    </div>
  );
}
