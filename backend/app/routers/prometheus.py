import os
import time
import httpx
from fastapi import APIRouter
from pydantic import BaseModel

PROMETHEUS_URL = os.getenv("PROMETHEUS_URL", "http://prometheus-server.monitoring.svc.cluster.local")

router = APIRouter()


class MetricPoint(BaseModel):
    t: int
    v: float


class NodeSeries(BaseModel):
    node: str
    points: list[MetricPoint]


class NodeCharts(BaseModel):
    cpu:        list[NodeSeries]
    memory:     list[NodeSeries]
    net_rx:     list[NodeSeries]
    net_tx:     list[NodeSeries]
    disk_read:  list[NodeSeries]
    disk_write: list[NodeSeries]


def _clean_node(instance: str) -> str:
    return instance.split(":")[0]


def _range_query(query: str, hours: float = 1.0, step: int = 60) -> list[dict]:
    end = int(time.time())
    start = end - int(hours * 3600)
    try:
        r = httpx.get(
            f"{PROMETHEUS_URL}/api/v1/query_range",
            params={"query": query, "start": start, "end": end, "step": step},
            timeout=10.0,
        )
        r.raise_for_status()
        return r.json().get("data", {}).get("result", [])
    except Exception:
        return []


def _to_series(results: list[dict]) -> list[NodeSeries]:
    series = []
    for r in results:
        node = _clean_node(r.get("metric", {}).get("instance", "unknown"))
        points = []
        for ts, val in r.get("values", []):
            try:
                points.append(MetricPoint(t=int(ts), v=round(float(val), 3)))
            except Exception:
                pass
        if points:
            series.append(NodeSeries(node=node, points=points))
    return series


@router.get("/nodes/charts", response_model=NodeCharts)
def node_charts(hours: float = 1.0, step: int = 0):
    # Auto step: ~60 data points regardless of range
    if step <= 0:
        step = max(1, int(hours * 3600 / 60))
    # Rate window: 2× step, minimum 30s
    rate_w = f"{max(30, step * 2)}s"
    return NodeCharts(
        cpu=_to_series(_range_query(
            f'100 - (avg by (instance) (rate(node_cpu_seconds_total{{mode="idle"}}[{rate_w}])) * 100)',
            hours=hours, step=step,
        )),
        memory=_to_series(_range_query(
            '100 * (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes))',
            hours=hours, step=step,
        )),
        net_rx=_to_series(_range_query(
            f'sum by (instance) (rate(node_network_receive_bytes_total{{device!~"lo|veth.*|docker.*|cni.*|flannel.*"}}[{rate_w}]))',
            hours=hours, step=step,
        )),
        net_tx=_to_series(_range_query(
            f'sum by (instance) (rate(node_network_transmit_bytes_total{{device!~"lo|veth.*|docker.*|cni.*|flannel.*"}}[{rate_w}]))',
            hours=hours, step=step,
        )),
        disk_read=_to_series(_range_query(
            f'sum by (instance) (rate(node_disk_read_bytes_total[{rate_w}]))',
            hours=hours, step=step,
        )),
        disk_write=_to_series(_range_query(
            f'sum by (instance) (rate(node_disk_written_bytes_total[{rate_w}]))',
            hours=hours, step=step,
        )),
    )
