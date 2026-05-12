from fastapi import APIRouter
from app.services.k8s import get_core_v1, get_networking_v1
from app.models.addon import AddonAccess

router = APIRouter()

# Mapeamento addon → serviço e namespace esperados
ADDON_SERVICE_MAP = {
    "argocd": {"namespace": "argocd", "service": "argocd-server", "port": 443},
    "grafana": {"namespace": "monitoring", "service": "grafana", "port": 80},
    "kiali": {"namespace": "istio-system", "service": "kiali", "port": 20001},
    "prometheus": {"namespace": "monitoring", "service": "prometheus-server", "port": 80},
    "jaeger": {"namespace": "tracing", "service": "jaeger-query", "port": 16686},
    "kubernetes-dashboard": {"namespace": "kubernetes-dashboard", "service": "kubernetes-dashboard", "port": 443},
}


def _detect_ingress(addon_name: str, namespace: str) -> str | None:
    """Verifica se existe um Ingress para o addon e retorna a URL."""
    try:
        net = get_networking_v1()
        ingresses = net.list_namespaced_ingress(namespace=namespace)
        for ing in ingresses.items:
            name = ing.metadata.name or ""
            if addon_name in name:
                rules = ing.spec.rules or []
                for rule in rules:
                    host = rule.host
                    tls = ing.spec.tls
                    scheme = "https" if tls else "http"
                    if host:
                        return f"{scheme}://{host}"
    except Exception:
        pass
    return None


def _detect_loadbalancer(service_name: str, namespace: str, port: int) -> str | None:
    """Verifica se o Service tem EXTERNAL-IP (LoadBalancer) e retorna a URL."""
    try:
        core = get_core_v1()
        svc = core.read_namespaced_service(name=service_name, namespace=namespace)
        if svc.spec.type == "LoadBalancer":
            ingress_list = svc.status.load_balancer.ingress or []
            if ingress_list:
                hostname = ingress_list[0].hostname or ingress_list[0].ip
                if hostname:
                    return f"http://{hostname}:{port}"
    except Exception:
        pass
    return None


@router.get("/{addon_name}", response_model=AddonAccess)
def get_addon_access(addon_name: str):
    """
    Detecta automaticamente como acessar a UI do addon:
    - Ingress com host → URL HTTPS
    - Service LoadBalancer → URL HTTP com aviso
    - Sem exposição → comando port-forward
    """
    mapping = ADDON_SERVICE_MAP.get(addon_name)
    if not mapping:
        return AddonAccess(type="none")

    ns = mapping["namespace"]
    svc = mapping["service"]
    port = mapping["port"]

    # 1. Tenta Ingress
    ingress_url = _detect_ingress(addon_name, ns)
    if ingress_url:
        return AddonAccess(type="ingress", url=ingress_url, tls=ingress_url.startswith("https"))

    # 2. Tenta LoadBalancer
    lb_url = _detect_loadbalancer(svc, ns, port)
    if lb_url:
        return AddonAccess(type="loadbalancer", url=lb_url, tls=False)

    # 3. Sugere port-forward
    pf_cmd = f"kubectl port-forward svc/{svc} {port}:{port} -n {ns}"
    return AddonAccess(type="portforward", pf_cmd=pf_cmd)
