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
