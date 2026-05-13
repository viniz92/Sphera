import { useState, useEffect, useId } from "react";
import { fetchNodeCharts } from "../api/client";

function fmtBytes(v) {
  if (v == null) return "—";
  if (v < 1024) return `${v.toFixed(0)} B/s`;
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(1)} KB/s`;
  return `${(v / 1024 / 1024).toFixed(1)} MB/s`;
}

function fmtPct(v) {
  return v != null ? `${v.toFixed(1)}%` : "—";
}

function shortHost(name) {
  return name.replace(/\..*$/, "").replace(/^ip-/, "").replace(/-/g, ".");
}

function Sparkline({ points, color, color2, height = 52, width = 200 }) {
  const uid = useId().replace(/:/g, "");

  if (!points || points.length < 2) {
    return (
      <svg width={width} height={height}>
        <text x={width / 2} y={height / 2 + 4} textAnchor="middle" fontSize="10" fill="var(--color-text-tertiary)">sem dados</text>
      </svg>
    );
  }

  const px = 2, py = 3;
  const W = width - px * 2, H = height - py * 2;

  function buildPath(vals) {
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const range = maxV - minV || 1;
    const xs = vals.map((_, i) => px + (i / (vals.length - 1)) * W);
    const ys = vals.map(v => py + H - ((v - minV) / range) * H);
    return { xs, ys, minV, maxV };
  }

  // Primary series
  const v1 = points.map(p => (Array.isArray(p) ? p[0] : p.v));
  const { xs, ys, maxV: max1 } = buildPath(v1);
  const line1 = xs.map((x, i) => `${x},${ys[i]}`).join(" ");
  const area1 = `M${px},${py + H} ` + xs.map((x, i) => `L${x},${ys[i]}`).join(" ") + ` L${px + W},${py + H} Z`;
  const cur1 = v1[v1.length - 1];

  // Optional secondary series (e.g. TX or write)
  let line2 = null, cur2 = null;
  if (color2 && points[0]?.v2 != null) {
    const v2 = points.map(p => p.v2);
    const { xs: xs2, ys: ys2, maxV: max2 } = buildPath(v2);
    line2 = xs2.map((x, i) => `${x},${ys2[i]}`).join(" ");
    cur2 = v2[v2.length - 1];
  }

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={area1} fill={`url(#g-${uid})`} />
      <polyline points={line1} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      {line2 && <polyline points={line2} fill="none" stroke={color2} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="3 2" />}
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="2.5" fill={color} />
    </svg>
  );
}

function ChartCard({ title, series1, series2, color1, color2, fmt1, fmt2, label2 }) {
  const cur1 = series1?.points?.length > 0 ? series1.points[series1.points.length - 1].v : null;
  const cur2 = series2?.points?.length > 0 ? series2.points[series2.points.length - 1].v : null;

  // Merge series2 into series1 points as v2 (align by index)
  let merged = series1?.points ?? [];
  if (series2?.points?.length > 0 && merged.length > 0) {
    merged = merged.map((p, i) => ({ ...p, v2: series2.points[i]?.v ?? null }));
  }

  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "10px 12px", flex: 1, minWidth: 200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 500 }}>{title}</span>
        <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: color1 }}>{fmt1(cur1)}</span>
          {cur2 != null && <span style={{ fontSize: 10, color: color2 }}>{label2} {fmt2(cur2)}</span>}
        </span>
      </div>
      <Sparkline points={merged} color={color1} color2={color2} width={196} height={50} />
      <div style={{ fontSize: 9, color: "var(--color-text-tertiary)", marginTop: 3, textAlign: "right" }}>última 1h</div>
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
    <div style={{ padding: "0.75rem 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>
      {error ?? "Dados indisponíveis"}
    </div>
  );

  // Build per-node map
  const nodes = [...new Set([
    ...charts.cpu.map(s => s.node),
    ...charts.memory.map(s => s.node),
  ])].sort();

  if (nodes.length === 0) return (
    <div style={{ padding: "0.75rem 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>
      Aguardando dados do Prometheus...
    </div>
  );

  function getSeries(arr, node) {
    return arr.find(s => s.node === node || s.node.includes(node.split(".")[0])) ?? null;
  }

  return (
    <div style={{ marginTop: "1.25rem" }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 12 }}>
        Histórico de métricas — última hora
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {nodes.map(node => (
          <div key={node}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 8, fontFamily: "monospace" }}>
              {shortHost(node)}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <ChartCard
                title="CPU"
                series1={getSeries(charts.cpu, node)}
                color1="var(--color-text-info)"
                fmt1={fmtPct}
                fmt2={fmtPct}
              />
              <ChartCard
                title="Memória"
                series1={getSeries(charts.memory, node)}
                color1="var(--color-text-success)"
                fmt1={fmtPct}
                fmt2={fmtPct}
              />
              <ChartCard
                title="Rede RX / TX"
                series1={getSeries(charts.net_rx, node)}
                series2={getSeries(charts.net_tx, node)}
                color1="#a78bfa"
                color2="#f472b6"
                fmt1={fmtBytes}
                fmt2={fmtBytes}
                label2="TX"
              />
              <ChartCard
                title="Disco Leit. / Escrit."
                series1={getSeries(charts.disk_read, node)}
                series2={getSeries(charts.disk_write, node)}
                color1="#fb923c"
                color2="#facc15"
                fmt1={fmtBytes}
                fmt2={fmtBytes}
                label2="W"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
