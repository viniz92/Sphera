from pydantic import BaseModel
from typing import Optional


class NodeGroup(BaseModel):
    name: str
    instance_type: Optional[str] = None
    desired: int = 0
    min_size: int = 0
    max_size: int = 0
    status: Optional[str] = None


class UpgradeStep(BaseModel):
    version: str
    addons_to_update: list[dict] = []


class ClusterInfo(BaseModel):
    name: str
    version: str
    next_version: str
    region: str
    endpoint: Optional[str] = None
    status: Optional[str] = None
    node_count: int
    node_groups: list[NodeGroup] = []
    release_date: Optional[str] = None
    eol_date: Optional[str] = None
    eol_days_remaining: Optional[int] = None
    eol_percent_elapsed: Optional[int] = None
    upgrade_path: list[UpgradeStep] = []
