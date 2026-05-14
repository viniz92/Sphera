import { useState, useEffect } from "react";
import { EolBar } from "./EolBar";
import { AddonTable } from "./AddonTable";
import { EventsPanel } from "./EventsPanel";
import { MonitorPanel } from "./MonitorPanel";
import { CostsPanel } from "./CostsPanel";
import { CatalogPanel } from "./CatalogPanel";
import { EksVersionsPanel } from "./EksVersionsPanel";
import { NodeCharts } from "./NodeCharts";
import { MonitorDashboard } from "./MonitorDashboard";
import { useLanguage } from "../context/LanguageContext";
import { fetchNodeMetrics } from "../api/client";

function MetaCard({ label, value, sub, valueColor, action }) {
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "0.85rem 1rem" }}>
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 5 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: valueColor ?? "var(--color-text-primary)" }}>{value}</div>
        {action}
      </div>
      {sub && <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 3 }}>{sub}</div>}
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
  const size = 164, cx = 82, cy = 82, r = 56, strokeW = 22;

  const shadow = "drop-shadow(0 6px 18px rgba(0,0,0,0.85)) drop-shadow(0 2px 6px rgba(0,0,0,0.6)) drop-shadow(0 0 1px rgba(255,255,255,0.06))";

  if (total === 0) {
    return (
      <div style={{ filter: shadow }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border-secondary)" strokeWidth={strokeW} />
          <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fill="var(--color-text-tertiary)">0</text>
        </svg>
      </div>
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
    <div style={{ filter: shadow }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border-tertiary)" strokeWidth={strokeW} />
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
            strokeWidth={strokeW} strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset} strokeLinecap="butt" />
        ))}
        <text x={cx} y={cy + 7} textAnchor="middle" fontSize="22" fontWeight="700"
          fill="var(--color-text-primary)" style={{ transform: `rotate(90deg)`, transformOrigin: `${cx}px ${cy}px` }}>
          {total}
        </text>
      </svg>
    </div>
  );
}

function MiniBar({ percent, color }) {
  const pct = Math.min(100, percent ?? 0);
  const c = pct > 85 ? "var(--color-text-danger)" : pct > 65 ? "var(--color-text-warning)" : color;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div style={{ width: 52, background: "var(--color-background-secondary)", borderRadius: 3, height: 5, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 3, background: c, width: `${pct}%` }} />
      </div>
      <span style={{ fontSize: 10, color: c, minWidth: 28 }}>{percent != null ? `${percent}%` : "—"}</span>
    </div>
  );
}

