import { useState } from "react";

export function AccessBox({ access }) {
  const [copied, setCopied] = useState(false);

  if (!access || access.type === "none") return null;

  function copy(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const borderColor = {
    ingress: "var(--color-border-success)",
    loadbalancer: "var(--color-border-warning)",
    portforward: "var(--color-border-secondary)",
  }[access.type];

  const icon = { ingress: "✓", loadbalancer: "⚠", portforward: "⌨" }[access.type];
  const iconColor = { ingress: "var(--color-text-success)", loadbalancer: "var(--color-text-warning)", portforward: "var(--color-text-secondary)" }[access.type];

  const label = {
    ingress: "Ingress detectado",
    loadbalancer: "LoadBalancer — sem TLS",
    portforward: "Sem Ingress ou LoadBalancer — use port-forward",
  }[access.type];

  return (
    <div style={{
      gridColumn: "1/-1",
      border: `0.5px solid ${borderColor}`,
      borderRadius: "var(--border-radius-md)",
      background: "var(--color-background-primary)",
      padding: "10px 12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{ color: iconColor, fontSize: 15, flexShrink: 0 }}>{icon}</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
          <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{label}</span>
          {access.url && (
            <a href={access.url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: access.type === "loadbalancer" ? "var(--color-text-warning)" : "var(--color-text-info)", fontFamily: "monospace", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {access.url}
            </a>
          )}
          {access.pf_cmd && (
            <span style={{ fontSize: 11, color: "var(--color-text-secondary)", fontFamily: "monospace" }}>{access.pf_cmd}</span>
          )}
        </div>
      </div>

      {access.url && (
        <a href={access.url} target="_blank" rel="noopener noreferrer"
          style={{ flexShrink: 0, fontSize: 11, padding: "4px 10px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", textDecoration: "none" }}>
          ↗ Abrir
        </a>
      )}
      {access.pf_cmd && (
        <button onClick={() => copy(access.pf_cmd)}
          style={{ flexShrink: 0, fontSize: 11, padding: "4px 10px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-secondary)", cursor: "pointer" }}>
          {copied ? "✓ Copiado" : "⎘ Copiar"}
        </button>
      )}
    </div>
  );
}
