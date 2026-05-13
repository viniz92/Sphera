import { useState, useEffect, useId } from "react";
import { fetchNodeCharts } from "../api/client";

const NODE_COLORS = [
  "var(--color-text-info)",    // azul
  "#4ade80",                   // verde
  "#f472b6",                   // rosa
  "#fb923c",                   // laranja
  "#a78bfa",                   // roxo
  "#facc15",                   // amarelo
];

function fmtBytes(v) {
  if (v == null || v < 0) return "—";
  if (v < 1024) return `${v.toFixed(0)} B/s`;
  if (v < 1048576) return `${(v / 1024).toFixed(1)} KB/s`;
  return `${(v / 1048576).toFixed(1)} MB/s`;
}

function fmtPct(v) {
  return v != null ? `${v.toFixed(1)}%` : "—";
}

function shortHost(name) {
  if (!name) return "?";
  return name.replace(/\..*$/, "").replace(/^ip-/, "").replace(/-/g, ".");
}

function MultiLineChart({ seriesList, colors, fmt, height = 110, maxY }) {
  const uid = useId().replace(/:/g, "");
  const width = "100%";
  const W = 100, H = height; // use percentage-based viewBox
  const px = 1, py = 6;
  const IW = W - px * 2, IH = H - py * 2;

  // Find global max for consistent Y scale
  const allVals = seriesList.flatMap(s => (s?.points ?? []).map(p => p.v));
  const globalMax = maxY ?? (allVals.length > 0 ? Math.max(...allVals) : 1) || 1;

  function toPath(points) {
    if (!points || points.length < 2) return null;
    const pts = points.map((p, i) => {
      const x = px + (i / (points.length - 1)) * IW;
      const y = py + IH - (p.v / globalMax) * IH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return pts.join(" ");
  }

  function toArea(points) {
    if (!points || points.length < 2) return null;
    const line = points.map((p, i) => {
      const x = px + (i / (points.length - 1)) * IW;
      const y = py + IH - (p.v / globalMax) * IH;
      return `L${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(" ");
    const x0 = px.toFixed(2), x1 = (px + IW).toFixed(2), yB = (py + IH).toFixed(2);
    return `M${x0},${yB} ${line} L${x1},${yB} Z`;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      <defs>
        {seriesList.map((s, i) => s?.points?.length > 1 && (
          <linearGradient key={i} id={`g-${uid}-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[i % colors.length]} stopOpacity="0.18" />
            <stop offset="100%" stopColor={colors[i % colors.length]} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {/* grid lines */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={px} y1={py + IH * (1 - f)} x2={px + IW} y2={py + IH * (1 - f)}
          stroke="rgba(255,255,255,0.04)" strokeWidth="0.3" />
      ))}
      {/* areas first */}
      {seriesList.map((s, i) => {
        const area = toArea(s?.points);
        return area ? <path key={i} d={area} fill={`url(#g-${uid}-${i})`} /> : null;
      })}
      {/* lines */}
      {seriesList.map((s, i) => {
        const pts = toPath(s?.points);
        return pts ? (
          <polyline key={i} points={pts} fill="none"
            stroke={colors[i % colors.length]} strokeWidth="0.9"
            strokeLinejoin="round" strokeLinecap="round" />
        ) : null;
      })}
      {/* current value dots */}
      {seriesList.map((s, i) => {
        const pts = s?.points;
        if (!pts || pts.length < 2) return null;
        const last = pts[pts.length - 1];
        const x = px + IW;
        const y = py + IH - (last.v / globalMax) * IH;
        return <circle key={i} cx={x.toFixed(2)} cy={y.toFixed(2)} r="1.2" fill={colors[i % colors.length]} />;
      })}
    </svg>
  );
}

function Chart({ title, seriesList, nodeNames, colors, fmt, maxY }) {
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 14px", flex: 1, minWidth: 260 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8 }}>{title}</div>
      <div style={{ borderRadius: 4, overflow: "hidden" }}>
        <MultiLineChart seriesList={seriesList} colors={colors} fmt={fmt} maxY={maxY} />
      </div>
      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginTop: 8 }}>
        {nodeNames.map((name, i) => {
          const pts = seriesList[i]?.points;
          const cur = pts?.length > 0 ? pts[pts.length - 1].v : null;
          return (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 10, height: 3, borderRadius: 2, background: colors[i % colors.length], display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{shortHost(name)}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: colors[i % colors.length] }}>{fmt(cur)}</span>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 9, color: "var(--color-text-tertiary)", marginTop: 4, textAlign: "right" }}>última 1h</div>
    </div>
  );
}

