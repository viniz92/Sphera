from fastapi import APIRouter
from app.services.eks import get_cluster_info
from app.models.costs import ClusterCosts, NodeGroupCost

router = APIRouter()

# On-demand Linux prices (USD/hour) — us-east-1 reference, updated 2025
# Source: https://aws.amazon.com/ec2/pricing/on-demand/
INSTANCE_PRICING: dict[str, float] = {
    # T3
    "t3.nano": 0.0052, "t3.micro": 0.0104, "t3.small": 0.0208,
    "t3.medium": 0.0416, "t3.large": 0.0832, "t3.xlarge": 0.1664, "t3.2xlarge": 0.3328,
    # T3a (AMD)
    "t3a.nano": 0.0047, "t3a.micro": 0.0094, "t3a.small": 0.0188,
    "t3a.medium": 0.0376, "t3a.large": 0.0752, "t3a.xlarge": 0.1504, "t3a.2xlarge": 0.3008,
    # M5
    "m5.large": 0.096, "m5.xlarge": 0.192, "m5.2xlarge": 0.384,
    "m5.4xlarge": 0.768, "m5.8xlarge": 1.536, "m5.12xlarge": 2.304, "m5.16xlarge": 3.072,
    # M5a (AMD)
    "m5a.large": 0.086, "m5a.xlarge": 0.172, "m5a.2xlarge": 0.344, "m5a.4xlarge": 0.688,
    # M6i (Intel 3rd gen)
    "m6i.large": 0.096, "m6i.xlarge": 0.192, "m6i.2xlarge": 0.384,
    "m6i.4xlarge": 0.768, "m6i.8xlarge": 1.536,
    # M6g (Graviton2)
    "m6g.medium": 0.0385, "m6g.large": 0.077, "m6g.xlarge": 0.154,
    "m6g.2xlarge": 0.308, "m6g.4xlarge": 0.616, "m6g.8xlarge": 1.232,
    "m6g.12xlarge": 1.848, "m6g.16xlarge": 2.464,
    # M7g (Graviton3)
    "m7g.medium": 0.0408, "m7g.large": 0.0816, "m7g.xlarge": 0.1632,
    "m7g.2xlarge": 0.3264, "m7g.4xlarge": 0.6528, "m7g.8xlarge": 1.3056,
    # C5
    "c5.large": 0.085, "c5.xlarge": 0.17, "c5.2xlarge": 0.34,
    "c5.4xlarge": 0.68, "c5.9xlarge": 1.53, "c5.18xlarge": 3.06,
    # C6g (Graviton2)
    "c6g.large": 0.068, "c6g.xlarge": 0.136, "c6g.2xlarge": 0.272,
    "c6g.4xlarge": 0.544, "c6g.8xlarge": 1.088,
    # R5
    "r5.large": 0.126, "r5.xlarge": 0.252, "r5.2xlarge": 0.504,
    "r5.4xlarge": 1.008, "r5.8xlarge": 2.016,
    # R6g (Graviton2)
    "r6g.large": 0.1008, "r6g.xlarge": 0.2016, "r6g.2xlarge": 0.4032,
    "r6g.4xlarge": 0.8064, "r6g.8xlarge": 1.6128,
    # P3 / GPU
    "p3.2xlarge": 3.06, "p3.8xlarge": 12.24, "p3.16xlarge": 24.48,
    # G4dn
    "g4dn.xlarge": 0.526, "g4dn.2xlarge": 0.752, "g4dn.4xlarge": 1.204,
}

EKS_CLUSTER_HOURLY = 0.10  # Fixed $0.10/h per cluster regardless of size
HOURS_PER_MONTH = 730


def _get_rate(instance_type: str) -> tuple[float, str]:
    rate = INSTANCE_PRICING.get(instance_type)
    if rate is not None:
        return rate, "on-demand"
    # Fallback: try family match
    family = instance_type.split(".")[0]
    for k, v in INSTANCE_PRICING.items():
        if k.startswith(family + "."):
            return v, "estimated"
    return 0.0, "unknown"


@router.get("/", response_model=ClusterCosts)
def cluster_costs():
    cluster = get_cluster_info()

    ng_costs = []
    ec2_hourly = 0.0

    for ng in cluster.node_groups:
        count = ng.desired or 0
        itype = ng.instance_type or ""
        rate, note = _get_rate(itype)
        hourly_total = rate * count
        ec2_hourly += hourly_total
        ng_costs.append(NodeGroupCost(
            name=ng.name,
            instance_type=itype or "—",
            node_count=count,
            hourly_rate_per_instance=round(rate, 4),
            hourly_total=round(hourly_total, 4),
            monthly_estimate=round(hourly_total * HOURS_PER_MONTH, 2),
            pricing_note=note if note != "on-demand" else None,
        ))

    eks_hourly = EKS_CLUSTER_HOURLY
    total_hourly = round(eks_hourly + ec2_hourly, 4)

    return ClusterCosts(
        eks_hourly=eks_hourly,
        eks_monthly=round(eks_hourly * HOURS_PER_MONTH, 2),
        ec2_hourly=round(ec2_hourly, 4),
        ec2_monthly=round(ec2_hourly * HOURS_PER_MONTH, 2),
        total_hourly=total_hourly,
        total_monthly=round(total_hourly * HOURS_PER_MONTH, 2),
        node_groups=ng_costs,
        disclaimer="Preços on-demand Linux us-east-1. Não inclui EBS, transferência de dados, Spot/RI/SP nem impostos.",
    )
