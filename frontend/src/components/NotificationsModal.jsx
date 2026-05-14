import { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem("sphera_token") || "";
  const res = await fetch(path, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erro desconhecido");
  }
  return res.json();
}

export function NotificationsModal({ onClose }) {
  const { t } = useLanguage();
  const [config, setConfig] = useState({ webhook_url: "", eol_threshold_days: 90, notify_new_version: true, notify_eol: true });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null); // { ok, msg }

  useEffect(() => {
    apiFetch("/api/notifications/config").then(setConfig).catch(() => {});
  }, []);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSave() {
    setSaving(true); setStatus(null);
    try {
      await apiFetch("/api/notifications/config", { method: "POST", body: JSON.stringify(config) });
      setStatus({ ok: true, msg: t("notifSaved") });
    } catch (e) {
      setStatus({ ok: false, msg: e.message });
    } finally { setSaving(false); }
  }

  async function handleTest() {
    setTesting(true); setStatus(null);
    try {
      await apiFetch("/api/notifications/test", { method: "POST", body: JSON.stringify(config) });
      setStatus({ ok: true, msg: t("notifTestOk") });
    } catch (e) {
      setStatus({ ok: false, msg: e.message });
    } finally { setTesting(false); }
  }

  const inputStyle = {
    width: "100%", padding: "8px 10px", fontSize: 12, borderRadius: "var(--border-radius-md)",
    border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)",
    color: "var(--color-text-primary)", outline: "none",
  };
  const labelStyle = { fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 5, display: "block" };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 460, background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-lg)",
        padding: "1.5rem", zIndex: 301, boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)" }}>{t("notifTitle")}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>{t("notifSubtitle")}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Webhook URL */}
          <div>
            <label style={labelStyle}>{t("notifWebhookUrl")}</label>
            <input
              value={config.webhook_url} onChange={e => setConfig(c => ({ ...c, webhook_url: e.target.value }))}
              placeholder="https://hooks.slack.com/services/..."
              style={inputStyle}
            />
            <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 4 }}>
              {t("notifWebhookHint")}
            </div>
          </div>

          {/* EOL threshold */}
          <div>
            <label style={labelStyle}>{t("notifEolThreshold")}</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="number" min={7} max={365}
                value={config.eol_threshold_days}
                onChange={e => setConfig(c => ({ ...c, eol_threshold_days: parseInt(e.target.value) || 90 }))}
                style={{ ...inputStyle, width: 80 }}
              />
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{t("notifDays")}</span>
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={config.notify_new_version}
                onChange={e => setConfig(c => ({ ...c, notify_new_version: e.target.checked }))} />
              <div>
                <div style={{ fontSize: 12, color: "var(--color-text-primary)", fontWeight: 500 }}>{t("notifNewVersion")}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{t("notifNewVersionDesc")}</div>
              </div>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={config.notify_eol}
                onChange={e => setConfig(c => ({ ...c, notify_eol: e.target.checked }))} />
              <div>
                <div style={{ fontSize: 12, color: "var(--color-text-primary)", fontWeight: 500 }}>{t("notifEol")}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{t("notifEolDesc")}</div>
              </div>
            </label>
          </div>

          {/* Status */}
          {status && (
            <div style={{
              fontSize: 12, padding: "8px 12px", borderRadius: "var(--border-radius-md)",
              background: status.ok ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
              color: status.ok ? "var(--color-text-success)" : "var(--color-text-danger)",
              border: `0.5px solid ${status.ok ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
            }}>
              {status.msg}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button onClick={handleTest} disabled={testing || !config.webhook_url} style={{
              fontSize: 12, fontWeight: 600, padding: "7px 14px", borderRadius: "var(--border-radius-md)",
              background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)",
              color: "var(--color-text-secondary)", cursor: config.webhook_url ? "pointer" : "default",
              opacity: config.webhook_url ? 1 : 0.5,
            }}>
              {testing ? "..." : t("notifTest")}
            </button>
            <button onClick={handleSave} disabled={saving} style={{
              fontSize: 12, fontWeight: 600, padding: "7px 18px", borderRadius: "var(--border-radius-md)",
              background: "#3b82f6", border: "none", color: "#fff", cursor: "pointer",
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? "..." : t("notifSave")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
