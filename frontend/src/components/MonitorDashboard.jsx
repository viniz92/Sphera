import { useState, useEffect } from "react";
import { fetchNodeCharts, fetchPodMetrics, fetchNodeMetrics } from "../api/client";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtNetY(v) {
  if (v >= 1_048_576) return `${(v / 1_048_576).toFixed(0)} MB/s`;
  if (v >= 1024)      return `${(v / 1024).toFixed(0)} KB/s`;
  return `${v.toFixed(0)} B/s`;
}
function fmtTs(ts) {
  return new Date(ts * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function shortHost(n) {
  return (n || "?").replace(/\..*$/, "").replace(/^ip-/, "").replace(/-/g, ".");
}

// Aggregate per-node series into a single series (sum)
function sumSeries(seriesList) {
  const valid = seriesList.filter(Boolean);
  if (!valid.length) return [];
  const len = Math.max(...valid.map(s => s.points?.length ?? 0));
  return Array.from({ length: len }, (_, i) => ({
    t: valid.find(s => s.points?.[i])?.points[i].t ?? 0,
    v: valid.reduce((s, ser) => s + (ser.points?.[i]?.v ?? 0), 0),
  }));
}

function niceMax(v) {
  if (!v || v === 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / mag) * mag;
}

// ─── Network chart with axes ──────────────────────────────────────────────────

const NET_RANGES = [
  { label: "15m", hours: 0.25 },
  { label: "1h",  hours: 1 },
  { label: "3h",  hours: 3 },
  { label: "6h",  hours: 6 },
  { label: "24h", hours: 24 },
];

function NetworkChart() {
  const [data, setData] = useState(null);
  const [rangeIdx, setRangeIdx] = useState(2); // 3h default
  const [loading, setLoading] = useState(true);

  const range = NET_RANGES[rangeIdx];

  useEffect(() => {
    setLoading(true);
    fetchNodeCharts(range.hours)
      .then(d => {
        setData({
          rx: sumSeries(d.net_rx),
          tx: sumSeries(d.net_tx),
        });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [range.hours]);

  const PL = 64, PR = 12, PT = 16, PB = 28; // padding
  const VW = 900, VH = 200;
  const CW = VW - PL - PR, CH = VH - PT - PB;

  const allVals = [...(data?.rx ?? []), ...(data?.tx ?? [])].map(p => p.v);
  const maxV = niceMax(Math.max(...allVals, 1));
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => maxV * f);

  const pts = data?.rx ?? [];
  const xStep = pts.length > 1 ? CW / (pts.length - 1) : CW;

  function x(i) { return PL + i * xStep; }
  function y(v) { return PT + CH - (v / maxV) * CH; }

  function toPolyline(arr) {
    if (!arr || arr.length < 2) return "";
    return arr.map((p, i) => `${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  }
  function toArea(arr) {
    if (!arr || arr.length < 2) return "";
    const line = arr.map((p, i) => `L${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
    return `M${PL},${PT + CH} ${line} L${x(arr.length - 1).toFixed(1)},${PT + CH} Z`;
  }

  // X-axis: show ~6 labels
  const xLabels = pts.length > 0
    ? [0, 0.2, 0.4, 0.6, 0.8, 1].map(f => Math.round(f * (pts.length - 1))).filter((v, i, a) => a.indexOf(v) === i)
    : [];

  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "16px 18px", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>🔗 Throughput de rede (MB/s)</div>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>Soma de todos os nodes · últimas {range.label}</div>
        </div>
        <div style={{ display: "flex", gap: 2, background: "var(--color-background-primary)", borderRadius: 7, padding: 2 }}>
          {NET_RANGES.map((r, i) => (
            <button key={r.label} onClick={() => setRangeIdx(i)} style={{
              padding: "3px 9px", fontSize: 11, borderRadius: 5, border: "none", cursor: "pointer",
              background: i === rangeIdx ? "#3b82f6" : "transparent",
              color: i === rangeIdx ? "#fff" : "var(--color-text-tertiary)", fontWeight: i === rangeIdx ? 600 : 400,
            }}>{r.label}</button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 16, height: 2, background: "#4ade80", display: "inline-block", borderRadius: 2 }}/>
          <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Entrada (ingress)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#a78bfa" strokeWidth="2" strokeDasharray="3 2"/></svg>
          <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Saída (egress)</span>
        </div>
      </div>

      {loading
        ? <div style={{ height: VH, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--color-text-tertiary)" }}>Carregando...</div>
        : (
        <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto" }}>
          {/* Y grid + labels */}
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={PL} y1={y(v)} x2={PL + CW} y2={y(v)} stroke="rgba(255,255,255,0.06)" strokeWidth="0.6"/>
              <text x={PL - 6} y={y(v) + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)">{fmtNetY(v)}</text>
            </g>
          ))}
          {/* X axis line */}
          <line x1={PL} y1={PT + CH} x2={PL + CW} y2={PT + CH} stroke="rgba(255,255,255,0.1)" strokeWidth="0.6"/>
          {/* X labels */}
          {xLabels.map(i => pts[i] && (
            <text key={i} x={x(i)} y={PT + CH + 16} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)">{fmtTs(pts[i].t)}</text>
          ))}
          {/* RX area + line */}
          {data?.rx?.length > 1 && (
            <>
              <defs>
                <linearGradient id="rx-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#4ade80" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d={toArea(data.rx)} fill="url(#rx-grad)"/>
              <polyline points={toPolyline(data.rx)} fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"/>
              {xLabels.map(i => data.rx[i] && (
                <circle key={i} cx={x(i)} cy={y(data.rx[i].v)} r="2.5" fill="#4ade80"/>
              ))}
            </>
          )}
          {/* TX line */}
          {data?.tx?.length > 1 && (
            <>
              <polyline points={toPolyline(data.tx)} fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="5 3" strokeLinejoin="round"/>
              {xLabels.map(i => data.tx[i] && (
                <circle key={i} cx={x(i)} cy={y(data.tx[i].v)} r="2" fill="#a78bfa"/>
              ))}
            </>
          )}
        </svg>
      )}
    </div>
  );
}

// ─── Pod restarts horizontal bar chart ────────────────────────────────────────

function PodRestartsChart({ pods }) {
  const top5 = [...pods].sort((a, b) => b.restarts - a.restarts).slice(0, 5);
  const maxR = top5[0]?.restarts ?? 1;

  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "16px 18px", flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>⟳ Restarts de pods</div>
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 14 }}>Top 5 com mais restarts · últimas 24h</div>
      {top5.length === 0
        ? <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>Nenhum restart registrado</div>
        : top5.map((p, i) => (
          <div key={p.name} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>{p.name}</span>
              <span style={{ fontSize: 11, color: "var(--color-text-warning)", fontWeight: 600 }}>{p.restarts}</span>
            </div>
            <div style={{ background: "var(--color-background-primary)", borderRadius: 3, height: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 3, background: "#fbbf24", width: `${(p.restarts / maxR) * 100}%`, transition: "width 0.4s" }}/>
            </div>
          </div>
        ))
      }
    </div>
  );
}

