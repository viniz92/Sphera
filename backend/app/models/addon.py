from pydantic import BaseModel
from typing import Optional, Literal


class AddonAccess(BaseModel):
    type: Literal["ingress", "loadbalancer", "portforward", "none"]
    url: Optional[str] = None
    pf_cmd: Optional[str] = None
    tls: Optional[bool] = None


class Addon(BaseModel):
    name: str
    version: str
    namespace: str
    compat_current: Literal["ok", "upd", "incompat"]
    compat_next: Literal["ok", "upd", "incompat"]
    required_version_next: Optional[str] = None
    action_type: Optional[Literal["warn", "danger"]] = None
    has_ui: bool = False
    access: Optional[AddonAccess] = None
    maintainer: Optional[str] = None
    category: Optional[str] = None
    update_freq: Optional[str] = None
    doc_url: Optional[str] = None
    changelog_url: Optional[str] = None
    github_url: Optional[str] = None
    description: Optional[str] = None
    healthy: Optional[bool] = None
