from fastapi import APIRouter
from app.services.k8s import get_core_v1
from app.models.event import ClusterEvent

router = APIRouter()


@router.get("/", response_model=list[ClusterEvent])
def list_events():
    result = []
    try:
        core = get_core_v1()
        events = core.list_event_for_all_namespaces(field_selector="type=Warning")
        items = sorted(
            events.items,
            key=lambda e: e.last_timestamp or e.event_time or "",
            reverse=True,
        )[:60]
        for e in items:
            result.append(ClusterEvent(
                namespace=e.metadata.namespace or "",
                reason=e.reason or "",
                message=(e.message or "")[:200],
                object_kind=e.involved_object.kind or "",
                object_name=e.involved_object.name or "",
                count=e.count or 1,
                last_seen=str(e.last_timestamp) if e.last_timestamp else None,
            ))
    except Exception:
        pass
    return result
