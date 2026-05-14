from datetime import datetime, timezone
from fastapi import APIRouter
from kubernetes import client as k8s_client
from app.services.k8s import get_core_v1, get_k8s_client
from app.models.metrics import NodeMetrics, PodInfo

router = APIRouter()

# Statuses that indicate a pod is healthy (don't flag as problematic)
_OK_STATUSES = {"Running", "Succeeded", "Completed"}

# Container waiting reasons that indicate a real problem
_BAD_REASONS = {"CrashLoopBackOff", "OOMKilled", "Error", "ImagePullBackOff", "ErrImagePull", "CreateContainerError"}


def _parse_cpu(cpu: str) -> float:
    if cpu.endswith("n"):
        return int(cpu[:-1]) / 1_000_000
    elif cpu.endswith("m"):
        return float(cpu[:-1])
    try:
        return float(cpu) * 1000
    except Exception:
        return 0


def _parse_memory_mib(mem: str) -> float:
    if mem.endswith("Ki"):
        return int(mem[:-2]) / 1024
    elif mem.endswith("Mi"):
        return float(mem[:-2])
    elif mem.endswith("Gi"):
        return float(mem[:-2]) * 1024
    elif mem.endswith("Ti"):
        return float(mem[:-2]) * 1024 * 1024
    try:
        return float(mem) / (1024 * 1024)
    except Exception:
        return 0


@router.get("/nodes", response_model=list[NodeMetrics])
def node_metrics():
    result = []
    try:
        core = get_core_v1()
        capacity_map: dict[str, tuple[float, float]] = {}
        for node in core.list_node().items:
            alloc = node.status.allocatable or {}
            cpu_cap = _parse_cpu(alloc.get("cpu", "0"))
            mem_cap = _parse_memory_mib(alloc.get("memory", "0Ki"))
            capacity_map[node.metadata.name] = (cpu_cap, mem_cap)

        custom = k8s_client.CustomObjectsApi(get_k8s_client())
        metrics_list = custom.list_cluster_custom_object("metrics.k8s.io", "v1beta1", "nodes")

        for item in metrics_list.get("items", []):
            name = item["metadata"]["name"]
            usage = item.get("usage", {})
            cpu_use = _parse_cpu(usage.get("cpu", "0"))
            mem_use = _parse_memory_mib(usage.get("memory", "0Ki"))
            cpu_cap, mem_cap = capacity_map.get(name, (0, 0))
            result.append(NodeMetrics(
                name=name,
                cpu_millicores=int(cpu_use),
                memory_mib=int(mem_use),
                cpu_capacity_millicores=int(cpu_cap),
                memory_capacity_mib=int(mem_cap),
                cpu_percent=round(cpu_use / cpu_cap * 100, 1) if cpu_cap > 0 else None,
                memory_percent=round(mem_use / mem_cap * 100, 1) if mem_cap > 0 else None,
            ))
    except Exception:
        pass
    return result


@router.get("/pods", response_model=list[PodInfo])
def pod_metrics():
    result = []
    try:
        core = get_core_v1()
        now = datetime.now(timezone.utc)

        # Pod metrics from metrics-server
        metrics_map: dict[tuple[str, str], tuple[int, int]] = {}
        try:
            custom = k8s_client.CustomObjectsApi(get_k8s_client())
            ml = custom.list_cluster_custom_object("metrics.k8s.io", "v1beta1", "pods")
            for item in ml.get("items", []):
                ns = item["metadata"]["namespace"]
                name = item["metadata"]["name"]
                containers = item.get("containers", [])
                cpu = sum(_parse_cpu(c["usage"]["cpu"]) for c in containers)
                mem = sum(_parse_memory_mib(c["usage"]["memory"]) for c in containers)
                metrics_map[(ns, name)] = (int(cpu), int(mem))
        except Exception:
            pass

        for pod in core.list_pod_for_all_namespaces().items:
            ns = pod.metadata.namespace
            name = pod.metadata.name
            phase = pod.status.phase or "Unknown"

            status = phase
            restarts = 0
            containers_ready = 0
            containers_total = 0

            for cs in (pod.status.container_statuses or []):
                containers_total += 1
                if cs.ready:
                    containers_ready += 1
                restarts += cs.restart_count or 0
                # Detect bad waiting state
                if cs.state and cs.state.waiting and cs.state.waiting.reason in _BAD_REASONS:
                    status = cs.state.waiting.reason
                # Detect OOMKilled from last state
                elif cs.last_state and cs.last_state.terminated and cs.state and cs.state.waiting:
                    if cs.last_state.terminated.reason == "OOMKilled":
                        status = "OOMKilled"

            if status == "Running" and containers_ready < containers_total:
                status = "NotReady"

            age_seconds = 0
            if pod.metadata.creation_timestamp:
                age_seconds = int((now - pod.metadata.creation_timestamp).total_seconds())

            cpu_m, mem_mib = metrics_map.get((ns, name), (None, None))

            result.append(PodInfo(
                name=name, namespace=ns, status=status,
                restarts=restarts, age_seconds=age_seconds,
                node_name=pod.spec.node_name,
                cpu_millicores=cpu_m, memory_mib=mem_mib,
                containers_ready=containers_ready, containers_total=containers_total,
            ))

        # Problematic pods first, then by namespace/name
        result.sort(key=lambda p: (p.status in _OK_STATUSES, p.namespace, p.name))
    except Exception:
        pass
    return result


@router.get("/addons")
def addon_metrics():
    """Agrega CPU e memória por namespace de addon."""
    try:
        custom = k8s_client.CustomObjectsApi(get_k8s_client())
        result = custom.list_cluster_custom_object(
            group="metrics.k8s.io",
            version="v1beta1",
            plural="pods",
        )
    except Exception:
        return []

    # Agrega por namespace
    ns_totals: dict[str, dict] = {}
    for item in result.get("items", []):
        ns = item["metadata"]["namespace"]
        for c in item.get("containers", []):
            cpu_str = c.get("usage", {}).get("cpu", "0")
            mem_str = c.get("usage", {}).get("memory", "0")
            cpu_m = _parse_cpu(cpu_str)
            mem_mi = _parse_memory_mib(mem_str)
            if ns not in ns_totals:
                ns_totals[ns] = {"cpu_millicores": 0, "memory_mib": 0}
            ns_totals[ns]["cpu_millicores"] += cpu_m
            ns_totals[ns]["memory_mib"] += mem_mi

    return [{"namespace": ns, **vals} for ns, vals in ns_totals.items()]
