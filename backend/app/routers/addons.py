from fastapi import APIRouter
from kubernetes import client
from app.services.k8s import get_core_v1, get_apps_v1
from app.services.eks import get_cluster_info, NEXT_VERSION
from app.services.compatibility import check_compat, ADDON_META
from app.models.addon import Addon

router = APIRouter()

# Rename map: deployment/daemonset name → canonical addon name
# Used only to normalise names — NOT required for discovery
ADDON_NAME_MAP: dict[str, str] = {
    # AWS / kube-system
    "aws-node": "vpc-cni",
    "coredns": "coredns",
    "kube-proxy": "kube-proxy",
    "aws-load-balancer-controller": "aws-load-balancer-controller",
    "cluster-autoscaler": "cluster-autoscaler",
    "ebs-csi-controller": "ebs-csi-driver",
    "ebs-csi-node": "ebs-csi-driver",
    "ebs-csi-node-windows": "ebs-csi-driver",
    "aws-ebs-csi-driver": "ebs-csi-driver",
    "metrics-server": "metrics-server",
    # ArgoCD — todos os sub-componentes agrupados
    "argocd-server": "argocd",
    "argocd-dex-server": "argocd",
    "argocd-redis": "argocd",
    "argocd-repo-server": "argocd",
    "argocd-notifications-controller": "argocd",
    "argocd-applicationset-controller": "argocd",
    "argocd-image-updater": "argocd",
    # Argo Workflows
    "argo-workflows-server": "argo-workflows",
    "argo-workflows-workflow-controller": "argo-workflows",
    # cert-manager — sub-componentes agrupados
    "cert-manager": "cert-manager",
    "cert-manager-cainjector": "cert-manager",
    "cert-manager-webhook": "cert-manager",
    "cert-manager-controller": "cert-manager",
    # Observabilidade
    "grafana": "grafana",
    "kiali": "kiali",
    "prometheus-server": "prometheus",
    "jaeger": "jaeger",
    # Outros
    "external-dns": "external-dns",
    "ingress-nginx-controller": "ingress-nginx",
    "nginx-ingress-controller": "ingress-nginx",
    "karpenter": "karpenter",
    "keda-operator": "keda",
    "velero": "velero",
    "sealed-secrets-controller": "sealed-secrets",
    "reloader": "reloader",
    "descheduler": "descheduler",
    "palantir-eks-dashboard": "palantir",
}

# Namespaces scanned fully (every deployment/daemonset is treated as an addon)
ADDON_NAMESPACES: set[str] = {
    "kube-system",
    "monitoring", "observability", "logging",
    "cert-manager",
    "external-dns",
    "ingress-nginx", "nginx-ingress", "ingress",
    "argocd", "argo-cd", "argo",
    "istio-system", "linkerd", "linkerd-viz",
    "jaeger",
    "elastic-system",
    "grafana", "prometheus", "loki", "tempo",
    "kyverno", "gatekeeper-system",
    "falco", "trivy-system",
    "karpenter",
    "keda",
    "velero",
    "sealed-secrets",
    "reloader",
    "descheduler",
    "eks-dashboard",
}

# Deployment/DaemonSet names that are Kubernetes internals — never show as addons
SKIP_NAMES: set[str] = {
    "kube-dns", "kindnet", "local-path-provisioner",
    "event-exporter", "konnectivity-agent", "konnectivity-server",
    "node-problem-detector", "calico-kube-controllers", "calico-node",
    "speaker", "controller", "default-http-backend",
}


def _extract_version(image: str) -> str:
    tag = image.split(":")[-1]
    return tag if tag and tag != image else "unknown"


def _discover_addons() -> list[dict]:
    """
    Auto-discovery: scans ADDON_NAMESPACES entirely + uses ADDON_NAME_MAP to
    rename known deployments. Unknown namespaces only yield mapped names.
    """
    core = get_core_v1()
    apps = get_apps_v1()
    found: dict[str, dict] = {}

    try:
        all_namespaces = [ns.metadata.name for ns in core.list_namespace().items]
    except Exception:
        all_namespaces = list(ADDON_NAMESPACES)

    def _record_ds(ds, ns: str):
        raw_name = ds.metadata.name
        if raw_name in SKIP_NAMES:
            return
        # Decide if we should include this deployment
        canonical = ADDON_NAME_MAP.get(raw_name)
        if canonical is None:
            if ns not in ADDON_NAMESPACES:
                return          # Unknown namespace + not in map → skip (user apps)
            canonical = raw_name  # Auto-discover with original name
        if canonical in found:
            return
        containers = ds.spec.template.spec.containers or []
        version = _extract_version(containers[0].image) if containers else "unknown"
        s = ds.status
        avail = s.number_available or 0
        desired = s.desired_number_scheduled or 0
        found[canonical] = {
            "name": canonical, "version": version, "namespace": ns,
            "healthy": avail > 0 and (s.number_unavailable or 0) == 0,
            "replicas_available": avail, "replicas_desired": desired,
        }

    def _record_dep(dep, ns: str):
        raw_name = dep.metadata.name
        if raw_name in SKIP_NAMES:
            return
        canonical = ADDON_NAME_MAP.get(raw_name)
        if canonical is None:
            if ns not in ADDON_NAMESPACES:
                return
            canonical = raw_name
        if canonical in found:
            return
        containers = dep.spec.template.spec.containers or []
        version = _extract_version(containers[0].image) if containers else "unknown"
        s = dep.status
        desired_r = dep.spec.replicas or 1
        avail_r = s.available_replicas or 0
        found[canonical] = {
            "name": canonical, "version": version, "namespace": ns,
            "healthy": avail_r >= desired_r,
            "replicas_available": avail_r, "replicas_desired": desired_r,
        }

    for ns in all_namespaces:
        try:
            for ds in apps.list_namespaced_daemon_set(namespace=ns).items:
                _record_ds(ds, ns)
        except Exception:
            pass
        try:
            for dep in apps.list_namespaced_deployment(namespace=ns).items:
                _record_dep(dep, ns)
        except Exception:
            pass

    return list(found.values())


@router.get("/", response_model=list[Addon])
def list_addons():
    cluster = get_cluster_info()
    current_ver = cluster.version
    next_ver = NEXT_VERSION.get(current_ver, current_ver)

    result = []
    for raw in _discover_addons():
        name = raw["name"]
        version = raw["version"]

        compat_current, _, _ = check_compat(name, version, current_ver)
        compat_next, req_ver_next, action_type = check_compat(name, version, next_ver)

        meta = ADDON_META.get(name, {})

        result.append(Addon(
            name=name,
            version=version,
            namespace=raw["namespace"],
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
