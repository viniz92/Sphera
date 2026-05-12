import { useState } from "react";
import { AddonDetail } from "./AddonDetail";

function Chip({ status }) {
  const map = {
    ok: { bg: "var(--color-background-success)", color: "var(--color-text-success)", label: "OK", icon: "✓" },
    upd: { bg: "var(--color-background-warning)", color: "var(--color-text-warning)", label: "Atualizar", icon: "⚠" },
    incompat: { bg: "var(--color-background-danger)", color: "var(--color-text-danger)", label: "Incompatível", icon: "✕" },
  };
  const s = map[status] ?? map.ok;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, padding: "3px 8px", borderRadius: 20, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {s.icon} {s.label}
    </span>
  );
}

function ActionCell({ addon }) {
  if (!addon.required_version_next) return <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>—</span>;
  const color = addon.action_type === "danger" ? "var(--color-text-danger)" : "var(--color-text-warning)";
  return <span style={{ fontSize: 12, fontWeight: 500, color }}>{addon.required_version_next}</span>;
}

export function AddonRow({ addon }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        <td style={{ width: 44, padding: "10px 0", verticalAlign: "middle" }}>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={`Expandir ${addon.name}`}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "4px 6px", borderRadius: "var(--border-radius-md)",
              color: "var(--color-text-tertiary)", display: "flex", alignItems: "center",
            }}
          >
            <span style={{ display: "inline-block", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", fontSize: 14 }}>
              ▾
            </span>
          </button>
        </td>
        <td style={{ padding: "10px 8px", verticalAlign: "middle" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
              <span
                title={addon.healthy === true ? "Rodando" : addon.healthy === false ? "Com problema" : "Status desconhecido"}
                style={{
                  width: 7, height: 7, borderRadius: "50%", display: "inline-block",
                  background: addon.healthy === true ? "var(--color-text-success)" : addon.healthy === false ? "var(--color-text-danger)" : "var(--color-text-tertiary)",
                }}
              />
              {addon.replicas_desired != null && (
                <span style={{ fontSize: 9, color: addon.healthy === false ? "var(--color-text-danger)" : "var(--color-text-tertiary)", lineHeight: 1, whiteSpace: "nowrap" }}>
                  {addon.replicas_available}/{addon.replicas_desired}
                </span>
              )}
            </span>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{addon.name}</span>
          </span>
        </td>
        <td style={{ width: 80, padding: "10px 8px", verticalAlign: "middle" }}>
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{addon.version}</span>
        </td>
        <td style={{ width: 110, padding: "10px 8px", verticalAlign: "middle" }}>
          <Chip status={addon.compat_current} />
        </td>
        <td style={{ width: 110, padding: "10px 8px", verticalAlign: "middle" }}>
          <Chip status={addon.compat_next} />
        </td>
        <td style={{ width: 110, padding: "10px 8px", verticalAlign: "middle" }}>
          <ActionCell addon={addon} />
        </td>
      </tr>

      {open && (
        <tr>
          <td colSpan={6} style={{ padding: 0 }}>
            <AddonDetail addon={addon} />
          </td>
        </tr>
      )}
    </>
  );
}
