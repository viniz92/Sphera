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

export function ClusterCard({ cluster, addons, addonsLoading, onReset }) {
  const days = cluster.eol_days_remaining;
  const eolBadgeColor = days < 60 ? "var(--color-text-danger)" : days < 180 ? "var(--color-text-warning)" : "var(--color-text-success)";
  const eolBadgeBg = days < 60 ? "var(--color-background-danger)" : days < 180 ? "var(--color-background-warning)" : "var(--color-background-success)";
  const eolLabel = days < 60 ? `EOL em ${days} dias` : days < 180 ? `EOL em ${Math.round(days / 30)} meses` : `EOL em ${Math.round(days / 30)} meses`;

  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18, color: "var(--color-text-info)" }}>☁</span>
          <span style={{ fontSize: 15, fontWeight: 500 }}>{cluster.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 500, background: eolBadgeBg, color: eolBadgeColor }}>
            {eolLabel}
          </span>
          <button onClick={onReset} style={{ fontSize: 12, padding: "4px 10px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "none", cursor: "pointer", color: "var(--color-text-secondary)" }}>
            Trocar cluster
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: "1.25rem" }}>
        <MetaCard label="Versão atual" value={cluster.version} sub="Kubernetes" />
        <MetaCard label="Próxima versão" value={cluster.next_version} sub="Disponível" />
        <MetaCard label="Fim do suporte" value={cluster.eol_date ?? "—"} sub={`~${Math.round(days / 30)} meses`} valueColor={eolBadgeColor} />
        <MetaCard label="Região" value={cluster.region} sub="AWS" />
        <MetaCard label="Nós" value={cluster.node_count} sub={`${cluster.node_groups?.length ?? 0} node groups`} />
      </div>

      <EolBar cluster={cluster} />

      {addonsLoading ? (
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", padding: "1rem 0" }}>Carregando addons...</div>
      ) : (
        <AddonTable addons={addons} cluster={cluster} />
      )}
    </div>
  );
}
