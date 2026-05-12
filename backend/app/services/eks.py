import boto3
from datetime import date, datetime
from app.services.k8s import get_cluster_name, get_region_from_kubeconfig
from app.models.cluster import ClusterInfo, NodeGroup, UpgradeStep
from app.services.compatibility import check_compat

# Datas de suporte padrão (gratuito) por versão do EKS
# Fonte: https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html
# eol = fim do suporte padrão (free). Suporte estendido (pago) dura +12 meses após esta data.
EKS_LIFECYCLE: dict[str, dict] = {
    "1.24": {"release": "2022-11-15", "eol": "2024-01-31"},
    "1.25": {"release": "2023-02-22", "eol": "2024-05-01"},
    "1.26": {"release": "2023-04-11", "eol": "2024-06-11"},
    "1.27": {"release": "2023-07-25", "eol": "2024-07-01"},
    "1.28": {"release": "2023-11-16", "eol": "2025-03-26"},
    "1.29": {"release": "2024-01-23", "eol": "2025-07-01"},
    "1.30": {"release": "2024-05-23", "eol": "2025-07-23"},
    "1.31": {"release": "2024-09-25", "eol": "2025-11-26"},
    "1.32": {"release": "2025-01-23", "eol": "2026-03-23"},
    "1.33": {"release": "2025-04-24", "eol": "2026-07-29"},
    "1.34": {"release": "2025-08-01", "eol": "2026-12-02"},
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
        scaling = ng_data.get("scalingConfig", {})
        desired = scaling.get("desiredSize", 0)
        instance_types = ng_data.get("instanceTypes", [])
        node_groups.append(NodeGroup(
            name=ng_name,
            instance_type=instance_types[0] if instance_types else None,
            desired=desired,
            min_size=scaling.get("minSize", 0),
            max_size=scaling.get("maxSize", 0),
            status=ng_data.get("status"),
        ))
        total_nodes += desired

    upgrade_path = _build_upgrade_path(version, next_ver)

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
        upgrade_path=upgrade_path,
    )


def _build_upgrade_path(current_ver: str, next_ver: str) -> list[UpgradeStep]:
    from app.services.k8s import get_apps_v1, get_core_v1
    from app.routers.addons import ADDON_NAME_MAP, _extract_version

    steps = []
    ver = current_ver
    target = next_ver

    while ver != target:
        nxt = NEXT_VERSION.get(ver, target)
        addons_to_update = []

        try:
            apps = get_apps_v1()
            core = get_core_v1()
            found = {}

            for ns in ["kube-system", "default"]:
                try:
                    for ds in apps.list_namespaced_daemon_set(namespace=ns).items:
                        canonical = ADDON_NAME_MAP.get(ds.metadata.name)
                        if canonical and canonical not in found:
                            containers = ds.spec.template.spec.containers
                            found[canonical] = _extract_version(containers[0].image) if containers else "unknown"
                except Exception:
                    pass

            all_ns = [n.metadata.name for n in core.list_namespace().items]
            for ns in all_ns:
                try:
                    for dep in apps.list_namespaced_deployment(namespace=ns).items:
                        canonical = ADDON_NAME_MAP.get(dep.metadata.name)
                        if canonical and canonical not in found:
                            containers = dep.spec.template.spec.containers
                            found[canonical] = _extract_version(containers[0].image) if containers else "unknown"
                except Exception:
                    pass

            for name, addon_ver in found.items():
                status, req_ver, action_type = check_compat(name, addon_ver, nxt)
                if status != "ok" and req_ver:
                    addons_to_update.append({
                        "name": name,
                        "current_version": addon_ver,
                        "required_version": req_ver,
                        "action_type": action_type,
                    })
        except Exception:
            pass

        steps.append(UpgradeStep(version=nxt, addons_to_update=addons_to_update))
        ver = nxt
        if ver == target:
            break

    return steps
