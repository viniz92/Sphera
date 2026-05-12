import { useState, useEffect, useRef } from "react";
import { useCluster } from "./hooks/useCluster";
import { useAddons } from "./hooks/useAddons";
import { ClusterCard } from "./components/ClusterCard";
import { LoginPage } from "./components/LoginPage";
import { Logo } from "./components/Logo";
import { useLanguage } from "./context/LanguageContext";

function FlagIcon({ code }) {
  if (code === "pt") return (
    <svg width="22" height="15" viewBox="0 0 22 15" xmlns="http://www.w3.org/2000/svg">
      <rect width="22" height="15" rx="2" fill="#009c3b"/>
      <polygon points="11,1.5 20.5,7.5 11,13.5 1.5,7.5" fill="#fedf00"/>
      <circle cx="11" cy="7.5" r="3.2" fill="#002776"/>
      <path d="M7.9 7.1 Q11 5.5 14.1 7.1" fill="none" stroke="#fff" strokeWidth="0.9"/>
    </svg>
  );
  if (code === "en") return (
    <svg width="22" height="15" viewBox="0 0 22 15" xmlns="http://www.w3.org/2000/svg">
      <rect width="22" height="15" rx="2" fill="#B22234"/>
      <rect y="1.15" width="22" height="1.15" fill="#fff"/>
      <rect y="3.46" width="22" height="1.15" fill="#fff"/>
      <rect y="5.77" width="22" height="1.15" fill="#fff"/>
      <rect y="8.08" width="22" height="1.15" fill="#fff"/>
      <rect y="10.38" width="22" height="1.15" fill="#fff"/>
      <rect y="12.69" width="22" height="1.15" fill="#fff"/>
      <rect width="8.8" height="8.08" rx="2" fill="#3C3B6E"/>
      <g fill="#fff" fontSize="1.6" textAnchor="middle">
        <text x="1.5" y="2.2">★</text><text x="4.4" y="2.2">★</text><text x="7.3" y="2.2">★</text>
        <text x="2.95" y="4">★</text><text x="5.85" y="4">★</text>
        <text x="1.5" y="5.8">★</text><text x="4.4" y="5.8">★</text><text x="7.3" y="5.8">★</text>
      </g>
    </svg>
  );
  if (code === "es") return (
    <svg width="22" height="15" viewBox="0 0 22 15" xmlns="http://www.w3.org/2000/svg">
      <rect width="22" height="15" rx="2" fill="#c60b1e"/>
      <rect y="3.75" width="22" height="7.5" fill="#ffc400"/>
    </svg>
  );
  return null;
}

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  return [theme, () => setTheme(t => t === "dark" ? "light" : "dark")];
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("palantir_token") || "");
  const { cluster, loading, refreshing, error, refresh, lastUpdated } = useCluster(!!token);
  const { addons, loading: addonsLoading, reload: reloadAddons } = useAddons(!!cluster);
  const [theme, toggleTheme] = useTheme();
  const { lang, setLanguage, t } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setShowLangMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function onLogout() { setToken(""); }
    window.addEventListener("palantir:logout", onLogout);
    return () => window.removeEventListener("palantir:logout", onLogout);
  }, []);

  function handleLogin(newToken) { setToken(newToken); }

  function handleLogout() {
    localStorage.removeItem("palantir_token");
    setToken("");
  }

  function handleRefresh() {
    refresh();
    reloadAddons();
  }

  if (!token) return <LoginPage onLogin={handleLogin} />;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--color-text-secondary)" }}>
        {t("connecting")}
      </div>
    );
  }

  if (!cluster) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12, color: "var(--color-text-secondary)" }}>
        <span style={{ fontSize: 28 }}>⚠</span>
        <span>{t("connectionError")}</span>
        <button onClick={handleLogout} style={{ fontSize: 12, marginTop: 4, background: "none", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-secondary)", borderRadius: "var(--border-radius-md)", padding: "4px 12px", cursor: "pointer" }}>
          {t("backToLogin")}
        </button>
      </div>
    );
  }

  const timeLocale = lang === "pt" ? "pt-BR" : "en-US";

  return (
    <div style={{ padding: "0 2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem 0 1rem" }}>
        <Logo size={32} showName />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {lastUpdated && (
            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
              {lastUpdated.toLocaleTimeString(timeLocale, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", fontSize: 12, fontWeight: 600, borderRadius: "var(--border-radius-md)", border: "none", background: "#3b82f6", color: "#fff", cursor: refreshing ? "default" : "pointer", opacity: refreshing ? 0.65 : 1 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: refreshing ? "spin-slow 0.8s linear infinite" : "none" }}>
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
            </svg>
            {refreshing ? t("refreshing") : t("refresh")}
          </button>
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? t("lightTheme") : t("darkTheme")}
            style={{ background: "none", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-secondary)", borderRadius: "var(--border-radius-md)", padding: "4px 8px", fontSize: 14, lineHeight: 1 }}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <div ref={langMenuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowLangMenu(v => !v)}
              style={{ background: "none", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", padding: "3px 6px", lineHeight: 1, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "var(--color-text-primary)" }}
            >
              <FlagIcon code={lang} />
              <svg width="8" height="5" viewBox="0 0 8 5" style={{ opacity: 0.5 }}>
                <polyline points="1,1 4,4 7,1" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
            {showLangMenu && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 100, minWidth: 140, overflow: "hidden" }}>
                {[
                  { code: "pt", label: "Português" },
                  { code: "en", label: "English" },
                  { code: "es", label: "Español" },
                ].map(option => (
                  <button key={option.code} onClick={() => { setLanguage(option.code); setShowLangMenu(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", background: lang === option.code ? "var(--color-background-secondary)" : "none", border: "none", cursor: "pointer", color: lang === option.code ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontSize: 12, textAlign: "left" }}>
                    <FlagIcon code={option.code} />
                    {option.label}
                    {lang === option.code && <span style={{ marginLeft: "auto", color: "var(--color-text-info)", fontSize: 10 }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            style={{ background: "none", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-secondary)", borderRadius: "var(--border-radius-md)", padding: "4px 10px", fontSize: 12 }}
          >
            {t("logout")}
          </button>
        </div>
      </div>
      <ClusterCard cluster={cluster} addons={addons} addonsLoading={addonsLoading} />
    </div>
  );
}
