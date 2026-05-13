import { useState, useEffect } from "react";
import { fetchPodDetail } from "../api/client";

const STATUS_COLOR = {
  Running: "var(--color-text-success)", Succeeded: "var(--color-text-success)",
  Pending: "var(--color-text-warning)", Failed: "var(--color-text-danger)",
  CrashLoopBackOff: "var(--color-text-danger)", OOMKilled: "var(--color-text-danger)",
};

function fmtAge(iso) {
  if (!iso) return "—";
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 3600)  return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  return `${Math.floor(secs / 86400)}d`;
}
function fmtMem(mib) {
  if (mib == null) return "—";
  return mib >= 1024 ? `${(mib / 1024).toFixed(1)} GiB` : `${mib} MiB`;
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function KV({ label, value, mono, color }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "flex-start" }}>
      <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", minWidth: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: color ?? "var(--color-text-secondary)", fontFamily: mono ? "monospace" : "inherit", wordBreak: "break-all" }}>{value ?? "—"}</span>
    </div>
  );
}

export function PodDrawer({ pod: podRef, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!podRef) return;
    setLoading(true);
    setDetail(null);
    fetchPodDetail(podRef.namespace, podRef.name)
      .then(setDetail)
      .catch(() => setError("Erro ao carregar detalhes do pod"))
      .finally(() => setLoading(false));
  }, [podRef?.namespace, podRef?.name]);

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!podRef) return null;

  const statusColor = STATUS_COLOR[detail?.status] ?? "var(--color-text-secondary)";
  const labelEntries = Object.entries(detail?.labels ?? {}).filter(([k]) => !k.startsWith("pod-template-hash"));

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200 }}/>

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 520,
        background: "var(--color-background-primary)",
        borderLeft: "0.5px solid var(--color-border-secondary)",
        zIndex: 201, overflowY: "auto", padding: "1.5rem",
        boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "monospace", color: "var(--color-text-primary)", wordBreak: "break-all" }}>
              {podRef.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 3 }}>{podRef.namespace}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 20, lineHeight: 1, padding: "2px 6px" }}>✕</button>
        </div>

        {loading && <div style={{ fontSize: 13, color: "var(--color-text-secondary)", padding: "2rem 0", textAlign: "center" }}>Carregando...</div>}
        {error   && <div style={{ fontSize: 13, color: "var(--color-text-danger)" }}>{error}</div>}

        {detail && (
          <>
            {/* Overview */}
            <Section title="Visão geral">
              <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 14px" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 600, background: statusColor + "22", color: statusColor }}>{detail.status}</span>
                  {detail.cpu_millicores != null && <span style={{ fontSize: 11, color: "var(--color-text-info)" }}>CPU {detail.cpu_millicores}m</span>}
                  {detail.memory_mib    != null && <span style={{ fontSize: 11, color: "var(--color-text-success)" }}>Mem {fmtMem(detail.memory_mib)}</span>}
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginLeft: "auto" }}>Idade: {fmtAge(detail.created_at)}</span>
                </div>
                {detail.owner_name && (
                  <KV label={detail.owner_kind ?? "Owner"} value={detail.owner_name} mono/>
                )}
                <KV label="Node" value={detail.node_name} mono/>
                <KV label="Pod IP" value={detail.pod_ip} mono/>
                <KV label="Host IP" value={detail.host_ip} mono/>
                <KV label="Criado em" value={detail.created_at ? new Date(detail.created_at).toLocaleString("pt-BR") : "—"}/>
              </div>
            </Section>

            {/* Containers */}
            <Section title={`Containers (${detail.containers.length})`}>
              {detail.containers.map(c => (
                <div key={c.name} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "10px 14px", marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>{c.name}</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {c.restarts > 0 && <span style={{ fontSize: 10, color: c.restarts > 5 ? "var(--color-text-danger)" : "var(--color-text-warning)", fontWeight: 600 }}>{c.restarts} restarts</span>}
                      <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, fontWeight: 600, background: c.ready ? "rgba(74,222,128,.12)" : "rgba(248,113,113,.12)", color: c.ready ? "var(--color-text-success)" : "var(--color-text-danger)" }}>
                        {c.ready ? "Ready" : c.state}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontFamily: "monospace", wordBreak: "break-all", marginBottom: c.ports.length > 0 ? 4 : 0 }}>{c.image}</div>
                  {c.ports.length > 0 && <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Portas: {c.ports.join(", ")}</div>}
                  {(c.cpu_millicores != null || c.memory_mib != null) && (
                    <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                      {c.cpu_millicores != null && <span style={{ fontSize: 11, color: "var(--color-text-info)" }}>CPU {c.cpu_millicores}m</span>}
                      {c.memory_mib    != null && <span style={{ fontSize: 11, color: "var(--color-text-success)" }}>Mem {fmtMem(c.memory_mib)}</span>}
                    </div>
                  )}
                </div>
              ))}
            </Section>

            {/* Conditions */}
            {detail.conditions.length > 0 && (
              <Section title="Condições">
                <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "10px 14px" }}>
                  {detail.conditions.map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < detail.conditions.length - 1 ? 6 : 0 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: c.status === "True" ? "var(--color-text-success)" : "var(--color-text-warning)" }}/>
                      <span style={{ fontSize: 12, color: "var(--color-text-secondary)", minWidth: 140 }}>{c.type}</span>
                      <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{c.reason || c.status}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Labels */}
            {labelEntries.length > 0 && (
              <Section title="Labels">
                <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "10px 14px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {labelEntries.map(([k, v]) => (
                    <span key={k} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(96,165,250,.1)", color: "var(--color-text-info)", fontFamily: "monospace" }}>
                      {k}={v}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Events */}
            {detail.events.length > 0 && (
              <Section title="Eventos recentes">
                {detail.events.map((e, i) => (
                  <div key={i} style={{ padding: "8px 12px", marginBottom: 4, background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", borderLeft: `2px solid ${e.type === "Warning" ? "var(--color-text-warning)" : "var(--color-border-secondary)"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: e.type === "Warning" ? "var(--color-text-warning)" : "var(--color-text-secondary)" }}>{e.reason}</span>
                      <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>×{e.count}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)", lineHeight: 1.4 }}>{e.message}</div>
                  </div>
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </>
  );
}
