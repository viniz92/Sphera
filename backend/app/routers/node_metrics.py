from fastapi import APIRouter
from kubernetes import client as k8s_client
from app.services.k8s import get_core_v1, get_k8s_client
from app.models.metrics import NodeMetrics

router = APIRouter()


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
