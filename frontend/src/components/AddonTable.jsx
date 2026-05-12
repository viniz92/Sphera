import { AddonRow } from "./AddonRow";

const thStyle = {
  fontSize: 11,
  color: "var(--color-text-tertiary)",
  fontWeight: 400,
  textAlign: "left",
  padding: "6px 8px",
  borderBottom: "0.5px solid var(--color-border-tertiary)",
};

export function AddonTable({ addons, cluster }) {
  const needsAction = addons.filter((a) => a.compat_next !== "ok");

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 8 }}>
        Addons instalados
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: 44, padding: "6px 0" }}></th>
            <th style={thStyle}>Addon</th>
            <th style={{ ...thStyle, width: 80 }}>Versão</th>
            <th style={{ ...thStyle, width: 110 }}>v{cluster.version}</th>
            <th style={{ ...thStyle, width: 110 }}>v{cluster.next_version}</th>
            <th style={{ ...thStyle, width: 110 }}>Ação necessária</th>
          </tr>
        </thead>
        <tbody>
          {addons.map((addon) => (
            <AddonRow key={addon.name} addon={addon} />
          ))}
        </tbody>
      </table>

      {needsAction.length > 0 && (
        <div style={{ background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", marginTop: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem" }}>
            <span style={{ fontSize: 16, color: "var(--color-text-warning)" }}>⚠</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              Simulação de upgrade → v{cluster.next_version}: {needsAction.length} addon{needsAction.length > 1 ? "s" : ""} precisam de atenção
            </span>
          </div>
          {needsAction.map((a) => (
            <div key={a.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "0.5px solid var(--color-border-tertiary)", fontSize: 13 }}>
              <span style={{ fontWeight: 500 }}>{a.name}</span>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{a.version} → {a.compat_next === "incompat" ? "incompatível" : "requer atualização"}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: a.action_type === "danger" ? "var(--color-text-danger)" : "var(--color-text-warning)" }}>
                Atualizar para {a.required_version_next}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
