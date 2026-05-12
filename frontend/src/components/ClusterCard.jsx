import { useState } from "react";
import { EolBar } from "./EolBar";
import { AddonTable } from "./AddonTable";

function MetaCard({ label, value, sub, valueColor }) {
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "0.75rem 1rem" }}>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: valueColor ?? "var(--color-text-primary)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function shortNgName(name) {
  return name.replace(/[-_]?\d{14,}[a-z0-9]*$/i, "").replace(/[-_]+$/, "") || name;
}

const NG_COLORS = [
  "var(--color-text-info)", "var(--color-text-success)", "var(--color-text-warning)",
  "#a78bfa", "#f472b6", "#34d399",
];

function DonutChart({ nodeGroups }) {
  const total = nodeGroups.reduce((s, ng) => s + (ng.desired ?? ng.node_count ?? 0), 0);
  const size = 140, cx = 70, cy = 70, r = 46, strokeW = 18;

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
  const slices = nodeGroups.filter(ng => (ng.desired ?? ng.node_count ?? 0) > 0).map((ng, i) => {
    const count = ng.desired ?? ng.node_count ?? 0;
    const dash = (count / total) * circumference;
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <DonutChart nodeGroups={nodeGroups} />
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {nodeGroups.map((ng, i) => {
              const count = ng.desired ?? ng.node_count ?? 0;
              return (
                <div key={ng.name} style={{ display: "flex", alignItems: "center", gap: 5, opacity: count === 0 ? 0.35 : 1 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: NG_COLORS[i % NG_COLORS.length], flexShrink: 0, display: "inline-block" }} />
                  <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{shortNgName(ng.name)}</span>
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>({count})</span>
                </div>
              );
            })}
          </div>
        </div>

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
                const count = ng.desired ?? ng.node_count ?? 0;
                const dimmed = count === 0;
                const minS = ng.min_size ?? 0, maxS = ng.max_size ?? 0;
                return (
                  <>
                    <tr key={ng.name} style={{ borderBottom: (ng.instances?.length ?? 0) > 0 ? "none" : "0.5px solid var(--color-border-tertiary)", opacity: dimmed ? 0.35 : 1 }}>
                      <td style={{ padding: "6px 6px 2px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: NG_COLORS[i % NG_COLORS.length], flexShrink: 0, display: "inline-block" }} />
                          <span style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={ng.name}>
                            {shortNgName(ng.name)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "6px 6px 2px", fontSize: 12, color: "var(--color-text-secondary)", verticalAlign: "top" }}>{ng.instance_type ?? "—"}</td>
                      <td style={{ padding: "6px 6px 2px", fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center", verticalAlign: "top" }}>
                        {minS} / <span style={{ fontWeight: 600, color: count > 0 ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>{count}</span> / {maxS}
                      </td>
                      <td style={{ padding: "6px 6px 2px", fontSize: 11, verticalAlign: "top", color: ng.status === "ACTIVE" ? "var(--color-text-success)" : "var(--color-text-warning)" }}>
                        {ng.status ?? "—"}
                      </td>
                    </tr>
                    {(ng.instances ?? []).map(inst => (
                      <tr key={inst.instance_id} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)", opacity: dimmed ? 0.35 : 1 }}>
                        <td colSpan={4} style={{ padding: "3px 6px 6px 22px" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontFamily: "monospace" }}>{inst.instance_id}</span>
                            {inst.private_ip && (
                              <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>🖧 {inst.private_ip}</span>
                            )}
                            {inst.az && (
                              <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>📍 {inst.az}</span>
                            )}
                            {inst.node_name && inst.node_name !== inst.instance_id && (
                              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontFamily: "monospace" }}>{inst.node_name}</span>
                            )}
                            {inst.node_status && (
                              <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 10, fontWeight: 600,
                                background: inst.node_status === "Ready" ? "var(--color-background-success)" : "var(--color-background-danger)",
                                color: inst.node_status === "Ready" ? "var(--color-text-success)" : "var(--color-text-danger)",
                              }}>{inst.node_status}</span>
                            )}
                          </div>
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

function UpgradePath({ cluster }) {
  const { upgrade_path, version } = cluster;
  if (!upgrade_path || upgrade_path.length === 0) return null;

  return (
    <div style={{ marginTop: "1.25rem" }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 10 }}>
        Simulação de upgrade
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-background-secondary)", border: "1.5px solid var(--color-text-success)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--color-text-success)", flexShrink: 0 }}>✓</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>v{version} <span style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 400 }}>— versão atual</span></div>
        </div>
        {upgrade_path.map((step, i) => {
          const hasActions = step.addons_to_update.length > 0;
          return (
            <div key={step.version} style={{ display: "flex", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{ width: 1, height: 12, background: "var(--color-border-secondary)" }} />
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-background-secondary)", border: `1.5px solid ${hasActions ? "var(--color-text-warning)" : "var(--color-border-secondary)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: hasActions ? "var(--color-text-warning)" : "var(--color-text-tertiary)", flexShrink: 0 }}>
                  {i + 1}
                </div>
              </div>
              <div style={{ paddingTop: 12, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Upgrade para v{step.version}</div>
                <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
                  {hasActions ? (
                    <>
                      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 2 }}>Antes de atualizar o control plane:</div>
                      {step.addons_to_update.map(a => (
                        <div key={a.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                          <span style={{ fontWeight: 500 }}>{a.name}</span>
                          <span style={{ color: "var(--color-text-tertiary)" }}>
                            {a.current_version} → <span style={{ color: a.action_type === "danger" ? "var(--color-text-danger)" : "var(--color-text-warning)", fontWeight: 500 }}>{a.required_version}</span>
                          </span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--color-text-success)" }}>
                      <span>✓</span>
                      <span>Nenhuma ação necessária — todos os addons são compatíveis com v{step.version}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ClusterCard({ cluster, addons, addonsLoading }) {
  const [showUpgradePath, setShowUpgradePath] = useState(false);
  const days = cluster.eol_days_remaining;
  const eolBadgeColor = days < 60 ? "var(--color-text-danger)" : days < 180 ? "var(--color-text-warning)" : "var(--color-text-success)";
  const eolBadgeBg   = days < 60 ? "var(--color-background-danger)" : days < 180 ? "var(--color-background-warning)" : "var(--color-background-success)";
  const eolLabel = days < 60 ? `EOL em ${days} dias` : `EOL em ${Math.round(days / 30)} meses`;
  const hasUpgradePath = cluster.upgrade_path && cluster.upgrade_path.length > 0;

  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18, color: "var(--color-text-info)" }}>☁</span>
          <span style={{ fontSize: 15, fontWeight: 500 }}>{cluster.name}</span>
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{cluster.status}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 500, background: eolBadgeBg, color: eolBadgeColor }}>{eolLabel}</span>
          {hasUpgradePath && (
            <button onClick={() => setShowUpgradePath(v => !v)}
              style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 500, background: "var(--color-background-info)", color: "var(--color-text-info)", border: "none", cursor: "pointer" }}>
              {showUpgradePath ? "Ocultar upgrade" : "Simular upgrade →"}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: "1.25rem" }}>
        <MetaCard label="Versão atual" value={cluster.version} sub="Kubernetes" />
        <MetaCard label="Próxima versão" value={cluster.next_version} sub="Disponível" />
        <MetaCard label="Fim do suporte" value={cluster.eol_date ?? "—"}
          sub={`Suporte padrão (free) · ${days < 60 ? `${days} dias` : `${days} dias · ~${Math.round(days / 30)} meses`}`}
          valueColor={eolBadgeColor} />
        <MetaCard label="Região" value={cluster.region} sub="AWS" />
        <MetaCard label="Nós" value={cluster.node_count} sub={`${cluster.node_groups?.length ?? 0} node groups`} />
      </div>

      <EolBar cluster={cluster} />
      <NodeGroupsSection nodeGroups={cluster.node_groups} />
      {showUpgradePath && <UpgradePath cluster={cluster} />}

      {addonsLoading
        ? <div style={{ fontSize: 13, color: "var(--color-text-secondary)", padding: "1rem 0" }}>Carregando addons...</div>
        : <AddonTable addons={addons} cluster={cluster} />
      }
    </div>
  );
}
