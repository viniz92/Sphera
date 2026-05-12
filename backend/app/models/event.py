from pydantic import BaseModel
from typing import Optional


class ClusterEvent(BaseModel):
    namespace: str
    reason: str
    message: str
    object_kind: str
    object_name: str
    count: int = 1
    last_seen: Optional[str] = None
