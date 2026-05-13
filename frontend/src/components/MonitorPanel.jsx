import { useState, useEffect } from "react";
import { fetchPodMetrics } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import { PodDrawer } from "./PodDrawer";

const SYSTEM_NS = new Set([
  "kube-system", "kube-public", "kube-node-lease",
  "cert-manager", "eks-dashboard",
]);

const STATUS_STYLE = {
  Running:            { bg: "rgba(34,197,94,.12)",   color: "var(--color-text-success)" },
  Succeeded:          { bg: "rgba(34,197,94,.12)",   color: "var(--color-text-success)" },
  Completed:          { bg: "rgba(34,197,94,.12)",   color: "var(--color-text-success)" },
  Pending:            { bg: "rgba(251,191,36,.12)",  color: "var(--color-text-warning)" },
  NotReady:           { bg: "rgba(251,191,36,.12)",  color: "var(--color-text-warning)" },
  Failed:             { bg: "rgba(248,113,113,.12)", color: "var(--color-text-danger)" },
  CrashLoopBackOff:   { bg: "rgba(248,113,113,.12)", color: "var(--color-text-danger)" },
  OOMKilled:          { bg: "rgba(248,113,113,.12)", color: "var(--color-text-danger)" },
  ImagePullBackOff:   { bg: "rgba(248,113,113,.12)", color: "var(--color-text-danger)" },
  ErrImagePull:       { bg: "rgba(248,113,113,.12)", color: "var(--color-text-danger)" },
};

const OK_STATUSES = new Set(["Running", "Succeeded", "Completed"]);

function statusStyle(s) {
  return STATUS_STYLE[s] ?? { bg: "rgba(255,255,255,.06)", color: "var(--color-text-secondary)" };
}

