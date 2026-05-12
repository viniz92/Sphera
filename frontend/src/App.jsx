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
  const { cluster, loading, error } = useCluster(!!token);
  const { addons, loading: addonsLoading } = useAddons(!!cluster);
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

  if (!token) return <LoginPage onLogin={handleLogin} />;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--color-text-secondary)" }}>
        Conectando ao cluster...
      </div>
    );
  }

  return (
    <div style={{ padding: "0 2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem 0 1rem" }}>
        <Logo size={32} showName />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
