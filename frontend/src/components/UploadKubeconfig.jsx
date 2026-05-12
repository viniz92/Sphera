import { useRef, useState } from "react";
import { Logo } from "./Logo";

export function UploadKubeconfig({ onUpload, loading, error }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  function handleFile(file) {
    if (file) onUpload(file);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 24 }}>

      <Logo size={80} showName />

      <p style={{ fontSize: 14, color: "var(--color-text-secondary)", textAlign: "center", maxWidth: 360 }}>
        Faça upload do seu kubeconfig para visualizar o cluster, addons e compatibilidade com a próxima versão do EKS.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
        style={{
          width: 360,
          border: `1.5px dashed ${dragging ? "var(--color-border-info)" : "var(--color-border-secondary)"}`,
          borderRadius: "var(--border-radius-lg)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          cursor: "pointer",
          background: dragging ? "var(--color-background-info)" : "var(--color-background-secondary)",
          transition: "all 0.15s",
        }}
      >
        <span style={{ fontSize: 28, color: "var(--color-text-secondary)" }}>⬆</span>
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
          {loading ? "Carregando cluster..." : "Arraste o kubeconfig ou clique para selecionar"}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept=".yaml,.yml,.conf"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {error && (
        <div style={{ fontSize: 13, color: "var(--color-text-danger)", background: "var(--color-background-danger)", padding: "8px 16px", borderRadius: "var(--border-radius-md)" }}>
          {error}
        </div>
      )}

      <p style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
        O arquivo nunca é salvo — processado apenas em memória.
      </p>

      <p style={{ fontSize: 10, color: "var(--color-text-tertiary)", opacity: 0.5, letterSpacing: "0.1em" }}>
        ONE DASHBOARD TO RULE THEM ALL
      </p>
    </div>
  );
}
