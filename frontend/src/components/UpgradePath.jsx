export function UpgradePath({ cluster }) {
  const { upgrade_path, version } = cluster;
  if (!upgrade_path || upgrade_path.length === 0) return null;

  return (
    <div style={{ marginTop: "1.25rem" }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 10 }}>
        Simulação de upgrade
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Ponto de partida */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-background-secondary)", border: "1.5px solid var(--color-text-success)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--color-text-success)", flexShrink: 0 }}>
            ✓
          </div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>v{version} <span style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 400 }}>— versão atual</span></div>
        </div>

        {upgrade_path.map((step, i) => {
          const hasActions = step.addons_to_update.length > 0;
          return (
            <div key={step.version} style={{ display: "flex", gap: 10 }}>
              {/* Linha vertical + círculo */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{ width: 1, height: 12, background: "var(--color-border-secondary)" }} />
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-background-secondary)", border: `1.5px solid ${hasActions ? "var(--color-text-warning)" : "var(--color-border-secondary)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: hasActions ? "var(--color-text-warning)" : "var(--color-text-tertiary)", flexShrink: 0 }}>
                  {i + 1}
                </div>
              </div>

              <div style={{ paddingTop: 12, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: hasActions ? 6 : 0 }}>
                  Upgrade para v{step.version}
                </div>

                <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
                  {hasActions ? (
                    <>
                      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 2 }}>Antes de atualizar o control plane:</div>
                      {step.addons_to_update.map((a) => (
                        <div key={a.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                          <span style={{ fontWeight: 500 }}>{a.name}</span>
                          <span style={{ color: "var(--color-text-tertiary)" }}>
                            {a.current_version} →{" "}
                            <span style={{ color: a.action_type === "danger" ? "var(--color-text-danger)" : "var(--color-text-warning)", fontWeight: 500 }}>
                              {a.required_version}
                            </span>
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
