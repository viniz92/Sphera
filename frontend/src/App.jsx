import { useCluster } from "./hooks/useCluster";
import { useAddons } from "./hooks/useAddons";
import { UploadKubeconfig } from "./components/UploadKubeconfig";
import { ClusterCard } from "./components/ClusterCard";

export default function App() {
  const { cluster, loading, error, mode, upload } = useCluster();
  const { addons, loading: addonsLoading } = useAddons(!!cluster);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#888" }}>
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
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem 0 1rem" }}>
        <h1 style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Palantir</h1>
        {mode === "local" && (
          <button onClick={() => window.location.reload()} style={{ fontSize: 12, cursor: "pointer", background: "none", border: "1px solid #444", color: "#aaa", padding: "4px 10px", borderRadius: 4 }}>
            Trocar cluster
          </button>
        )}
      </div>
      <ClusterCard
        cluster={cluster}
        addons={addons}
        addonsLoading={addonsLoading}
      />
    </div>
  );
}
