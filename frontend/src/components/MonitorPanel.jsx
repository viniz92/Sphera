import { useState, useEffect } from "react";
import { fetchPodMetrics } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

const SYSTEM_NS = new Set([
  "kube-system", "kube-public", "kube-node-lease",
  "cert-manager", "eks-dashboard",
]);

const STATUS_STYLE = {
  Running:            { bg: "rgba(34,197,94,.12)",  color: "var(--color-text-success)" },
  Succeeded:          { bg: "rgba(34,197,94,.12)",  color: "var(--color-text-success)" },
  Completed:          { bg: "rgba(34,197,94,.12)",  color: "var(--color-text-success)" },
  Pending:            { bg: "rgba(251,191,36,.12)", color: "var(--color-text-warning)" },
  NotReady:           { bg: "rgba(251,191,36,.12)", color: "var(--color-text-warning)" },
  Failed:             { bg: "rgba(248,113,113,.12)", color: "var(--color-text-danger)" },
  CrashLoopBackOff:   { bg: "rgba(248,113,113,.12)", color: "var(--color-text-danger)" },
  OOMKilled:          { bg: "rgba(248,113,113,.12)", color: "var(--color-text-danger)" },
  ImagePullBackOff:   { bg: "rgba(248,113,113,.12)", color: "var(--color-text-danger)" },
  ErrImagePull:       { bg: "rgba(248,113,113,.12)", color: "var(--color-text-danger)" },
};

function statusStyle(s) {
  return STATUS_STYLE[s] ?? { bg: "rgba(255,255,255,.06)", color: "var(--color-text-secondary)" };
}

function fmtAge(seconds) {
  if (seconds < 60)   return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function fmtMem(mib) {
  if (mib == null) return "—";
  return mib >= 1024 ? `${(mib / 1024).toFixed(1)}G` : `${mib}M`;
}

function shortNode(name) {
  if (!name) return "—";
  return name.replace(/\..*$/, "").replace(/^ip-/, "").replace(/-/g, ".");
}

export function MonitorPanel() {
  const { t } = useLanguage();
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hideSystem, setHideSystem] = useState(true);
  const [nsFilter, setNsFilter] = useState("");

  useEffect(() => {
    fetchPodMetrics()
      .then(setPods)
      .catch(() => setError(t("errorPods")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "1.5rem 0", fontSize: 13, color: "var(--color-text-secondary)" }}>{t("loadingPods")}</div>;
  if (error)   return <div style={{ padding: "1.5rem 0", fontSize: 13, color: "var(--color-text-danger)" }}>{error}</div>;

  const namespaces = [...new Set(pods.map(p => p.namespace))].sort();
  let visible = pods;
  if (hideSystem) visible = visible.filter(p => !SYSTEM_NS.has(p.namespace));
  if (nsFilter)   visible = visible.filter(p => p.namespace === nsFilter);

  const thStyle = {
    fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 400,
    textAlign: "left", padding: "5px 8px",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
    whiteSpace: "nowrap",
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <select value={nsFilter} onChange={e => setNsFilter(e.target.value)}
          style={{ fontSize: 11, padding: "3px 8px", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-secondary)", borderRadius: "var(--border-radius-md)", cursor: "pointer" }}>
          <option value="">{t("allNamespaces")}</option>
          {namespaces.map(ns => <option key={ns} value={ns}>{ns}</option>)}
        </select>
        <button onClick={() => setHideSystem(v => !v)}
          style={{ fontSize: 11, padding: "3px 10px", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-secondary)", borderRadius: "var(--border-radius-md)", cursor: "pointer" }}>
          {hideSystem ? t("showSystem") : t("hideSystem")}
        </button>
        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginLeft: "auto" }}>
          {visible.length} pods
        </span>
      </div>

      {visible.length === 0
        ? <div style={{ fontSize: 13, color: "var(--color-text-secondary)", padding: "1rem 0" }}>{t("noPods")}</div>
        : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 140 }}>Namespace</th>
                <th style={thStyle}>{t("podCol")}</th>
                <th style={{ ...thStyle, width: 90 }}>{t("status")}</th>
                <th style={{ ...thStyle, width: 72, textAlign: "center" }}>{t("containersCol")}</th>
                <th style={{ ...thStyle, width: 64, textAlign: "center" }}>{t("restartsCol")}</th>
                <th style={{ ...thStyle, width: 48, textAlign: "right" }}>{t("ageCol")}</th>
                <th style={{ ...thStyle, width: 70, textAlign: "right" }}>{t("cpuCol")}</th>
                <th style={{ ...thStyle, width: 70, textAlign: "right" }}>{t("memoryCol")}</th>
                <th style={{ ...thStyle, width: 110 }}>{t("nodeCol2")}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p, i) => {
                const ss = statusStyle(p.status);
                const isProblematic = !["Running","Succeeded","Completed"].includes(p.status);
                return (
                  <tr key={i} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)", background: isProblematic ? "rgba(248,113,113,0.03)" : "none" }}>
                    <td style={{ padding: "5px 8px", fontSize: 11, color: "var(--color-text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.namespace}</td>
                    <td style={{ padding: "5px 8px", fontSize: 12, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--color-text-primary)" }} title={p.name}>{p.name}</td>
                    <td style={{ padding: "5px 8px" }}>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 600, background: ss.bg, color: ss.color, whiteSpace: "nowrap" }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: "5px 8px", fontSize: 11, color: "var(--color-text-secondary)", textAlign: "center" }}>
                      {p.containers_ready}/{p.containers_total}
                    </td>
                    <td style={{ padding: "5px 8px", fontSize: 11, textAlign: "center", fontWeight: p.restarts > 0 ? 600 : 400, color: p.restarts > 5 ? "var(--color-text-danger)" : p.restarts > 0 ? "var(--color-text-warning)" : "var(--color-text-tertiary)" }}>
                      {p.restarts}
                    </td>
                    <td style={{ padding: "5px 8px", fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "right" }}>{fmtAge(p.age_seconds)}</td>
                    <td style={{ padding: "5px 8px", fontSize: 11, color: "var(--color-text-info)", textAlign: "right" }}>
                      {p.cpu_millicores != null ? `${p.cpu_millicores}m` : "—"}
                    </td>
                    <td style={{ padding: "5px 8px", fontSize: 11, color: "var(--color-text-success)", textAlign: "right" }}>
                      {fmtMem(p.memory_mib)}
                    </td>
                    <td style={{ padding: "5px 8px", fontSize: 11, color: "var(--color-text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.node_name ?? ""}>
                      {shortNode(p.node_name)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
