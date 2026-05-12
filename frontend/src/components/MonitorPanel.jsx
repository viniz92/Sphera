import { useState, useEffect } from "react";
import { fetchNodeMetrics } from "../api/client";

function UsageBar({ percent, color }) {
  const pct = Math.min(100, percent ?? 0);
  const barColor = pct > 85 ? "var(--color-text-danger)" : pct > 65 ? "var(--color-text-warning)" : color;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, background: "var(--color-background-secondary)", borderRadius: 4, height: 8, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 4, background: barColor, width: `${pct}%`, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 11, color: barColor, fontWeight: 600, minWidth: 36, textAlign: "right" }}>
        {percent != null ? `${percent}%` : "—"}
      </span>
    </div>
  );
}

function shortNodeName(name) {
  return name.replace(/\..*$/, "");
}

export function MonitorPanel() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    fetchNodeMetrics()
      .then(data => {
        if (data.length === 0) setUnavailable(true);
        setMetrics(data);
      })
      .catch(() => setError("Erro ao buscar métricas"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: "1.5rem 0", fontSize: 13, color: "var(--color-text-secondary)" }}>Carregando métricas...</div>;
  }
  if (error) {
    return <div style={{ padding: "1.5rem 0", fontSize: 13, color: "var(--color-text-danger)" }}>{error}</div>;
  }
  if (unavailable || metrics.length === 0) {
    return (
      <div style={{ padding: "1.5rem 0", fontSize: 13, color: "var(--color-text-secondary)" }}>
        Metrics Server não disponível neste cluster. Instale o <code style={{ fontSize: 12 }}>metrics-server</code> para habilitar o monitoramento.
      </div>
    );
  }

  const thStyle = {
    fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 400,
    textAlign: "left", padding: "4px 8px",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
  };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
      <thead>
        <tr>
          <th style={thStyle}>Nó</th>
          <th style={{ ...thStyle, width: "32%" }}>CPU</th>
          <th style={{ ...thStyle, width: "32%" }}>Memória</th>
        </tr>
      </thead>
      <tbody>
        {metrics.map(m => (
          <tr key={m.name} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            <td style={{ padding: "8px 8px", verticalAlign: "middle" }}>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{shortNodeName(m.name)}</span>
            </td>
            <td style={{ padding: "8px 8px", verticalAlign: "middle" }}>
              <UsageBar percent={m.cpu_percent} color="var(--color-text-info)" />
              <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 2 }}>
                {m.cpu_millicores}m / {m.cpu_capacity_millicores}m
              </div>
            </td>
            <td style={{ padding: "8px 8px", verticalAlign: "middle" }}>
              <UsageBar percent={m.memory_percent} color="var(--color-text-success)" />
              <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 2 }}>
                {m.memory_mib > 1024 ? `${(m.memory_mib / 1024).toFixed(1)} GiB` : `${m.memory_mib} MiB`}
                {" / "}
                {m.memory_capacity_mib > 1024 ? `${(m.memory_capacity_mib / 1024).toFixed(1)} GiB` : `${m.memory_capacity_mib} MiB`}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
