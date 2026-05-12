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

export default function App() {
  const { cluster, loading, error, mode, upload } = useCluster();
  const { addons, loading: addonsLoading } = useAddons(!!cluster);
  const [theme, toggleTheme] = useTheme();

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
      <ClusterCard
        cluster={cluster}
        addons={addons}
        addonsLoading={addonsLoading}
      />
    </div>
  );
}