function fmtAge(seconds) {
  if (seconds < 60)    return `${seconds}s`;
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m`;
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

function SortArrow({ col, sortKey, sortDir }) {
  const active = sortKey === col;
  return (
    <svg width="10" height="12" viewBox="0 0 10 12" style={{ marginLeft: 3, verticalAlign: "middle", opacity: active ? 1 : 0.3, flexShrink: 0 }}>
      <polyline points="2,4.5 5,1.5 8,4.5" fill="none"
        stroke={active && sortDir === "asc" ? "var(--color-text-info)" : "currentColor"}
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="2,7.5 5,10.5 8,7.5" fill="none"
        stroke={active && sortDir === "desc" ? "var(--color-text-info)" : "currentColor"}
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function sortPods(pods, key, dir) {
  if (!key) return pods;
  const mul = dir === "asc" ? 1 : -1;
  return [...pods].sort((a, b) => {
    let va, vb;
    switch (key) {
      case "namespace": va = a.namespace; vb = b.namespace; break;
      case "name":      va = a.name;      vb = b.name;      break;
      case "status":    va = a.status;    vb = b.status;    break;
      case "restarts":  va = a.restarts ?? 0;  vb = b.restarts ?? 0;  break;
      case "age":       va = a.age_seconds ?? 0; vb = b.age_seconds ?? 0; break;
      case "cpu":       va = a.cpu_millicores ?? -1; vb = b.cpu_millicores ?? -1; break;
      case "memory":    va = a.memory_mib ?? -1;     vb = b.memory_mib ?? -1;     break;
      case "node":      va = a.node_name ?? ""; vb = b.node_name ?? ""; break;
      case "containers": va = a.containers_ready; vb = b.containers_ready; break;
      default: return 0;
    }
    if (typeof va === "string") return mul * va.localeCompare(vb);
    return mul * (va - vb);
  });
}

export function MonitorPanel() {
  const { t } = useLanguage();
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hideSystem, setHideSystem] = useState(true);
  const [nsFilter, setNsFilter] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("desc");
  const [search, setSearch] = useState("");
  const [selectedPod, setSelectedPod] = useState(null);

  useEffect(() => {
    fetchPodMetrics()
      .then(setPods)
      .catch(() => setError(t("errorPods")))
      .finally(() => setLoading(false));
  }, []);

  function handleSort(col) {
    if (sortKey === col) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortKey(col);
      setSortDir("desc");
    }
  }

  if (loading) return <div style={{ padding: "1.5rem 0", fontSize: 13, color: "var(--color-text-secondary)" }}>{t("loadingPods")}</div>;
  if (error)   return <div style={{ padding: "1.5rem 0", fontSize: 13, color: "var(--color-text-danger)" }}>{error}</div>;

  const namespaces = [...new Set(pods.map(p => p.namespace))].sort();
  let visible = pods;
  if (hideSystem) visible = visible.filter(p => !SYSTEM_NS.has(p.namespace));
  if (nsFilter)   visible = visible.filter(p => p.namespace === nsFilter);
  if (search)     visible = visible.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.namespace.toLowerCase().includes(search.toLowerCase()) ||
    (p.node_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Default sort: problematic first. User sort overrides.
  if (sortKey) {
    visible = sortPods(visible, sortKey, sortDir);
  } else {
    visible = [...visible].sort((a, b) =>
      (OK_STATUSES.has(a.status) ? 1 : 0) - (OK_STATUSES.has(b.status) ? 1 : 0) ||
      a.namespace.localeCompare(b.namespace) || a.name.localeCompare(b.name)
    );
  }

  const thBtn = (col, label, align = "left", width) => (
    <th style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 400, textAlign: align, padding: "5px 8px", borderBottom: "0.5px solid var(--color-border-tertiary)", whiteSpace: "nowrap", width, userSelect: "none" }}>
      <button onClick={() => handleSort(col)} style={{ background: "none", border: "none", cursor: "pointer", color: sortKey === col ? "var(--color-text-info)" : "var(--color-text-tertiary)", fontSize: 11, fontWeight: sortKey === col ? 600 : 400, padding: 0, display: "inline-flex", alignItems: "center" }}>
        {label}<SortArrow col={col} sortKey={sortKey} sortDir={sortDir} />
      </button>
    </th>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar pod, namespace ou nó..."
          style={{ fontSize: 11, padding: "4px 10px", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-primary)", borderRadius: "var(--border-radius-md)", outline: "none", minWidth: 220 }}
        />
        <select value={nsFilter} onChange={e => setNsFilter(e.target.value)}
          style={{ fontSize: 11, padding: "3px 8px", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-secondary)", borderRadius: "var(--border-radius-md)", cursor: "pointer" }}>
          <option value="">{t("allNamespaces")}</option>
          {namespaces.map(ns => <option key={ns} value={ns}>{ns}</option>)}
        </select>
        <button onClick={() => setHideSystem(v => !v)}
          style={{ fontSize: 11, padding: "3px 10px", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-secondary)", borderRadius: "var(--border-radius-md)", cursor: "pointer" }}>
          {hideSystem ? t("showSystem") : t("hideSystem")}
        </button>
        {sortKey && (
          <button onClick={() => { setSortKey(null); setSortDir("desc"); }}
            style={{ fontSize: 11, padding: "3px 8px", background: "none", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-tertiary)", borderRadius: "var(--border-radius-md)", cursor: "pointer" }}>
            ✕ limpar ordem
          </button>
        )}
        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginLeft: "auto" }}>{visible.length} pods</span>
      </div>

      <PodDrawer pod={selectedPod} onClose={() => setSelectedPod(null)} />

      {visible.length === 0
        ? <div style={{ fontSize: 13, color: "var(--color-text-secondary)", padding: "1rem 0" }}>{t("noPods")}</div>
        : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr>
                {thBtn("namespace", "Namespace", "left", 140)}
                {thBtn("name",      t("podCol"),          "left")}
                {thBtn("status",    t("status"),          "left",  90)}
                {thBtn("containers",t("containersCol"),   "center",72)}
                {thBtn("restarts",  t("restartsCol"),     "center",64)}
                {thBtn("age",       t("ageCol"),          "right", 52)}
                {thBtn("cpu",       t("cpuCol"),          "right", 70)}
                {thBtn("memory",    t("memoryCol"),       "right", 70)}
                {thBtn("node",      t("nodeCol2"),        "left",  110)}
              </tr>
            </thead>
            <tbody>
              {visible.map((p, i) => {
                const ss = statusStyle(p.status);
                const isProblematic = !OK_STATUSES.has(p.status);
                return (
                  <tr key={i} onClick={() => setSelectedPod(p)}
                    style={{ borderBottom: "0.5px solid var(--color-border-tertiary)", background: isProblematic ? "rgba(248,113,113,0.03)" : "none", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = isProblematic ? "rgba(248,113,113,0.03)" : "none"}
                  >
                    <td style={{ padding: "5px 6px", fontSize: 11, color: "var(--color-text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.namespace}</td>
                    <td style={{ padding: "5px 6px", fontSize: 12, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--color-text-primary)" }} title={p.name}>{p.name}</td>
                    <td style={{ padding: "5px 8px" }}>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 600, background: ss.bg, color: ss.color, whiteSpace: "nowrap" }}>{p.status}</span>
                    </td>
                    <td style={{ padding: "5px 8px", fontSize: 11, color: "var(--color-text-secondary)", textAlign: "center" }}>{p.containers_ready}/{p.containers_total}</td>
                    <td style={{ padding: "5px 8px", fontSize: 11, textAlign: "center", fontWeight: p.restarts > 0 ? 600 : 400, color: p.restarts > 5 ? "var(--color-text-danger)" : p.restarts > 0 ? "var(--color-text-warning)" : "var(--color-text-tertiary)" }}>{p.restarts}</td>
                    <td style={{ padding: "5px 8px", fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "right" }}>{fmtAge(p.age_seconds)}</td>
                    <td style={{ padding: "5px 8px", fontSize: 11, color: "var(--color-text-info)", textAlign: "right" }}>{p.cpu_millicores != null ? `${p.cpu_millicores}m` : "—"}</td>
                    <td style={{ padding: "5px 8px", fontSize: 11, color: "var(--color-text-success)", textAlign: "right" }}>{fmtMem(p.memory_mib)}</td>
                    <td style={{ padding: "5px 8px", fontSize: 11, color: "var(--color-text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.node_name ?? ""}>{shortNode(p.node_name)}</td>
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
