import { useState, useEffect } from "react";
import { useCluster } from "./hooks/useCluster";
import { useAddons } from "./hooks/useAddons";
import { ClusterCard } from "./components/ClusterCard";
import { LoginPage } from "./components/LoginPage";
import { Logo } from "./components/Logo";

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
        Conectando ao cluster...
      </div>
    );
  }

  if (!cluster) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12, color: "var(--color-text-secondary)" }}>
        <span style={{ fontSize: 28 }}>⚠</span>
        <span>Não foi possível conectar ao cluster.</span>
        <button onClick={handleLogout} style={{ fontSize: 12, marginTop: 4, background: "none", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-secondary)", borderRadius: "var(--border-radius-md)", padding: "4px 12px", cursor: "pointer" }}>
          Voltar ao login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem 0 1rem" }}>
        <Logo size={32} showName />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {lastUpdated && (
            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
              {lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Atualizar dados"
            style={{ background: "none", border: "0.5px solid var(--color-border-secondary)", color: refreshing ? "var(--color-text-tertiary)" : "var(--color-text-secondary)", borderRadius: "var(--border-radius-md)", padding: "4px 10px", fontSize: 12, lineHeight: 1, cursor: refreshing ? "default" : "pointer", display: "flex", alignItems: "center", gap: 5 }}
          >
            <span style={{ fontSize: 14, display: "inline-block", animation: refreshing ? "spin-slow 1s linear infinite" : "none" }}>{refreshing ? "↻" : "↺"}</span>
            {refreshing ? "Atualizando..." : "Atualizar"}
          </button>
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Tema claro" : "Tema escuro"}
            style={{ background: "none", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-secondary)", borderRadius: "var(--border-radius-md)", padding: "4px 8px", fontSize: 14, lineHeight: 1 }}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button
            onClick={handleLogout}
            style={{ background: "none", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-secondary)", borderRadius: "var(--border-radius-md)", padding: "4px 10px", fontSize: 12 }}
          >
            Sair
          </button>
        </div>
      </div>
      <ClusterCard cluster={cluster} addons={addons} addonsLoading={addonsLoading} />
    </div>
  );
}
