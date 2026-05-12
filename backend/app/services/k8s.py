import os
import yaml
import tempfile
from kubernetes import client, config
from fastapi import HTTPException

_k8s_client: client.ApiClient | None = None
_cluster_name: str | None = None
_region: str | None = None
_in_cluster: bool = False


def init_in_cluster():
    """
    Inicializa a conexão usando a ServiceAccount do pod.
    Chamado automaticamente quando RUNNING_IN_CLUSTER=true.
    Não precisa de kubeconfig — usa o token montado pelo Kubernetes.
    """
    global _k8s_client, _in_cluster
    config.load_incluster_config()
    _k8s_client = client.ApiClient()
    _in_cluster = True


def load_kubeconfig_from_bytes(content: bytes) -> dict:
    """
    Recebe o kubeconfig em bytes, valida e conecta.
    Usado apenas no modo local (fora do cluster).
    """
    global _k8s_client, _cluster_name, _region, _in_cluster

    try:
        parsed = yaml.safe_load(content)
    except yaml.YAMLError as e:
        raise HTTPException(status_code=400, detail=f"Kubeconfig inválido: {e}")

    if "clusters" not in parsed or "contexts" not in parsed:
        raise HTTPException(status_code=400, detail="Arquivo não parece ser um kubeconfig válido.")

    with tempfile.NamedTemporaryFile(mode="w", suffix=".yaml", delete=False) as tmp:
        yaml.dump(parsed, tmp)
        tmp_path = tmp.name

    try:
        config.load_kube_config(config_file=tmp_path)
        _k8s_client = client.ApiClient()
        _in_cluster = False
    finally:
        os.unlink(tmp_path)

    current = parsed.get("current-context")
    for ctx in parsed.get("contexts", []):
        if ctx["name"] == current:
            cluster_ref = ctx["context"].get("cluster", "")
            _cluster_name = cluster_ref.split("/")[-1] if "/" in cluster_ref else cluster_ref

    for cluster in parsed.get("clusters", []):
        server = cluster.get("cluster", {}).get("server", "")
        parts = server.split(".")
        for p in parts:
            if any(p.startswith(r) for r in ["us-", "eu-", "ap-", "sa-", "ca-", "me-", "af-"]):
                _region = p
                break

    return parsed


def is_in_cluster() -> bool:
    return _in_cluster


def get_k8s_client() -> client.ApiClient:
    if _k8s_client is None:
        if os.getenv("RUNNING_IN_CLUSTER") == "true":
            init_in_cluster()
        else:
            raise HTTPException(
                status_code=400,
                detail="Nenhum kubeconfig carregado. Faça upload primeiro."
            )
    return _k8s_client


def get_core_v1() -> client.CoreV1Api:
    return client.CoreV1Api(get_k8s_client())


def get_apps_v1() -> client.AppsV1Api:
    return client.AppsV1Api(get_k8s_client())


def get_networking_v1() -> client.NetworkingV1Api:
    return client.NetworkingV1Api(get_k8s_client())


def get_cluster_name() -> str:
    if _cluster_name:
        return _cluster_name
    try:
        core = get_core_v1()
        cm = core.read_namespaced_config_map("cluster-info", "kube-system")
        data = yaml.safe_load(cm.data.get("kubeconfig", "{}"))
        clusters = data.get("clusters", [])
        if clusters:
            name = clusters[0].get("name", "unknown")
            return name.split("/")[-1] if "/" in name else name
    except Exception:
        pass
    return os.getenv("CLUSTER_NAME") or os.getenv("POD_NAMESPACE", "unknown-cluster")


def get_region_from_kubeconfig() -> str:
    if _region:
        return _region
    return os.getenv("AWS_DEFAULT_REGION", "us-east-1")