export function NodeCharts() {
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNodeCharts()
      .then(setCharts)
      .catch(() => setError("Prometheus indisponível"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: "0.75rem 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>
      Carregando gráficos do Prometheus...
    </div>
  );
  if (error || !charts) return (
    <div style={{ padding: "0.75rem 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>{error ?? "Dados indisponíveis"}</div>
  );

  // Collect all node names across all metrics
  const nodeSet = new Set([
    ...charts.cpu.map(s => s.node),
    ...charts.memory.map(s => s.node),
  ]);
  const nodes = [...nodeSet].sort();

  if (nodes.length === 0) return (
    <div style={{ padding: "0.75rem 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>
      Aguardando dados do Prometheus (pode levar ~2 min após instalação)...
    </div>
  );

  function getSeriesList(arr) {
    return nodes.map(n =>
      arr.find(s => s.node === n || s.node.startsWith(n.split(".")[0])) ?? null
    );
  }

  // Combine RX+TX into single chart by merging points: v=rx, v2=tx
  function combinedNetSeries() {
    return nodes.map(n => {
      const rx = charts.net_rx.find(s => s.node === n || s.node.startsWith(n.split(".")[0]));
      const tx = charts.net_tx.find(s => s.node === n || s.node.startsWith(n.split(".")[0]));
      if (!rx && !tx) return null;
      const pts = (rx?.points ?? tx?.points ?? []).map((p, i) => ({
        t: p.t,
        v: rx?.points?.[i]?.v ?? 0,
      }));
      return { node: n, points: pts };
    });
  }

  function combinedDiskSeries() {
    return nodes.map(n => {
      const rd = charts.disk_read.find(s => s.node === n || s.node.startsWith(n.split(".")[0]));
      const pts = (rd?.points ?? []).map(p => ({ t: p.t, v: p.v }));
      return pts.length > 0 ? { node: n, points: pts } : null;
    });
  }

  function combinedDiskWriteSeries() {
    return nodes.map(n => {
      const wr = charts.disk_write.find(s => s.node === n || s.node.startsWith(n.split(".")[0]));
      const pts = (wr?.points ?? []).map(p => ({ t: p.t, v: p.v }));
      return pts.length > 0 ? { node: n, points: pts } : null;
    });
  }

  return (
    <div style={{ marginTop: "1.25rem" }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 12 }}>
        Histórico de métricas — última hora
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Chart
          title="CPU %"
          seriesList={getSeriesList(charts.cpu)}
          nodeNames={nodes}
          colors={NODE_COLORS}
          fmt={fmtPct}
          maxY={100}
        />
        <Chart
          title="Memória %"
          seriesList={getSeriesList(charts.memory)}
          nodeNames={nodes}
          colors={NODE_COLORS}
          fmt={fmtPct}
          maxY={100}
        />
        <Chart
          title="Rede — RX (entrada)"
          seriesList={combinedNetSeries()}
          nodeNames={nodes}
          colors={NODE_COLORS}
          fmt={fmtBytes}
        />
        <Chart
          title="Disco — Leitura"
          seriesList={combinedDiskSeries()}
          nodeNames={nodes}
          colors={NODE_COLORS}
          fmt={fmtBytes}
        />
        <Chart
          title="Rede — TX (saída)"
          seriesList={nodes.map(n =>
            charts.net_tx.find(s => s.node === n || s.node.startsWith(n.split(".")[0])) ?? null
          )}
          nodeNames={nodes}
          colors={NODE_COLORS}
          fmt={fmtBytes}
        />
        <Chart
          title="Disco — Escrita"
          seriesList={combinedDiskWriteSeries()}
          nodeNames={nodes}
          colors={NODE_COLORS}
          fmt={fmtBytes}
        />
      </div>
    </div>
  );
}
