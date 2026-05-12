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

// Extrai nome curto do node group removendo sufixo de timestamp
function shortNgName(name) {
  return name.replace(/[-_]?\d{14,}[a-z0-9]*$/i, "").replace(/[-_]+$/, "") || name;
}

const NG_COLORS = [
  "var(--color-text-info)",
  "var(--color-text-success)",
  "var(--color-text-warning)",
  "#a78bfa",
  "#f472b6",
  "#34d399",
];

function DonutChart({ nodeGroups }) {
  const total = nodeGroups.reduce((s, ng) => s + ng.desired, 0);
  const size = 140;
  const cx = size / 2, cy = size / 2;
  const r = 46;
  const strokeW = 18;

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border-secondary)" strokeWidth={strokeW} />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fill="var(--color-text-tertiary)">0</text>
      </svg>
    );
  }

  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const slices = nodeGroups.filter(ng => ng.desired > 0).map((ng, i) => {
    const dash = (ng.desired / total) * circumference;
    const gap = circumference - dash;
    const slice = { color: NG_COLORS[i % NG_COLORS.length], dash, gap, offset };
    offset += dash;
    return slice;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border-tertiary)" strokeWidth={strokeW} />
      {slices.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
          strokeWidth={strokeW} strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset} strokeLinecap="butt" />
      ))}
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="18" fontWeight="700"
        fill="var(--color-text-primary)" style={{ transform: `rotate(90deg)`, transformOrigin: `${cx}px ${cy}px` }}>
        {total}
      </text>
    </svg>
  );
}

function NodeGroupsSection({ nodeGroups }) {
  if (!nodeGroups || nodeGroups.length === 0) return null;

  const withNodes = nodeGroups.filter(ng => ng.desired > 0);
  const thStyle = {
    fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 400,
    textAlign: "left", padding: "4px 6px",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
  };

  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 10 }}>
        Node Groups
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* Donut + legenda */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <DonutChart nodeGroups={nodeGroups} />
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {nodeGroups.map((ng, i) => (
              <div key={ng.name} style={{ display: "flex", alignItems: "center", gap: 5, opacity: ng.desired === 0 ? 0.35 : 1 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: NG_COLORS[i % NG_COLORS.length], flexShrink: 0, display: "inline-block" }} />
                <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{shortNgName(ng.name)}</span>
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>({ng.desired})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabela */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={thStyle}>Node group</th>
                <th style={{ ...thStyle, width: 110 }}>Instância</th>
                <th style={{ ...thStyle, width: 80, textAlign: "center" }}>Min/Des/Max</th>
                <th style={{ ...thStyle, width: 68 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {nodeGroups.map((ng, i) => {
                const dimmed = ng.desired === 0;
                return (
                  <>
                    <tr key={ng.name} style={{ borderBottom: ng.instances?.length ? "none" : "0.5px solid var(--color-border-tertiary)", opacity: dimmed ? 0.35 : 1 }}>
                      <td style={{ padding: "6px 6px 2px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: NG_COLORS[i % NG_COLORS.length], flexShrink: 0, display: "inline-block" }} />
                          <span style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={ng.name}>
                            {shortNgName(ng.name)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "6px 6px 2px", fontSize: 12, color: "var(--color-text-secondary)", verticalAlign: "top" }}>
                        {ng.instance_type ?? "—"}
                      </td>
                      <td style={{ padding: "6px 6px 2px", fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center", verticalAlign: "top" }}>
                        {ng.min_size} / <span style={{ fontWeight: 600, color: ng.desired > 0 ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>{ng.desired}</span> / {ng.max_size}
                      </td>
                      <td style={{ padding: "6px 6px 2px", fontSize: 11, verticalAlign: "top", color: ng.status === "ACTIVE" ? "var(--color-text-success)" : "var(--color-text-warning)" }}>
                        {ng.status ?? "—"}
                      </td>
                    </tr>
                    {(ng.instances || []).map((inst) => (
                      <tr key={inst.instance_id} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)", opacity: dimmed ? 0.35 : 1 }}>
                        <td colSpan={4} style={{ padding: "2px 6px 5px 20px" }}>
                          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontFamily: "monospace" }}>
                            {inst.instance_id}
                            {inst.private_ip && (
                              <span style={{ color: "var(--color-text-secondary)", marginLeft: 8 }}>{inst.private_ip}</span>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
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

      <NodeGroupsSection nodeGroups={cluster.node_groups} />

      {showUpgradePath && <UpgradePath cluster={cluster} />}

      {addonsLoading ? (
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", padding: "1rem 0" }}>Carregando addons...</div>
      ) : (
        <AddonTable addons={addons} cluster={cluster} />
      )}
    </div>
  );
}