// ─── Pod status donut ─────────────────────────────────────────────────────────

function PodStatusDonut({ pods }) {
  const counts = {};
  pods.forEach(p => { counts[p.status] = (counts[p.status] ?? 0) + 1; });
  const total = pods.length;

  const STATUS_COLOR = {
    Running: "#4ade80", Succeeded: "#4ade80", Completed: "#4ade80",
    Pending: "#fb923c", NotReady: "#fbbf24",
    Failed: "#f87171", CrashLoopBackOff: "#f87171", OOMKilled: "#f87171",
  };

  const slices = Object.entries(counts).map(([status, count]) => ({
    status, count, color: STATUS_COLOR[status] ?? "#888",
    pct: Math.round(count / total * 100),
  })).sort((a, b) => b.count - a.count);

  const r = 54, cx = 70, cy = 70, sw = 18;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "16px 18px", flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>⊕ Status dos pods</div>
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 14 }}>Total: {total} pods</div>
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw}/>
          {slices.map((s, i) => {
            const dash = (s.count / total) * circ;
            const el = (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
                strokeWidth={sw} strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset} strokeLinecap="butt"/>
            );
            offset += dash;
            return el;
          })}
          <text x={cx} y={cy + 7} textAnchor="middle" fontSize="18" fontWeight="700"
            fill="var(--color-text-primary)" style={{ transform: `rotate(90deg)`, transformOrigin: `${cx}px ${cy}px` }}>
            {total}
          </text>
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {slices.map(s => (
            <div key={s.status} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }}/>
              <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{s.status}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Per-node detail table ────────────────────────────────────────────────────

function NodeDetailTable({ nodeMetrics, pods }) {
  const podsByNode = {};
  pods.forEach(p => {
    if (p.node_name) podsByNode[p.node_name] = (podsByNode[p.node_name] ?? 0) + 1;
  });

  function statusBadge(cpu, mem) {
    if (cpu > 85 || mem > 90) return { label: "Atenção", bg: "rgba(248,113,113,.2)", color: "#f87171" };
    if (cpu > 65 || mem > 75) return { label: "Aviso",   bg: "rgba(251,191,36,.15)", color: "#fbbf24" };
    return { label: "Ready", bg: "rgba(74,222,128,.12)", color: "#4ade80" };
  }

  function BarCell({ pct, color }) {
    const c = pct > 85 ? "#f87171" : pct > 65 ? "#fbbf24" : color;
    return (
      <div>
        <span style={{ fontSize: 12, fontWeight: 600, color: c }}>{pct != null ? `${pct}%` : "—"}</span>
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 3, height: 6, marginTop: 3, width: 100, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 3, background: c, width: `${pct ?? 0}%` }}/>
        </div>
      </div>
    );
  }

  const thS = { fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 400, padding: "6px 12px", textAlign: "left", borderBottom: "0.5px solid rgba(255,255,255,0.06)" };

  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "16px 18px", marginTop: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 14 }}>⊞ Detalhamento por node</div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thS}>Node</th>
            <th style={{ ...thS, width: 140 }}>CPU</th>
            <th style={{ ...thS, width: 140 }}>Memória</th>
            <th style={{ ...thS, width: 60, textAlign: "center" }}>Pods</th>
            <th style={{ ...thS, width: 90, textAlign: "center" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {nodeMetrics.map(m => {
            const badge = statusBadge(m.cpu_percent, m.memory_percent);
            const podCount = podsByNode[m.name] ?? 0;
            return (
              <tr key={m.name} style={{ borderBottom: "0.5px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: "monospace", color: "var(--color-text-secondary)" }}>{shortHost(m.name)}</td>
                <td style={{ padding: "10px 12px" }}><BarCell pct={m.cpu_percent} color="#60a5fa"/></td>
                <td style={{ padding: "10px 12px" }}><BarCell pct={m.memory_percent} color="#4ade80"/></td>
                <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--color-text-secondary)", textAlign: "center" }}>{podCount}</td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: badge.bg, color: badge.color }}>{badge.label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function MonitorDashboard() {
  const [pods, setPods] = useState([]);
  const [nodeMetrics, setNodeMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchPodMetrics(), fetchNodeMetrics()])
      .then(([p, n]) => { setPods(p); setNodeMetrics(n); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "1.5rem 0", fontSize: 13, color: "var(--color-text-secondary)" }}>Carregando monitor...</div>;

  return (
    <div>
      <NetworkChart />
      <div style={{ display: "flex", gap: 12 }}>
        <PodRestartsChart pods={pods}/>
        <PodStatusDonut pods={pods}/>
      </div>
      <NodeDetailTable nodeMetrics={nodeMetrics} pods={pods}/>
    </div>
  );
}
