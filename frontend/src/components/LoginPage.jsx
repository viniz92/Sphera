import { useState, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";

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
      <svg width="120" height="120" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="lp-orb"><circle cx="80" cy="80" r="68"/></clipPath>
        </defs>
        <circle cx="80" cy="80" r="68" fill="#06060F"/>
        <ellipse cx="80" cy="80" rx="68" ry="18" fill="none" stroke="#1E2E5A" strokeWidth="0.9" opacity="0.55" clipPath="url(#lp-orb)"/>
        <ellipse cx="80" cy="80" rx="68" ry="38" fill="none" stroke="#1E2E5A" strokeWidth="0.7" opacity="0.35" clipPath="url(#lp-orb)"/>
        <ellipse cx="80" cy="80" rx="68" ry="56" fill="none" stroke="#1E2E5A" strokeWidth="0.6" opacity="0.2" clipPath="url(#lp-orb)"/>
        <ellipse cx="80" cy="80" rx="22" ry="68" fill="none" stroke="#1E2E5A" strokeWidth="0.8" opacity="0.45" clipPath="url(#lp-orb)"/>
        <ellipse cx="80" cy="80" rx="44" ry="68" fill="none" stroke="#1E2E5A" strokeWidth="0.7" opacity="0.28" clipPath="url(#lp-orb)"/>
        <circle cx="80" cy="90" r="50" fill="#100820" opacity="0.65" clipPath="url(#lp-orb)"/>
        <circle cx="80" cy="95" r="34" fill="#180830" opacity="0.5" clipPath="url(#lp-orb)"/>
        <path d="M80 22 C76 26 72 31 70 37 C68 43 67 50 67 58 C66 66 66 74 67 82 C68 90 70 97 72 103 C74 109 76 113 78 116 C79 118 80 119 80 119 C80 119 81 118 82 116 C84 113 86 109 88 103 C90 97 92 90 93 82 C94 74 94 66 93 58 C93 50 92 43 90 37 C88 31 84 26 80 22Z" fill="#0E0E20" clipPath="url(#lp-orb)"/>
        <path d="M80 18 C77 21 74 25 72 30 C70 35 69 40 69 46 C71 43 73 40 76 38 C78 37 79 36 80 35 C81 36 82 37 84 38 C87 40 89 43 91 46 C91 40 90 35 88 30 C86 25 83 21 80 18Z" fill="#08081A" clipPath="url(#lp-orb)"/>

        {/* Olhos animados */}
        <g className="eyes-anim">
          <ellipse cx="73" cy="58" rx="5" ry="3.5" fill="#CC3000" opacity="0.9"/>
          <ellipse cx="87" cy="58" rx="5" ry="3.5" fill="#CC3000" opacity="0.9"/>
          <ellipse cx="73" cy="58" rx="3" ry="2" fill="#FF5500"/>
          <ellipse cx="87" cy="58" rx="3" ry="2" fill="#FF5500"/>
          <ellipse cx="73" cy="58" rx="1.3" ry="1" fill="#FFB030"/>
          <ellipse cx="87" cy="58" rx="1.3" ry="1" fill="#FFB030"/>
          <ellipse cx="71.5" cy="56.5" rx="0.8" ry="0.6" fill="#FFDD88" opacity="0.6"/>
          <ellipse cx="85.5" cy="56.5" rx="0.8" ry="0.6" fill="#FFDD88" opacity="0.6"/>
        </g>

        <path d="M67 58 C62 60 55 64 46 70 C38 76 30 82 22 90 C18 95 16 100 18 104 C22 98 28 92 36 88 C42 85 48 84 52 86 C54 88 54 93 53 99 C55 93 57 86 58 78 C60 70 63 63 67 58Z" fill="#0C0C1E" opacity="0.95" clipPath="url(#lp-orb)"/>
        <path d="M93 58 C98 60 105 64 114 70 C122 76 130 82 138 90 C142 95 144 100 142 104 C138 98 132 92 124 88 C118 85 112 84 108 86 C106 88 106 93 107 99 C105 93 103 86 102 78 C100 70 97 63 93 58Z" fill="#0C0C1E" opacity="0.95" clipPath="url(#lp-orb)"/>
        <circle cx="80" cy="80" r="68" fill="none" stroke="#1A2A5A" strokeWidth="2.5"/>
        <circle cx="80" cy="80" r="68" fill="none" stroke="#2A3A7A" strokeWidth="1" opacity="0.4"/>
      </svg>
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
      localStorage.setItem("palantir_token", token);
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <AnimatedLogo />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "0.2em", color: "#e0e0f0" }}>PALANTIR</div>
            <div style={{ fontSize: 10, letterSpacing: "0.18em", color: "#4A7FD4", marginTop: 3 }}>EKS DASHBOARD</div>
          </div>
        </div>

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
