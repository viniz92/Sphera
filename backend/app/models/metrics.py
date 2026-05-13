from pydantic import BaseModel
from typing import Optional


class NodeMetrics(BaseModel):
    name: str
    cpu_millicores: int
    memory_mib: int
    cpu_capacity_millicores: int = 0
    memory_capacity_mib: int = 0
    cpu_percent: Optional[float] = None
    memory_percent: Optional[float] = None


class PodInfo(BaseModel):
    name: str
    namespace: str
    status: str
    restarts: int = 0
    age_seconds: int = 0
    node_name: Optional[str] = None
    cpu_millicores: Optional[int] = None
    memory_mib: Optional[int] = None
    containers_ready: int = 0
    containers_total: int = 0
