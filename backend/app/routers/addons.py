from fastapi import APIRouter
from kubernetes import client
from app.services.k8s import get_core_v1, get_apps_v1
from app.services.eks import get_cluster_info, NEXT_VERSION
from app.services.compatibility import check_compat, ADDON_META
from app.models.addon import Addon

router = APIRouter()

# Mapeamento de nome de deployment/daemonset → nome canônico do addon
ADDON_NAME_MAP = {
    "aws-node": "vpc-cni",
    "coredns": "coredns",
    "kube-proxy": "kube-proxy",
    "aws-load-balancer-controller": "aws-load-balancer-controller",
    "cluster-autoscaler": "cluster-autoscaler",
    "ebs-csi-controller": "ebs-csi-driver",
    "aws-ebs-csi-driver": "ebs-csi-driver",
    "argocd-server": "argocd",
    "grafana": "grafana",
    "kiali": "kiali",
    "prometheus-server": "prometheus",
    "jaeger": "jaeger",
    "palantir-eks-dashboard": "palantir",
}


def _extract_version(image: str) -> str:
    """Extrai versão da imagem docker. ex: 602401143452.dkr.ecr.us-east-1.amazonaws.com/amazon-k8s-cni:v1.15.1"""
    tag = image.split(":")[-1]
    return tag if tag else "unknown"


def _discover_addons() -> list[dict]:
    """Descobre addons rodando no cluster via DaemonSets e Deployments."""
    core = get_core_v1()
    apps = get_apps_v1()
    found = {}

    # DaemonSets (vpc-cni, kube-proxy)
    for ns in ["kube-system", "default"]:
        try:
            ds_list = apps.list_namespaced_daemon_set(namespace=ns)
            for ds in ds_list.items:
                name = ds.metadata.name
                canonical = ADDON_NAME_MAP.get(name)
                if canonical and canonical not in found:
                    containers = ds.spec.template.spec.containers
                    version = _extract_version(containers[0].image) if containers else "unknown"
                    s = ds.status
                    avail = s.number_available or 0
                    desired = s.desired_number_scheduled or 0
                    found[canonical] = {"name": canonical, "version": version, "namespace": ns,
                        "healthy": avail > 0 and (s.number_unavailable or 0) == 0,
                        "replicas_available": avail, "replicas_desired": desired}
        except Exception:
            pass

    # Deployments (coredns, argocd, grafana, etc.)
    try:
        all_ns = core.list_namespace()
        namespaces = [ns.metadata.name for ns in all_ns.items]
    except Exception:
        namespaces = ["kube-system", "default", "argocd", "monitoring", "istio-system"]

    for ns in namespaces:
        try:
            dep_list = apps.list_namespaced_deployment(namespace=ns)
            for dep in dep_list.items:
                name = dep.metadata.name
                canonical = ADDON_NAME_MAP.get(name)
                if canonical and canonical not in found:
                    containers = dep.spec.template.spec.containers
                    version = _extract_version(containers[0].image) if containers else "unknown"
                    s = dep.status
                    desired_r = dep.spec.replicas or 1
                    avail_r = s.available_replicas or 0
                    found[canonical] = {"name": canonical, "version": version, "namespace": ns,
                        "healthy": avail_r >= desired_r,
                        "replicas_available": avail_r, "replicas_desired": desired_r}
        except Exception:
            pass

    return list(found.values())


@router.get("/", response_model=list[Addon])
def list_addons():
    cluster = get_cluster_info()
    current_ver = cluster.version
    next_ver = NEXT_VERSION.get(current_ver, current_ver)

    raw_addons = _discover_addons()
    result = []

    for raw in raw_addons:
        name = raw["name"]
        version = raw["version"]
        namespace = raw["namespace"]

        compat_current, _, _ = check_compat(name, version, current_ver)
        compat_next, req_ver_next, action_type = check_compat(name, version, next_ver)

        meta = ADDON_META.get(name, {})

        result.append(Addon(
            name=name,
            version=version,
            namespace=namespace,
            compat_current=compat_current,
            compat_next=compat_next,
            required_version_next=req_ver_next,
            action_type=action_type,
            has_ui=meta.get("has_ui", False),
            maintainer=meta.get("maintainer"),
            category=meta.get("category"),
            update_freq=meta.get("update_freq"),
            description=meta.get("description"),
            doc_url=meta.get("doc_url"),
            changelog_url=meta.get("changelog_url"),
            github_url=meta.get("github_url"),
            healthy=raw.get("healthy"),
            replicas_available=raw.get("replicas_available"),
            replicas_desired=raw.get("replicas_desired"),
        ))

    return result