function NodeGroupsSection({ nodeGroups }) {
  const { t } = useLanguage();
  const [nodeMetrics, setNodeMetrics] = useState({});

  useEffect(() => {
    fetchNodeMetrics()
      .then(data => {
        const map = {};
        data.forEach(m => { map[m.name] = m; });
        setNodeMetrics(map);
      })
      .catch(() => {});
  }, []);

  if (!nodeGroups || nodeGroups.length === 0) return null;

  const thStyle = {
    fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 400,
    textAlign: "left", padding: "4px 6px",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
  };

  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 10 }}>
        {t("nodeGroups")}
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
                <th style={{ ...thStyle, width: 110 }}>{t("instance")}</th>
                <th style={{ ...thStyle, width: 80, textAlign: "center" }}>{t("minDesMax")}</th>
                <th style={{ ...thStyle, width: 68 }}>{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {nodeGroups.map((ng, i) => {
                const count = ng.desired ?? ng.node_count ?? 0;
                const dimmed = count === 0;
                const minS = ng.min_size ?? 0, maxS = ng.max_size ?? 0;
                const instances = ng.instances ?? [];
                const readyCount = instances.filter(inst => inst.node_status === "Ready").length;
                const allReady = instances.length > 0 && readyCount === instances.length;
                const someNotReady = instances.length > 0 && readyCount < instances.length;
                return (
                  <>
                    <tr key={ng.name} style={{ borderBottom: instances.length > 0 ? "none" : "0.5px solid var(--color-border-tertiary)", opacity: dimmed ? 0.35 : 1 }}>
                      <td style={{ padding: "6px 6px 2px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: NG_COLORS[i % NG_COLORS.length], flexShrink: 0, display: "inline-block" }} />
                          <span style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={ng.name}>
                            {shortNgName(ng.name)}
                          </span>
                          {allReady && (
                            <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, fontWeight: 600, background: "var(--color-background-success)", color: "var(--color-text-success)", flexShrink: 0 }}>
                              Ready
                            </span>
                          )}
                          {someNotReady && (
                            <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, fontWeight: 600, background: "var(--color-background-danger)", color: "var(--color-text-danger)", flexShrink: 0 }}>
                              Not Ready
                            </span>
                          )}
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
                    {instances.map(inst => {
                      const m = nodeMetrics[inst.node_name];
                      return (
                        <tr key={inst.instance_id} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)", opacity: dimmed ? 0.35 : 1 }}>
                          <td colSpan={4} style={{ padding: "2px 6px 7px 22px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "160px 108px 90px 1fr auto", gap: "0 14px", alignItems: "center" }}>
                              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={inst.instance_id}>{inst.instance_id}</span>
                              <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{inst.private_ip ?? "—"}</span>
                              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{inst.az ?? "—"}</span>
                              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={inst.node_name}>{inst.node_name && inst.node_name !== inst.instance_id ? inst.node_name : "—"}</span>
                              {m ? (
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", minWidth: 24 }}>CPU</span>
                                    <MiniBar percent={m.cpu_percent} color="var(--color-text-info)" />
                                  </span>
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                                    <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", minWidth: 28 }}>MEM</span>
                                    <MiniBar percent={m.memory_percent} color="var(--color-text-success)" />
                                  </span>
                                </span>
                              ) : <span />}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
  const { t } = useLanguage();
  const { upgrade_path, version } = cluster;
  if (!upgrade_path || upgrade_path.length === 0) return null;

  return (
    <div style={{ marginTop: "1.25rem" }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 10 }}>
        {t("upgradeSimulation")}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-background-secondary)", border: "1.5px solid var(--color-text-success)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--color-text-success)", flexShrink: 0 }}>✓</div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>v{version} <span style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 400 }}>— {t("currentVersionBadge")}</span></div>
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
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{t("upgradeTo")}{step.version}</div>
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

const TAB_KEYS = [
  { id: "addons",   key: "tabAddons" },
  { id: "nos",      key: "tabNodes" },
  { id: "pods",     key: "tabPods" },
  { id: "monitor",  key: "tabMonitor" },
  { id: "eventos",  key: "tabEvents" },
  { id: "costs",    key: "tabCosts" },
  { id: "catalog",  key: "tabCatalog" },
];

export function ClusterCard({ cluster, addons, addonsLoading }) {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState("addons");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    function handler() { setShowVersions(true); }
    window.addEventListener("sphera:nav-versions", handler);
    return () => window.removeEventListener("sphera:nav-versions", handler);
  }, []);
  const days = cluster.eol_days_remaining;
  const eolBadgeColor = days < 60 ? "var(--color-text-danger)" : days < 180 ? "var(--color-text-warning)" : "var(--color-text-success)";
  const eolBadgeBg   = days < 60 ? "var(--color-background-danger)" : days < 180 ? "var(--color-background-warning)" : "var(--color-background-success)";
  const eolLabel = days < 60 ? `EOL em ${days} dias` : `EOL em ${Math.round(days / 30)} meses`;

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
          <button onClick={() => setShowUpgrade(v => !v)} style={{
            fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
            background: showUpgrade ? "rgba(74,212,127,0.15)" : "var(--color-background-secondary)",
            color: showUpgrade ? "var(--color-text-success)" : "var(--color-text-secondary)",
            border: "0.5px solid var(--color-border-secondary)", cursor: "pointer",
          }}>
            {t("simulateUpgrade")}
          </button>
          <button onClick={() => setShowVersions(v => !v)} style={{
            fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
            background: showVersions ? "rgba(74,127,212,0.18)" : "var(--color-background-secondary)",
            color: "var(--color-text-info)", border: "0.5px solid var(--color-border-secondary)",
            cursor: "pointer",
          }}>
            {t("eksVersionsBtn")} →
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: "1.25rem" }}>
        <MetaCard label={t("currentVersion")} value={cluster.version} sub="Kubernetes" />
        <MetaCard label={t("nextVersion")} value={cluster.next_version} sub={t("available")}
          action={
            <button onClick={() => setShowVersions(true)} style={{
              fontSize: 10, fontWeight: 600, padding: "2px 9px", borderRadius: 8,
              background: "rgba(74,127,212,0.15)", color: "var(--color-text-info)",
              border: "0.5px solid rgba(74,127,212,0.3)", cursor: "pointer",
              marginLeft: 4,
            }}>
              details
            </button>
          }
        />
        <MetaCard label={t("endOfSupport")} value={cluster.eol_date ?? "—"}
          sub={`${t("supportLabel")} · ${days < 60 ? `${days} dias` : `${days} dias · ~${Math.round(days / 30)} meses`}`}
          valueColor={eolBadgeColor} />
        <MetaCard label={t("region")} value={cluster.region} sub="AWS" />
        <MetaCard label={t("nodes")} value={cluster.node_count} sub={`${cluster.node_groups?.length ?? 0} node groups`} />
      </div>

      <EolBar cluster={cluster} />
      {showUpgrade && <UpgradePath cluster={cluster} />}
      {showVersions && <EksVersionsPanel currentVersion={cluster.version} key={lang} />}

      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border-tertiary)", marginBottom: "1rem" }}>
        {TAB_KEYS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "7px 18px", fontSize: 12, fontWeight: activeTab === tab.id ? 600 : 400,
            color: activeTab === tab.id ? "var(--color-text-info)" : "var(--color-text-secondary)",
            background: "none", border: "none", cursor: "pointer",
            borderBottom: activeTab === tab.id ? "2px solid var(--color-text-info)" : "2px solid transparent",
            marginBottom: -1,
          }}>
            {t(tab.key)}
          </button>
        ))}
      </div>

      {activeTab === "addons" && (addonsLoading
        ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
                <div className="skeleton-box" style={{ width: 140, height: 13 }} />
                <div className="skeleton-box" style={{ width: 60, height: 13 }} />
                <div className="skeleton-box" style={{ width: 80, height: 13, marginLeft: "auto" }} />
                <div className="skeleton-box" style={{ width: 100, height: 13 }} />
              </div>
            ))}
          </div>
        )
        : <AddonTable addons={addons} cluster={cluster} />
      )}
      {activeTab === "nos" && (
        <>
          <NodeGroupsSection nodeGroups={cluster.node_groups} />
          <NodeCharts />
        </>
      )}
      {activeTab === "monitor" && <MonitorDashboard key={lang} />}
      {activeTab === "pods"    && <MonitorPanel key={lang} />}
      {activeTab === "eventos" && <EventsPanel key={lang} />}
      {activeTab === "costs"    && <CostsPanel key={lang} />}
      {activeTab === "catalog"  && <CatalogPanel addons={addons} />}
    </div>
  );
}
