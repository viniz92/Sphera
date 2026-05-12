import boto3
from datetime import date, datetime
from app.services.k8s import get_cluster_name, get_region_from_kubeconfig
from app.models.cluster import ClusterInfo, NodeGroup

# Datas de release e EOL por versão do EKS
# Fonte: https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html
EKS_LIFECYCLE: dict[str, dict] = {
    "1.24": {"release": "2022-11-15", "eol": "2024-01-31"},
    "1.25": {"release": "2023-02-22", "eol": "2024-05-01"},
    "1.26": {"release": "2023-04-11", "eol": "2024-06-11"},
    "1.27": {"release": "2023-07-25", "eol": "2024-07-01"},
    "1.28": {"release": "2023-11-16", "eol": "2025-11-01"},
    "1.29": {"release": "2024-01-23", "eol": "2026-03-01"},
    "1.30": {"release": "2024-05-23", "eol": "2026-07-01"},
    "1.31": {"release": "2024-09-25", "eol": "2026-10-01"},
    "1.32": {"release": "2025-01-23", "eol": "2027-03-01"},
    "1.33": {"release": "2025-04-24", "eol": "2027-06-01"},
    "1.34": {"release": "2025-08-01", "eol": "2027-10-01"},
}

NEXT_VERSION: dict[str, str] = {
    "1.24": "1.25", "1.25": "1.26", "1.26": "1.27",
    "1.27": "1.28", "1.28": "1.29", "1.29": "1.30",
    "1.30": "1.31", "1.31": "1.32", "1.32": "1.33",
    "1.33": "1.34", "1.34": "1.35",
}


def _days_remaining(eol_str: str) -> int:
    eol = date.fromisoformat(eol_str)
    return max(0, (eol - date.today()).days)


def _percent_elapsed(release_str: str, eol_str: str) -> int:
    release = date.fromisoformat(release_str)
    eol = date.fromisoformat(eol_str)
    today = date.today()
    total = (eol - release).days
    elapsed = (today - release).days
    return min(100, max(0, int(elapsed / total * 100)))


def get_cluster_info() -> ClusterInfo:
    cluster_name = get_cluster_name()
    region = get_region_from_kubeconfig()

    eks = boto3.client("eks", region_name=region)
    ec2 = boto3.client("ec2", region_name=region)

    cluster_data = eks.describe_cluster(name=cluster_name)["cluster"]
    version = cluster_data.get("version", "1.28")
    lifecycle = EKS_LIFECYCLE.get(version, {})
    next_ver = NEXT_VERSION.get(version, str(float(version) + 0.1))

    ng_response = eks.list_nodegroups(clusterName=cluster_name)
    node_groups = []
    total_nodes = 0

    for ng_name in ng_response.get("nodegroups", []):
        ng_data = eks.describe_nodegroup(clusterName=cluster_name, nodegroupName=ng_name)["nodegroup"]
        desired = ng_data.get("scalingConfig", {}).get("desiredSize", 0)
        instance_types = ng_data.get("instanceTypes", [])
        node_groups.append(NodeGroup(
            name=ng_name,
            node_count=desired,
            instance_type=instance_types[0] if instance_types else None,
        ))
        total_nodes += desired

    return ClusterInfo(
        name=cluster_name,
        version=version,
        next_version=next_ver,
        region=region,
        endpoint=cluster_data.get("endpoint"),
        status=cluster_data.get("status"),
        node_count=total_nodes,
        node_groups=node_groups,
        release_date=lifecycle.get("release"),
        eol_date=lifecycle.get("eol"),
        eol_days_remaining=_days_remaining(lifecycle["eol"]) if lifecycle.get("eol") else None,
        eol_percent_elapsed=_percent_elapsed(lifecycle["release"], lifecycle["eol"]) if lifecycle.get("release") and lifecycle.get("eol") else None,
    )
