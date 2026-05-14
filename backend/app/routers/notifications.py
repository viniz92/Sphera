from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.notifications import get_config, update_config, send_test

router = APIRouter()


class NotifConfig(BaseModel):
    webhook_url: str = ""
    eol_threshold_days: int = 90
    notify_new_version: bool = True
    notify_eol: bool = True


@router.get("/config")
def get_notif_config():
    return get_config()


@router.post("/config")
def save_notif_config(body: NotifConfig):
    update_config(body.model_dump())
    return {"ok": True}


@router.post("/test")
def test_notification(body: NotifConfig):
    if not body.webhook_url:
        raise HTTPException(status_code=400, detail="webhook_url é obrigatório")
    ok = send_test(body.webhook_url)
    if not ok:
        raise HTTPException(status_code=502, detail="Falha ao enviar notificação. Verifique a URL do webhook.")
    return {"ok": True}
