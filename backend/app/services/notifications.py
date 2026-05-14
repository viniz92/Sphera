import os
import time
import httpx

WEBHOOK_URL = os.getenv("WEBHOOK_URL", "")
EOL_THRESHOLD_DAYS = int(os.getenv("WEBHOOK_EOL_THRESHOLD_DAYS", "90"))

_last_sent: dict[str, float] = {}
_COOLDOWN = 24 * 3600


def _should_send(key: str) -> bool:
    return (time.time() - _last_sent.get(key, 0)) > _COOLDOWN


def _mark_sent(key: str):
    _last_sent[key] = time.time()


def _send(text: str, color: str = "#4A7FD4"):
    if not WEBHOOK_URL:
        return
    try:
        httpx.post(
            WEBHOOK_URL,
            json={"attachments": [{"color": color, "text": text, "mrkdwn_in": ["text"]}]},
            timeout=8,
        )
    except Exception:
        pass


def check_and_notify(info: dict):
    if not WEBHOOK_URL:
        return

    version = info.get("version", "")
    next_version = info.get("next_version", "")
    eol_days = info.get("eol_days_remaining") or 9999
    eol_date = info.get("eol_date", "")
    name = info.get("name", "cluster")

    # Nova versão disponível
    if next_version and next_version != version:
        key = f"new_version_{next_version}"
        if _should_send(key):
            _send(
                f":rocket: *Nova versão EKS disponível!*\n"
                f"Cluster: `{name}` | Versão atual: `{version}` → Disponível: `{next_version}`\n"
                f"Acesse o Sphēra para planejar o upgrade.",
                color="#4A7FD4",
            )
            _mark_sent(key)

    # EOL warning — reenvia a cada 7 dias dentro do threshold
    if 0 < eol_days <= EOL_THRESHOLD_DAYS:
        key = f"eol_warning_{version}_{eol_days // 7}"
        if _should_send(key):
            color = "#FF4444" if eol_days < 30 else "#FF8C00"
            urgency = "CRÍTICO" if eol_days < 30 else "ATENÇÃO"
            icon = "rotating_light" if eol_days < 30 else "warning"
            _send(
                f":{icon}: *[{urgency}] Suporte EKS expirando!*\n"
                f"Cluster: `{name}` | Versão: `{version}`\n"
                f"Fim do suporte: `{eol_date}` — *{eol_days} dias restantes*\n"
                f"Atualize para `{next_version}` em breve.",
                color=color,
            )
            _mark_sent(key)
