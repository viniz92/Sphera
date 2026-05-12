from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.auth import login, logout

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def do_login(body: LoginRequest):
    token = login(body.username, body.password)
    if not token:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    return {"token": token}


@router.post("/logout")
def do_logout(body: dict):
    logout(body.get("token", ""))
    return {"ok": True}
