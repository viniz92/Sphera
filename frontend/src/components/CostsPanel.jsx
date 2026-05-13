import { useState, useEffect } from "react";
import { fetchCosts } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

function fmt(usd) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(usd);
}

function CostCard({ label, hourly, monthly, accent }) {
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 16px", flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: accent ?? "var(--color-text-primary)", lineHeight: 1 }}>{fmt(monthly)}</div>
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 4 }}>/mês · {fmt(hourly)}/h</div>
    </div>
  );
}

export function CostsPanel() {
  const { t } = useLanguage();
  const [costs, setCosts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCosts()
      .then(setCosts)
      .catch(() => setError("Erro ao carregar estimativa de custos."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "1.5rem 0", fontSize: 13, color: "var(--color-text-secondary)" }}>Carregando custos...</div>;
  if (error)   return <div style={{ padding: "1.5rem 0", fontSize: 13, color: "var(--color-text-danger)" }}>{error}</div>;
  if (!costs)  return null;

  const thStyle = {
    fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 400,
    textAlign: "left", padding: "5px 10px",
    borderBottom: "0.5px solid var(--color-border-tertiary)",
  };

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: "flex", gap: 10, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <CostCard label="Total estimado" hourly={costs.total_hourly} monthly={costs.total_monthly} accent="var(--color-text-primary)" />
        <CostCard label="EC2 (nós)" hourly={costs.ec2_hourly} monthly={costs.ec2_monthly} accent="var(--color-text-info)" />
        <CostCard label="EKS cluster fee" hourly={costs.eks_hourly} monthly={costs.eks_monthly} accent="var(--color-text-warning)" />
      </div>

      {/* Node group breakdown */}
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 8 }}>
        Custo por node group
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", marginBottom: "1rem" }}>
        <thead>
          <tr>
            <th style={thStyle}>Node group</th>
            <th style={{ ...thStyle, width: 130 }}>Instância</th>
            <th style={{ ...thStyle, width: 60, textAlign: "center" }}>Nós</th>
            <th style={{ ...thStyle, width: 100, textAlign: "right" }}>$/hora cada</th>
            <th style={{ ...thStyle, width: 110, textAlign: "right" }}>$/hora total</th>
            <th style={{ ...thStyle, width: 120, textAlign: "right" }}>$/mês est.</th>
          </tr>
        </thead>
        <tbody>
          {costs.node_groups.map(ng => (
            <tr key={ng.name} style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              <td style={{ padding: "7px 10px", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={ng.name}>
                {ng.name}
              </td>
              <td style={{ padding: "7px 10px", fontSize: 12, color: "var(--color-text-secondary)" }}>
                {ng.instance_type}
                {ng.pricing_note && <span style={{ fontSize: 10, color: "var(--color-text-warning)", marginLeft: 4 }}>~</span>}
              </td>
              <td style={{ padding: "7px 10px", fontSize: 12, textAlign: "center", color: "var(--color-text-secondary)" }}>{ng.node_count}</td>
              <td style={{ padding: "7px 10px", fontSize: 12, textAlign: "right", color: "var(--color-text-tertiary)", fontFamily: "monospace" }}>
                {ng.hourly_rate_per_instance > 0 ? fmt(ng.hourly_rate_per_instance) : "—"}
              </td>
              <td style={{ padding: "7px 10px", fontSize: 12, textAlign: "right", color: "var(--color-text-secondary)", fontFamily: "monospace" }}>
                {ng.hourly_total > 0 ? fmt(ng.hourly_total) : "—"}
              </td>
              <td style={{ padding: "7px 10px", fontSize: 13, fontWeight: 600, textAlign: "right", color: "var(--color-text-primary)", fontFamily: "monospace" }}>
                {ng.monthly_estimate > 0 ? fmt(ng.monthly_estimate) : "—"}
              </td>
            </tr>
          ))}
          {/* EKS fee row */}
          <tr style={{ borderBottom: "0.5px solid var(--color-border-tertiary)", opacity: 0.7 }}>
            <td style={{ padding: "7px 10px", fontSize: 12, color: "var(--color-text-tertiary)" }}>EKS cluster fee</td>
            <td style={{ padding: "7px 10px", fontSize: 12, color: "var(--color-text-tertiary)" }}>—</td>
            <td style={{ padding: "7px 10px", fontSize: 12, textAlign: "center", color: "var(--color-text-tertiary)" }}>—</td>
            <td style={{ padding: "7px 10px", fontSize: 12, textAlign: "right", color: "var(--color-text-tertiary)", fontFamily: "monospace" }}>{fmt(costs.eks_hourly)}</td>
            <td style={{ padding: "7px 10px", fontSize: 12, textAlign: "right", color: "var(--color-text-tertiary)", fontFamily: "monospace" }}>{fmt(costs.eks_hourly)}</td>
            <td style={{ padding: "7px 10px", fontSize: 13, fontWeight: 600, textAlign: "right", color: "var(--color-text-tertiary)", fontFamily: "monospace" }}>{fmt(costs.eks_monthly)}</td>
          </tr>
        </tbody>
      </table>

      {/* Disclaimer */}
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", padding: "8px 10px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", display: "flex", alignItems: "flex-start", gap: 6 }}>
        <span style={{ flexShrink: 0 }}>ℹ</span>
        <span>{costs.disclaimer}</span>
      </div>
    </div>
  );
}
