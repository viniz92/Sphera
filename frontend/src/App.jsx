import { useState } from "react";
import { useCluster } from "./hooks/useCluster";
import { useAddons } from "./hooks/useAddons";
import { UploadKubeconfig } from "./components/UploadKubeconfig";
import { ClusterCard } from "./components/ClusterCard";
import { Logo } from "./components/Logo";

export default function App() {
  const { cluster, loading, error, upload } = useCluster();
  const { addons, loading: addonsLoading } = useAddons(!!cluster);
  const [reset, setReset] = useState(false);

  function handleReset() {
    window.location.reload();
  }

  if (!cluster || reset) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 1rem" }}>
        <UploadKubeconfig onUpload={upload} loading={loading} error={error} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem 0 1rem" }}>
        <Logo size={36} showName />
        <button
          onClick={handleReset}
          style={{ fontSize: 12, padding: "4px 12px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "none", cursor: "pointer", color: "var(--color-text-secondary)" }}
        >
          Trocar cluster
        </button>
      </div>
      <ClusterCard
        cluster={cluster}
        addons={addons}
        addonsLoading={addonsLoading}
        onReset={handleReset}
      />
    </div>
  );
}
