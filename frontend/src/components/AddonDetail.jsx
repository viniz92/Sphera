import { useState, useEffect } from "react";
import { AccessBox } from "./AccessBox";
import { useLanguage } from "../context/LanguageContext";

function ChangelogSection({ addonName }) {
  const [releases, setReleases] = useState(null);
  const [open, setOpen] = useState(false);

  function load() {
    if (releases !== null) { setOpen(v => !v); return; }
    const token = localStorage.getItem("sphera_token") || "";
    fetch(`/api/changelog/${addonName}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setReleases(d.releases || []); setOpen(true); })
      .catch(() => { setReleases([]); setOpen(true); });
  }

  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={load} style={{
        fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 8,
        background: "rgba(74,127,212,0.12)", color: "var(--color-text-info)",
        border: "0.5px solid rgba(74,127,212,0.25)", cursor: "pointer",
      }}>
        {open ? "▲ Ocultar releases" : "▼ Ver últimas releases GitHub"}
      </button>
      {open && releases !== null && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          {releases.length === 0
            ? <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Nenhuma release encontrada.</span>
            : releases.map(r => (
              <div key={r.tag} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                <span style={{ fontWeight: 600, color: "var(--color-text-primary)", minWidth: 80 }}>{r.tag}</span>
                <span style={{ color: "var(--color-text-tertiary)" }}>{r.date}</span>
                <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-text-info)", textDecoration: "none" }}>↗ {r.name}</a>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

export function AddonDetail({ addon }) {
  const { t } = useLanguage();
  const isOffline = addon.healthy === false;
  return (
    <div style={{
      background: "var(--color-background-secondary)",
      borderRadius: "var(--border-radius-md)",
      margin: "0 0 10px 44px",
      padding: "12px 14px",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{t("description")}</span>
        {isOffline && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: "var(--border-radius-md)", background: "var(--color-background-danger)", marginBottom: 4 }}>
            <span style={{ fontSize: 12 }}>⚠</span>
            <span style={{ fontSize: 11, color: "var(--color-text-danger)", fontWeight: 500 }}>
              {addon.replicas_available ?? 0}/{addon.replicas_desired ?? "?"} réplicas disponíveis
            </span>
          </div>
        )}
        <span style={{ fontSize: 12, color: "var(--color-text-primary)", lineHeight: 1.5 }}>{addon.description ?? "—"}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{t("maintainer")}</span>
          <span style={{ fontSize: 12, color: "var(--color-text-primary)" }}>{addon.maintainer ?? "—"}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{t("category")}</span>
          <span style={{ fontSize: 12, color: "var(--color-text-primary)" }}>{addon.category ?? "—"}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{t("updateFreq")}</span>
          <span style={{ fontSize: 12, color: "var(--color-text-primary)" }}>{addon.update_freq ?? "—"}</span>
        </div>
      </div>

      {addon.access && <AccessBox access={addon.access} />}

      <div style={{ gridColumn: "1/-1", display: "flex", gap: 14, flexWrap: "wrap", marginTop: 2 }}>
        {addon.doc_url && (
          <a href={addon.doc_url} target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-text-info)", textDecoration: "none" }}>
            📖 {t("docs")}
          </a>
        )}
        {addon.changelog_url && (
          <a href={addon.changelog_url} target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-text-info)", textDecoration: "none" }}>
            🕐 {t("changelog")}
          </a>
        )}
        {addon.github_url && (
          <a href={addon.github_url} target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-text-info)", textDecoration: "none" }}>
            GitHub
          </a>
        )}
      </div>

      {/* Resource usage */}
      {(addon.cpu_millicores != null || addon.memory_mib != null) && (
        <div style={{ gridColumn: "1/-1", display: "flex", gap: 16, marginTop: 4 }}>
          {addon.cpu_millicores != null && (
            <span style={{ fontSize: 11, color: "var(--color-text-info)" }}>CPU {addon.cpu_millicores}m</span>
          )}
          {addon.memory_mib != null && (
            <span style={{ fontSize: 11, color: "var(--color-text-success)" }}>
              Mem {addon.memory_mib >= 1024 ? `${(addon.memory_mib / 1024).toFixed(1)} GiB` : `${addon.memory_mib} MiB`}
            </span>
          )}
        </div>
      )}

      {/* Changelog from GitHub */}
      {addon.github_url && (
        <div style={{ gridColumn: "1/-1" }}>
          <ChangelogSection addonName={addon.name} />
        </div>
      )}
    </div>
  );
}
