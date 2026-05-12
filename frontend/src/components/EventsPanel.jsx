import { useState, useEffect } from "react";
import { fetchEvents } from "../api/client";

const REASON_COLOR = {
  OOMKilling: "var(--color-text-danger)",
  BackOff: "var(--color-text-danger)",
  Failed: "var(--color-text-danger)",
  Evicted: "var(--color-text-danger)",
  NodeNotReady: "var(--color-text-danger)",
};

function reasonColor(reason) {
  for (const [key, color] of Object.entries(REASON_COLOR)) {
    if (reason.includes(key)) return color;
  }
  return "var(--color-text-warning)";
}

function timeAgo(isoStr) {
  if (!isoStr) return "—";
  try {
    const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s atrás`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
  } catch {
    return "—";
  }
}

export function EventsPanel() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .catch(() => setError("Erro ao carregar eventos"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: "1.5rem 0", fontSize: 13, color: "var(--color-text-secondary)" }}>Carregando eventos...</div>;
  }
  if (error) {
    return <div style={{ padding: "1.5rem 0", fontSize: 13, color: "var(--color-text-danger)" }}>{error}</div>;
  }
  if (events.length === 0) {
    return (
      <div style={{ padding: "1.5rem 0", display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-success)", fontSize: 13 }}>
        <span>✓</span><span>Nenhum evento de warning encontrado — cluster saudável.</span>
      </div>
    );
  }

  const thStyle = {
    fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 400,
    textAlign: "left", padding: "4px 8px",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: 110 }}>Reason</th>
            <th style={{ ...thStyle, width: 90 }}>Objeto</th>
            <th style={thStyle}>Mensagem</th>
            <th style={{ ...thStyle, width: 80 }}>Namespace</th>
            <th style={{ ...thStyle, width: 50, textAlign: "center" }}>×</th>
            <th style={{ ...thStyle, width: 80, textAlign: "right" }}>Último</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, i) => (
            <tr key={i} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              <td style={{ padding: "6px 8px", verticalAlign: "top" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: reasonColor(e.reason) }}>{e.reason}</span>
              </td>
              <td style={{ padding: "6px 8px", verticalAlign: "top" }}>
                <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{e.object_kind}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={e.object_name}>{e.object_name}</div>
              </td>
              <td style={{ padding: "6px 8px", verticalAlign: "top", fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                {e.message}
              </td>
              <td style={{ padding: "6px 8px", verticalAlign: "top", fontSize: 11, color: "var(--color-text-tertiary)" }}>{e.namespace}</td>
              <td style={{ padding: "6px 8px", verticalAlign: "top", fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "center" }}>{e.count}</td>
              <td style={{ padding: "6px 8px", verticalAlign: "top", fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "right", whiteSpace: "nowrap" }}>{timeAgo(e.last_seen)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
