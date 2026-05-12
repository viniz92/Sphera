import { useLanguage } from "../context/LanguageContext";

export function EolBar({ cluster }) {
  const { t } = useLanguage();
  const pct = cluster.eol_percent_elapsed ?? 68;
  const days = cluster.eol_days_remaining;
  const eolDate = cluster.eol_date;
  const releaseDate = cluster.release_date;

  const color = days < 60 ? "var(--color-text-danger)" : days < 180 ? "var(--color-text-warning)" : "var(--color-text-success)";

  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6 }}>
        {t("versionLifecycle")} {cluster.version}
        {days !== null && (
          <span style={{ marginLeft: 8, fontWeight: 500, color }}>{days} {t("daysRemaining")}</span>
        )}
      </div>
      <div style={{ background: "var(--color-background-secondary)", borderRadius: 6, height: 8, overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 6, background: color, width: `${pct}%`, transition: "width 0.5s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 4 }}>
        <span>{t("releaseDate")}: {releaseDate ?? "—"}</span>
        <span>{t("eol")}: {eolDate ?? "—"}</span>
      </div>
    </div>
  );
}
