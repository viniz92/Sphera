import os
import time
import httpx

# Runtime config — initialized from env vars, can be overridden via API
_config: dict = {
    "webhook_url": os.getenv("WEBHOOK_URL", ""),
    "eol_threshold_days": int(os.getenv("WEBHOOK_EOL_THRESHOLD_DAYS", "90")),
    "notify_new_version": True,
    "notify_eol": True,
}

_last_sent: dict[str, float] = {}
_COOLDOWN = 24 * 3600


def get_config() -> dict:
    return dict(_config)


def update_config(data: dict):
    if "webhook_url" in data:
        _config["webhook_url"] = data["webhook_url"]
    if "eol_threshold_days" in data:
        _config["eol_threshold_days"] = int(data["eol_threshold_days"])
    if "notify_new_version" in data:
        _config["notify_new_version"] = bool(data["notify_new_version"])
    if "notify_eol" in data:
        _config["notify_eol"] = bool(data["notify_eol"])


def _should_send(key: str) -> bool:
    return (time.time() - _last_sent.get(key, 0)) > _COOLDOWN


def _mark_sent(key: str):
    _last_sent[key] = time.time()


def _send(webhook_url: str, text: str, color: str = "#4A7FD4") -> bool:
    try:
        r = httpx.post(
            webhook_url,
            json={"attachments": [{"color": color, "text": text, "mrkdwn_in": ["text"]}]},
            timeout=8,
        )
        return r.status_code < 300
    except Exception:
        return False


def send_test(webhook_url: str) -> bool:
    return _send(
        webhook_url,
        ":white_check_mark: *Sphēra — Notificações configuradas com sucesso!*\n"
        "Este é um teste de integração do webhook. Você receberá alertas aqui para:\n"
        "• Nova versão EKS disponível\n"
        "• Suporte da versão atual próximo do fim",
        color="#4A7FD4",
    )


def check_and_notify(info: dict):
    url = _config.get("webhook_url", "")
    if not url:
        return

    version = info.get("version", "")
    next_version = info.get("next_version", "")
    eol_days = info.get("eol_days_remaining") or 9999
    eol_date = info.get("eol_date", "")
    name = info.get("name", "cluster")
    threshold = _config.get("eol_threshold_days", 90)

    if _config.get("notify_new_version") and next_version and next_version != version:
        key = f"new_version_{next_version}"
        if _should_send(key):
            _send(
                url,
                f":rocket: *Nova versão EKS disponível!*\n"
                f"Cluster: `{name}` | Atual: `{version}` → Disponível: `{next_version}`\n"
                f"Acesse o Sphēra para planejar o upgrade.",
                color="#4A7FD4",
            )
            _mark_sent(key)

    if _config.get("notify_eol") and 0 < eol_days <= threshold:
        key = f"eol_warning_{version}_{eol_days // 7}"
        if _should_send(key):
            color = "#FF4444" if eol_days < 30 else "#FF8C00"
            urgency = "CRÍTICO" if eol_days < 30 else "ATENÇÃO"
            icon = "rotating_light" if eol_days < 30 else "warning"
            _send(
                url,
                f":{icon}: *[{urgency}] Suporte EKS expirando!*\n"
                f"Cluster: `{name}` | Versão: `{version}`\n"
                f"Fim do suporte: `{eol_date}` — *{eol_days} dias restantes*\n"
                f"Atualize para `{next_version}` em breve.",
                color=color,
            )
            _mark_sent(key)
