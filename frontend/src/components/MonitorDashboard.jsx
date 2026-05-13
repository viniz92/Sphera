import { useState, useEffect } from "react";
import { fetchNodeCharts, fetchPodMetrics, fetchNodeMetrics } from "../api/client";

// ─── constants ───────────────────────────────────────────────────────────────

const NODE_COLORS = ["#60a5fa", "#4ade80", "#f472b6", "#fb923c", "#a78bfa", "#facc15"];

const RANGES = [
  { label: "15m", hours: 0.25 },
  { label: "1h",  hours: 1 },
  { label: "3h",  hours: 3 },
  { label: "6h",  hours: 6 },
  { label: "24h", hours: 24 },
];

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtTs(ts) {
  return new Date(ts * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function shortHost(n) {
  return (n || "?").replace(/\..*$/, "").replace(/^ip-/, "").replace(/-/g, ".");
}
function fmtBytes(v) {
  if (v == null || v < 0) return "—";
  if (v >= 1_048_576) return `${(v / 1_048_576).toFixed(1)} MB/s`;
  if (v >= 1024)      return `${(v / 1024).toFixed(0)} KB/s`;
  return `${v.toFixed(0)} B/s`;
}
function fmtPct(v) { return v != null ? `${v.toFixed(1)}%` : "—"; }
function niceMax(v) {
  if (!v || v === 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / mag) * mag;
}
function sumSeries(list) {
  const valid = (list ?? []).filter(Boolean);
  if (!valid.length) return [];
  const len = Math.max(...valid.map(s => s.points?.length ?? 0));
  return Array.from({ length: len }, (_, i) => ({
    t: valid.find(s => s.points?.[i])?.points[i].t ?? 0,
    v: valid.reduce((acc, ser) => acc + (ser.points?.[i]?.v ?? 0), 0),
  }));
}

// ─── generic axis chart ───────────────────────────────────────────────────────
// seriesData: [{label, color, points: [{t, v}], dashed?}]

function MetricChart({ title, seriesData, fmtY, fmtVal, maxY }) {
  const PL = 54, PR = 8, PT = 10, PB = 22;
  const VW = 400, VH = 148;
  const CW = VW - PL - PR, CH = VH - PT - PB;

  const allVals = (seriesData ?? []).flatMap(s => (s.points ?? []).map(p => p.v));
  const globalMax = maxY ?? ((allVals.length > 0 ? niceMax(Math.max(...allVals)) : 1) || 1);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => globalMax * f);

  const refPts = seriesData?.[0]?.points ?? [];
  const xStep = refPts.length > 1 ? CW / (refPts.length - 1) : CW;
  const xOf = i => PL + i * xStep;
  const yOf = v => PT + CH - (Math.max(0, v) / globalMax) * CH;
  const xIdxs = refPts.length > 1
    ? [0, 0.2, 0.4, 0.6, 0.8, 1].map(f => Math.round(f * (refPts.length - 1)))
    : [];

  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 14px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>{title}</div>
      <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto" }}>
        <defs>
          {seriesData?.map(s => (
            <linearGradient key={s.label} id={`ag-${title}-${s.label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.18"/>
              <stop offset="100%" stopColor={s.color} stopOpacity="0"/>
            </linearGradient>
          ))}
        </defs>
        {/* Y grid + labels */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PL} y1={yOf(v)} x2={PL+CW} y2={yOf(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="0.6"/>
            <text x={PL-5} y={yOf(v)+3.5} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)">{fmtY(v)}</text>
          </g>
        ))}
        {/* X axis + labels */}
        <line x1={PL} y1={PT+CH} x2={PL+CW} y2={PT+CH} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
        {xIdxs.map(i => refPts[i] && (
          <text key={i} x={xOf(i)} y={PT+CH+14} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.28)">{fmtTs(refPts[i].t)}</text>
        ))}
        {/* series */}
        {(seriesData ?? []).map((s, si) => {
          const pts = s.points ?? [];
          if (pts.length < 2) return null;
          const pStr = pts.map((p, i) => `${xOf(i).toFixed(1)},${yOf(p.v).toFixed(1)}`).join(" ");
          const areaD = `M${PL},${PT+CH} ` + pts.map((p, i) => `L${xOf(i).toFixed(1)},${yOf(p.v).toFixed(1)}`).join(" ") + ` L${xOf(pts.length-1).toFixed(1)},${PT+CH} Z`;
          return (
            <g key={si}>
              {si === 0 && <path d={areaD} fill={`url(#ag-${title}-${s.label})`}/>}
              <polyline points={pStr} fill="none" stroke={s.color}
                strokeWidth={si === 0 ? "1.6" : "1.2"}
                strokeDasharray={s.dashed ? "4 2" : undefined}
                strokeLinejoin="round" strokeLinecap="round"/>
              {xIdxs.map(i => pts[i] && (
                <circle key={i} cx={xOf(i)} cy={yOf(pts[i].v)} r="1.8" fill={s.color}/>
              ))}
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 12px", marginTop: 4 }}>
        {(seriesData ?? []).map(s => {
          const cur = s.points?.length > 0 ? s.points[s.points.length - 1].v : null;
          return (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 2.5, borderRadius: 2, background: s.color, display: "inline-block" }}/>
              <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{s.label}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: s.color }}>{fmtVal(cur)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── pod restarts bar chart ───────────────────────────────────────────────────

function PodRestartsChart({ pods }) {
  const top5 = [...pods].sort((a, b) => b.restarts - a.restarts).slice(0, 5);
  const maxR = top5[0]?.restarts ?? 1;
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "14px 16px", flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 3 }}>⟳ Restarts de pods</div>
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 12 }}>Top 5 · últimas 24h</div>
      {top5.length === 0
        ? <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>Nenhum restart</div>
        : top5.map(p => (
          <div key={p.name} style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>{p.name}</span>
              <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 600, flexShrink: 0 }}>{p.restarts}</span>
            </div>
            <div style={{ background: "var(--color-background-primary)", borderRadius: 3, height: 7, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 3, background: "#fbbf24", width: `${(p.restarts / maxR) * 100}%`, transition: "width 0.4s" }}/>
            </div>
          </div>
        ))
      }
    </div>
  );
}

// ─── pod status donut ─────────────────────────────────────────────────────────

function PodStatusDonut({ pods }) {
  const STATUS_COLOR = {
    Running: "#4ade80", Succeeded: "#4ade80", Completed: "#4ade80",
    Pending: "#fb923c", NotReady: "#fbbf24",
    Failed: "#f87171", CrashLoopBackOff: "#f87171", OOMKilled: "#f87171",
  };
  const counts = {};
  pods.forEach(p => { counts[p.status] = (counts[p.status] ?? 0) + 1; });
  const total = pods.length;
  const slices = Object.entries(counts)
    .map(([st, cnt]) => ({ st, cnt, color: STATUS_COLOR[st] ?? "#888", pct: Math.round(cnt / total * 100) }))
    .sort((a, b) => b.cnt - a.cnt);

  const r = 50, cx = 65, cy = 65, sw = 16, circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "14px 16px", flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 3 }}>⊕ Status dos pods</div>
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 10 }}>Total: {total} pods</div>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw}/>
          {slices.map((s, i) => {
            const dash = (s.cnt / total) * circ;
            const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
              strokeWidth={sw} strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset} strokeLinecap="butt"/>;
            offset += dash;
            return el;
          })}
          <text x={cx} y={cy+6} textAnchor="middle" fontSize="16" fontWeight="700"
            fill="var(--color-text-primary)" style={{ transform: `rotate(90deg)`, transformOrigin: `${cx}px ${cy}px` }}>{total}</text>
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {slices.map(s => (
            <div key={s.st} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: s.color, flexShrink: 0 }}/>
              <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{s.st}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── per-node table ───────────────────────────────────────────────────────────

function NodeDetailTable({ nodeMetrics, pods }) {
  const podsByNode = {};
  pods.forEach(p => { if (p.node_name) podsByNode[p.node_name] = (podsByNode[p.node_name] ?? 0) + 1; });

  function badge(cpu, mem) {
    if (cpu > 85 || mem > 90) return { label: "Atenção", bg: "rgba(248,113,113,.18)", color: "#f87171" };
    if (cpu > 65 || mem > 75) return { label: "Aviso",   bg: "rgba(251,191,36,.15)",  color: "#fbbf24" };
    return                           { label: "Ready",   bg: "rgba(74,222,128,.12)",   color: "#4ade80" };
  }
  function Bar({ pct, color }) {
    const c = pct > 85 ? "#f87171" : pct > 65 ? "#fbbf24" : color;
    return (
      <div>
        <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{pct != null ? `${pct}%` : "—"}</span>
        <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 3, height: 5, marginTop: 3, width: 90 }}>
          <div style={{ height: "100%", borderRadius: 3, background: c, width: `${pct ?? 0}%` }}/>
        </div>
      </div>
    );
  }
  const thS = { fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 400, padding: "6px 12px", textAlign: "left", borderBottom: "0.5px solid rgba(255,255,255,0.06)" };
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "14px 16px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 12 }}>⊞ Detalhamento por node</div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>
          <th style={thS}>Node</th>
          <th style={{ ...thS, width: 130 }}>CPU</th>
          <th style={{ ...thS, width: 130 }}>Memória</th>
          <th style={{ ...thS, width: 55, textAlign: "center" }}>Pods</th>
          <th style={{ ...thS, width: 85, textAlign: "center" }}>Status</th>
        </tr></thead>
        <tbody>
          {nodeMetrics.map(m => {
            const b = badge(m.cpu_percent, m.memory_percent);
            return (
              <tr key={m.name} style={{ borderBottom: "0.5px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "9px 12px", fontSize: 12, fontFamily: "monospace", color: "var(--color-text-secondary)" }}>{shortHost(m.name)}</td>
                <td style={{ padding: "9px 12px" }}><Bar pct={m.cpu_percent} color="#60a5fa"/></td>
                <td style={{ padding: "9px 12px" }}><Bar pct={m.memory_percent} color="#4ade80"/></td>
                <td style={{ padding: "9px 12px", fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center" }}>{podsByNode[m.name] ?? 0}</td>
                <td style={{ padding: "9px 12px", textAlign: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: b.bg, color: b.color }}>{b.label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export function MonitorDashboard() {
  const [pods, setPods] = useState([]);
  const [nodeMetrics, setNodeMetrics] = useState([]);
  const [charts, setCharts] = useState(null);
  const [rangeIdx, setRangeIdx] = useState(2);
  const [loading, setLoading] = useState(true);
  const range = RANGES[rangeIdx];

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPodMetrics(), fetchNodeMetrics(), fetchNodeCharts(range.hours)])
      .then(([p, n, c]) => { setPods(p); setNodeMetrics(n); setCharts(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [range.hours]);

  // Build per-node series for CPU and Memory
  const allNodes = [...new Set([
    ...(charts?.cpu ?? []).map(s => s.node),
    ...(charts?.memory ?? []).map(s => s.node),
  ])].sort();

  function nodeSeries(arr) {
    return allNodes.map((n, i) => {
      const s = (arr ?? []).find(x => x.node === n || x.node.startsWith(n.split(".")[0]));
      return { label: shortHost(n), color: NODE_COLORS[i % NODE_COLORS.length], points: s?.points ?? [] };
    });
  }

  const netSeries = [
    { label: "RX", color: "#4ade80", points: sumSeries(charts?.net_rx ?? []) },
    { label: "TX", color: "#a78bfa", points: sumSeries(charts?.net_tx ?? []), dashed: true },
  ];

  if (loading) return <div style={{ padding: "1.5rem 0", fontSize: 13, color: "var(--color-text-secondary)" }}>Carregando monitor...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Time range selector */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Janela:</span>
        <div style={{ display: "flex", gap: 2, background: "var(--color-background-secondary)", borderRadius: 7, padding: 3 }}>
          {RANGES.map((r, i) => (
            <button key={r.label} onClick={() => setRangeIdx(i)} style={{
              padding: "3px 10px", fontSize: 11, borderRadius: 5, border: "none", cursor: "pointer",
              background: i === rangeIdx ? "#3b82f6" : "transparent",
              color: i === rangeIdx ? "#fff" : "var(--color-text-tertiary)",
              fontWeight: i === rangeIdx ? 600 : 400,
            }}>{r.label}</button>
          ))}
        </div>
      </div>

      {/* 3 metric charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <MetricChart title="CPU %" seriesData={nodeSeries(charts?.cpu)} fmtY={v => `${v.toFixed(0)}%`} fmtVal={fmtPct} maxY={100}/>
        <MetricChart title="Memória %" seriesData={nodeSeries(charts?.memory)} fmtY={v => `${v.toFixed(0)}%`} fmtVal={fmtPct} maxY={100}/>
        <MetricChart title="Rede (RX / TX)" seriesData={netSeries} fmtY={fmtBytes} fmtVal={fmtBytes}/>
      </div>

      {/* Pod restarts + status donut */}
      <div style={{ display: "flex", gap: 10 }}>
        <PodRestartsChart pods={pods}/>
        <PodStatusDonut pods={pods}/>
      </div>

      {/* Node detail table */}
      <NodeDetailTable nodeMetrics={nodeMetrics} pods={pods}/>
    </div>
  );
}
