import { useState } from "react";
import { EolBar } from "./EolBar";
import { AddonTable } from "./AddonTable";
import { UpgradePath } from "./UpgradePath";

function MetaCard({ label, value, sub, valueColor }) {
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "0.75rem 1rem" }}>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: valueColor ?? "var(--color-text-primary)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function NodeGroupStatus({ status }) {
  const color = status === "ACTIVE" ? "var(--color-text-success)"
    : status === "DEGRADED" ? "var(--color-text-danger)"
    : "var(--color-text-warning)";
  return <span style={{ fontSize: 11, color }}>{status ?? "—"}</span>;
}

function NodeGroupsTable({ nodeGroups }) {
  if (!nodeGroups || nodeGroups.length === 0) return null;

  const thStyle = {
    fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 400,
    textAlign: "left", padding: "5px 8px",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
  };

  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 8 }}>
        Node Groups
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th style={thStyle}>Nome</th>
            <th style={{ ...thStyle, width: 130 }}>Instância</th>
            <th style={{ ...thStyle, width: 90, textAlign: "center" }}>Min / Des / Max</th>
            <th style={{ ...thStyle, width: 90 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {nodeGroups.map((ng) => (
            <tr key={ng.name} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              <td style={{ padding: "8px 8px", fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={ng.name}>
                {ng.name}
              </td>
              <td style={{ padding: "8px 8px", fontSize: 12, color: "var(--color-text-secondary)" }}>
                {ng.instance_type ?? "—"}
              </td>
              <td style={{ padding: "8px 8px", fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center" }}>
                {ng.min_size} / <span style={{ fontWeight: 500, color: ng.desired > 0 ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>{ng.desired}</span> / {ng.max_size}
              </td>
              <td style={{ padding: "8px 8px" }}>
                <NodeGroupStatus status={ng.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ClusterCard({ cluster, addons, addonsLoading }) {
  const [showUpgradePath, setShowUpgradePath] = useState(false);
  const days = cluster.eol_days_remaining;
  const eolBadgeColor = days < 60 ? "var(--color-text-danger)" : days < 180 ? "var(--color-text-warning)" : "var(--color-text-success)";
  const eolBadgeBg = days < 60 ? "var(--color-background-danger)" : days < 180 ? "var(--color-background-warning)" : "var(--color-background-success)";
  const eolLabel = days < 60 ? `EOL em ${days} dias` : `EOL em ${Math.round(days / 30)} meses`;
  const hasUpgradePath = cluster.upgrade_path && cluster.upgrade_path.length > 0;

  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem", marginBottom: "1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18, color: "var(--color-text-info)" }}>☁</span>
          <span style={{ fontSize: 15, fontWeight: 500 }}>{cluster.name}</span>
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{cluster.status}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 500, background: eolBadgeBg, color: eolBadgeColor }}>
            {eolLabel}
          </span>
          {hasUpgradePath && (
            <button
              onClick={() => setShowUpgradePath((v) => !v)}
              style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 500, background: "var(--color-background-info)", color: "var(--color-text-info)", border: "none", cursor: "pointer" }}
            >
              {showUpgradePath ? "Ocultar upgrade" : "Simular upgrade →"}
            </button>
          )}
        </div>
      </div>

      {/* Meta cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: "1.25rem" }}>
        <MetaCard label="Versão atual" value={cluster.version} sub="Kubernetes" />
        <MetaCard label="Próxima versão" value={cluster.next_version} sub="Disponível" />
        <MetaCard label="Fim do suporte" value={cluster.eol_date ?? "—"} sub={`Suporte padrão (free) · ${days < 60 ? `${days} dias` : `${days} dias · ~${Math.round(days / 30)} meses`}`} valueColor={eolBadgeColor} />
        <MetaCard label="Região" value={cluster.region} sub="AWS" />
        <MetaCard label="Nós" value={cluster.node_count} sub={`${cluster.node_groups?.length ?? 0} node groups`} />
      </div>

      <EolBar cluster={cluster} />

      <NodeGroupsTable nodeGroups={cluster.node_groups} />

      {showUpgradePath && <UpgradePath cluster={cluster} />}

      {addonsLoading ? (
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", padding: "1rem 0" }}>Carregando addons...</div>
      ) : (
        <AddonTable addons={addons} cluster={cluster} />
      )}
    </div>
  );
}
