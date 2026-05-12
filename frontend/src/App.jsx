import { useState, useEffect } from "react";
import { useCluster } from "./hooks/useCluster";
import { useAddons } from "./hooks/useAddons";
import { UploadKubeconfig } from "./components/UploadKubeconfig";
import { ClusterCard } from "./components/ClusterCard";

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return [theme, () => setTheme((t) => (t === "dark" ? "light" : "dark"))];
}

function formatLastUpdated(date) {
  if (!date) return null;
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function App() {
  const { cluster, loading, refreshing, error, mode, upload, refresh, lastUpdated } = useCluster();
  const { addons, loading: addonsLoading, reload: reloadAddons } = useAddons(!!cluster);
  const [theme, toggleTheme] = useTheme();

  function handleRefresh() {
    refresh();
    reloadAddons();
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--color-text-secondary)" }}>
        Conectando ao cluster...
      </div>
    );
  }

  if (!cluster) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 1rem" }}>
        <UploadKubeconfig onUpload={upload} loading={loading} error={error} />
      </div>
    );
  }

  return (
    <div style={{ padding: "0 2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem 0 1rem" }}>
        <h1 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Palantir</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {lastUpdated && (
            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
              atualizado às {formatLastUpdated(lastUpdated)}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Atualizar dados"
            style={{
              background: "none", border: "0.5px solid var(--color-border-secondary)",
              color: refreshing ? "var(--color-text-tertiary)" : "var(--color-text-secondary)",
              borderRadius: "var(--border-radius-md)", padding: "4px 8px",
              fontSize: 13, lineHeight: 1, cursor: refreshing ? "default" : "pointer",
              transition: "opacity 0.2s",
            }}
          >
            {refreshing ? "↻" : "↺"}
          </button>
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
            style={{
              background: "none", border: "0.5px solid var(--color-border-secondary)",
              color: "var(--color-text-secondary)", borderRadius: "var(--border-radius-md)",
              padding: "4px 8px", fontSize: 14, lineHeight: 1, cursor: "pointer",
            }}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          {mode === "local" && (
            <button onClick={() => window.location.reload()} style={{ fontSize: 12, cursor: "pointer", background: "none", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-secondary)", padding: "4px 10px", borderRadius: "var(--border-radius-md)" }}>
              Trocar cluster
            </button>
          )}
        </div>
      </div>
      <ClusterCard cluster={cluster} addons={addons} addonsLoading={addonsLoading} />
    </div>
  );
}
