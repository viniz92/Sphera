from fastapi import APIRouter
from app.services.k8s import get_core_v1

router = APIRouter()


@router.get("/releases")
def list_helm_releases():
    """Lista todos os Helm releases deployados no cluster lendo os secrets do K8s."""
    try:
        core = get_core_v1()
        secrets = core.list_secret_for_all_namespaces(label_selector="owner=helm")
    except Exception:
        return []

    latest: dict[str, dict] = {}
    for s in secrets.items:
        labels = s.metadata.labels or {}
        if labels.get("status") != "deployed":
            continue
        name = labels.get("name", "")
        namespace = s.metadata.namespace
        chart = labels.get("chart", "")
        version = int(labels.get("version", "1"))
        key = f"{namespace}/{name}"
        if key not in latest or version > latest[key]["version"]:
            latest[key] = {
                "name": name,
                "namespace": namespace,
                "chart": chart,
                "revision": version,
                "status": labels.get("status", "unknown"),
            }

    return sorted(latest.values(), key=lambda x: x["name"])
