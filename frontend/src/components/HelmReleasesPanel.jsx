import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

export function HelmReleasesPanel() {
  const { t } = useLanguage();
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("sphera_token") || "";
    fetch("/api/helm/releases", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setReleases(Array.isArray(data) ? data : []); })
      .catch(() => setReleases([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = releases.filter(r =>
    !search || r.name.includes(search) || r.namespace.includes(search) || r.chart.includes(search)
  );

  return (
    <div style={{ paddingTop: 4 }}>
      <div style={{ marginBottom: 12 }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Filtrar por nome, namespace ou chart..."
          style={{
            padding: "6px 12px", fontSize: 12, borderRadius: "var(--border-radius-md)",
            border: "0.5px solid var(--color-border-secondary)",
            background: "var(--color-background-secondary)", color: "var(--color-text-primary)",
            outline: "none", width: 260,
          }}
        />
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0" }}>
              <div className="skeleton-box" style={{ width: 160, height: 12 }} />
              <div className="skeleton-box" style={{ width: 100, height: 12 }} />
              <div className="skeleton-box" style={{ width: 80, height: 12 }} />
            </div>
          ))}
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {["Release", "Namespace", "Chart", "Revisão", "Status"].map(col => (
                <th key={col} style={{
                  textAlign: "left", padding: "6px 10px", fontSize: 11,
                  color: "var(--color-text-tertiary)", fontWeight: 400,
                  borderBottom: "0.5px solid var(--color-border-tertiary)",
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-tertiary)" }}>Nenhum release encontrado.</td></tr>
            ) : filtered.map(r => (
              <tr key={`${r.namespace}/${r.name}`} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                <td style={{ padding: "8px 10px", fontWeight: 500, color: "var(--color-text-primary)" }}>{r.name}</td>
                <td style={{ padding: "8px 10px", color: "var(--color-text-secondary)", fontFamily: "monospace" }}>{r.namespace}</td>
                <td style={{ padding: "8px 10px", color: "var(--color-text-secondary)" }}>{r.chart}</td>
                <td style={{ padding: "8px 10px", color: "var(--color-text-tertiary)", textAlign: "center" }}>v{r.revision}</td>
                <td style={{ padding: "8px 10px" }}>
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 8, fontWeight: 600,
                    background: r.status === "deployed" ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
                    color: r.status === "deployed" ? "var(--color-text-success)" : "var(--color-text-danger)",
                  }}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
