from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.k8s import get_core_v1, get_k8s_client
from app.routers.node_metrics import _parse_cpu, _parse_memory_mib
from kubernetes import client as k8s_client

router = APIRouter()


class ContainerDetail(BaseModel):
    name: str
    image: str
    ready: bool = False
    restarts: int = 0
    cpu_millicores: Optional[int] = None
    memory_mib: Optional[int] = None
    ports: list[str] = []
    state: str = "unknown"


class PodDetail(BaseModel):
    name: str
    namespace: str
    status: str
    phase: str
    node_name: Optional[str] = None
    pod_ip: Optional[str] = None
    host_ip: Optional[str] = None
    created_at: Optional[str] = None
    labels: dict = {}
    owner_kind: Optional[str] = None
    owner_name: Optional[str] = None
    containers: list[ContainerDetail] = []
    conditions: list[dict] = []
    events: list[dict] = []
    cpu_millicores: Optional[int] = None
    memory_mib: Optional[int] = None


@router.get("/{namespace}/{name}", response_model=PodDetail)
def pod_detail(namespace: str, name: str):
    core = get_core_v1()
    try:
        pod = core.read_namespaced_pod(name=name, namespace=namespace)
    except Exception:
        raise HTTPException(status_code=404, detail="Pod não encontrado")

    phase = pod.status.phase or "Unknown"

    # Owner reference (Deployment, StatefulSet, DaemonSet, Job…)
    owner_kind, owner_name = None, None
    for ref in (pod.metadata.owner_references or []):
        if ref.kind == "ReplicaSet":
            # Try to find parent Deployment
            try:
                apps = k8s_client.AppsV1Api(get_k8s_client())
                rs = apps.read_namespaced_replica_set(ref.name, namespace)
                for rs_ref in (rs.metadata.owner_references or []):
                    if rs_ref.kind == "Deployment":
                        owner_kind = "Deployment"
                        owner_name = rs_ref.name
                        break
            except Exception:
                pass
            if not owner_name:
                owner_kind, owner_name = ref.kind, ref.name
        else:
            owner_kind, owner_name = ref.kind, ref.name
        break

    # Containers
    cs_map = {cs.name: cs for cs in (pod.status.container_statuses or [])}
    containers = []
    for c in (pod.spec.containers or []):
        cs = cs_map.get(c.name)
        state_str = "unknown"
        if cs and cs.state:
            if cs.state.running:    state_str = "running"
            elif cs.state.waiting:  state_str = cs.state.waiting.reason or "waiting"
            elif cs.state.terminated: state_str = cs.state.terminated.reason or "terminated"
        ports = [f"{p.container_port}/{p.protocol or 'TCP'}" for p in (c.ports or [])]
        containers.append(ContainerDetail(
            name=c.name,
            image=c.image or "",
            ready=cs.ready if cs else False,
            restarts=cs.restart_count if cs else 0,
            ports=ports,
            state=state_str,
        ))

    # Conditions
    conditions = []
    for cond in (pod.status.conditions or []):
        conditions.append({
            "type": cond.type,
            "status": cond.status,
            "reason": cond.reason or "",
            "message": cond.message or "",
        })

    # Events for this pod
    events = []
    try:
        ev_list = core.list_namespaced_event(
            namespace=namespace,
            field_selector=f"involvedObject.name={name}",
        )
        for e in sorted(ev_list.items, key=lambda x: x.last_timestamp or "", reverse=True)[:10]:
            events.append({
                "reason": e.reason or "",
                "message": (e.message or "")[:180],
                "type": e.type or "Normal",
                "count": e.count or 1,
                "last_seen": str(e.last_timestamp) if e.last_timestamp else None,
            })
    except Exception:
        pass

    # Container metrics from metrics-server
    try:
        custom = k8s_client.CustomObjectsApi(get_k8s_client())
        pod_metrics = custom.get_namespaced_custom_object(
            "metrics.k8s.io", "v1beta1", namespace, "pods", name
        )
        container_metrics = {c["name"]: c["usage"] for c in pod_metrics.get("containers", [])}
        total_cpu = sum(_parse_cpu(v["cpu"]) for v in container_metrics.values())
        total_mem = sum(_parse_memory_mib(v["memory"]) for v in container_metrics.values())
        for cont in containers:
            if cont.name in container_metrics:
                cont.cpu_millicores = int(_parse_cpu(container_metrics[cont.name]["cpu"]))
                cont.memory_mib = int(_parse_memory_mib(container_metrics[cont.name]["memory"]))
    except Exception:
        total_cpu, total_mem = None, None
    else:
        total_cpu = int(total_cpu) if total_cpu else None
        total_mem = int(total_mem) if total_mem else None

    return PodDetail(
        name=name,
        namespace=namespace,
        status=phase,
        phase=phase,
        node_name=pod.spec.node_name,
        pod_ip=pod.status.pod_ip,
        host_ip=pod.status.host_ip,
        created_at=str(pod.metadata.creation_timestamp) if pod.metadata.creation_timestamp else None,
        labels=pod.metadata.labels or {},
        owner_kind=owner_kind,
        owner_name=owner_name,
        containers=containers,
        conditions=conditions,
        events=events,
        cpu_millicores=total_cpu,
        memory_mib=total_mem,
    )
