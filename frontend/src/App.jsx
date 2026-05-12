import { useState, useEffect } from "react";
import { useCluster } from "./hooks/useCluster";
import { useAddons } from "./hooks/useAddons";
import { ClusterCard } from "./components/ClusterCard";
import { LoginPage } from "./components/LoginPage";
import { Logo } from "./components/Logo";
import { useLanguage } from "./context/LanguageContext";

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
  const { lang, toggle: toggleLang, t } = useLanguage();

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
          <button
            onClick={toggleLang}
            title={lang === "pt" ? "Switch to English" : "Mudar para Português"}
            style={{ background: "none", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-secondary)", borderRadius: "var(--border-radius-md)", padding: "3px 7px", fontSize: 16, lineHeight: 1, cursor: "pointer" }}
          >
            {lang === "pt" ? "🇧🇷" : "🇺🇸"}
          </button>
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
