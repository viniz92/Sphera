import { AccessBox } from "./AccessBox";
import { useLanguage } from "../context/LanguageContext";

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
    </div>
  );
}
