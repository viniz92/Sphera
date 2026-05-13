from pydantic import BaseModel
from typing import Optional


class NodeGroupCost(BaseModel):
    name: str
    instance_type: str
    node_count: int
    hourly_rate_per_instance: float
    hourly_total: float
    monthly_estimate: float
    pricing_note: Optional[str] = None


class ClusterCosts(BaseModel):
    eks_hourly: float
    eks_monthly: float
    ec2_hourly: float
    ec2_monthly: float
    total_hourly: float
    total_monthly: float
    node_groups: list[NodeGroupCost]
    currency: str = "USD"
    disclaimer: str
