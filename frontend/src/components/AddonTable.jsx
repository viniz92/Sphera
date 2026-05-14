import { useState, useEffect } from "react";
import { AddonRow } from "./AddonRow";
import { useLanguage } from "../context/LanguageContext";

const thStyle = {
  fontSize: 11,
  color: "var(--color-text-tertiary)",
  fontWeight: 400,
  textAlign: "left",
  padding: "6px 8px",
  borderBottom: "0.5px solid var(--color-border-tertiary)",
};

export function AddonTable({ addons, cluster }) {
  const { t } = useLanguage();
  const [addonMetrics, setAddonMetrics] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("sphera_token") || "";
    fetch("/api/metrics/addons", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const map = {};
        (Array.isArray(data) ? data : []).forEach(m => { map[m.namespace] = m; });
        setAddonMetrics(map);
      })
      .catch(() => {});
  }, []);

  // Compute totals for percentage calculation
  const totalCpu = Object.values(addonMetrics).reduce((s, m) => s + (m.cpu_millicores || 0), 0);
  const totalMem = Object.values(addonMetrics).reduce((s, m) => s + (m.memory_mib || 0), 0);

  // Inject metrics and percentages into addons by namespace
  const enriched = addons.map(a => {
    const m = addonMetrics[a.namespace];
    if (!m) return a;
    const cpu_percent = totalCpu > 0 ? (m.cpu_millicores / totalCpu) * 100 : null;
    const memory_percent = totalMem > 0 ? (m.memory_mib / totalMem) * 100 : null;
    return { ...a, cpu_millicores: m.cpu_millicores, memory_mib: m.memory_mib, cpu_percent, memory_percent };
  });

  const needsAction = enriched.filter((a) => a.compat_next !== "ok");

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 8 }}>
        {t("installedAddons")}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: 44, padding: "6px 0" }}></th>
            <th style={thStyle}>{t("addon")}</th>
            <th style={{ ...thStyle, width: 80 }}>{t("version")}</th>
            <th style={{ ...thStyle, width: 110 }}>v{cluster.version}</th>
            <th style={{ ...thStyle, width: 110 }}>v{cluster.next_version}</th>
            <th style={{ ...thStyle, width: 110 }}>{t("requiredAction")}</th>
          </tr>
        </thead>
        <tbody>
          {enriched.map((addon) => (
            <AddonRow key={addon.name} addon={addon} />
          ))}
        </tbody>
      </table>

      {needsAction.length > 0 && (
        <div style={{ background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", marginTop: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem" }}>
            <span style={{ fontSize: 16, color: "var(--color-text-warning)" }}>⚠</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              {t("simulateUpgrade").replace(" →", "")} → v{cluster.next_version}: {needsAction.length} {t("addonsNeedAttention")}
            </span>
          </div>
          {needsAction.map((a) => (
            <div key={a.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "0.5px solid var(--color-border-tertiary)", fontSize: 13 }}>
              <span style={{ fontWeight: 500 }}>{a.name}</span>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{a.version} → {a.compat_next === "incompat" ? "incompatível" : "requer atualização"}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: a.action_type === "danger" ? "var(--color-text-danger)" : "var(--color-text-warning)" }}>
                {t("requiredAction")}: {a.required_version_next}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
