import { useState, useEffect, useRef, useCallback } from "react";
import { fetchNodeCharts } from "../api/client";

// ─── constants ───────────────────────────────────────────────────────────────

const NODE_COLORS = ["#60a5fa", "#4ade80", "#f472b6", "#fb923c", "#a78bfa", "#facc15"];

const TIME_RANGES = [
  { label: "1m",  hours: 1 / 60,  step: 1,    refresh: 5  },
  { label: "5m",  hours: 5 / 60,  step: 5,    refresh: 10 },
  { label: "15m", hours: 15 / 60, step: 15,   refresh: 15 },
  { label: "30m", hours: 0.5,     step: 30,   refresh: 20 },
  { label: "1h",  hours: 1,       step: 60,   refresh: 30 },
  { label: "3h",  hours: 3,       step: 180,  refresh: 60 },
  { label: "6h",  hours: 6,       step: 360,  refresh: 120 },
  { label: "24h", hours: 24,      step: 1440, refresh: 300 },
];

// ─── formatters ──────────────────────────────────────────────────────────────

function fmtBytes(v) {
  if (v == null || v < 0) return "—";
  if (v < 1024) return `${v.toFixed(0)} B/s`;
  if (v < 1048576) return `${(v / 1024).toFixed(1)} KB/s`;
  return `${(v / 1048576).toFixed(1)} MB/s`;
}
function fmtPct(v)  { return v != null ? `${v.toFixed(1)}%` : "—"; }
function shortHost(n) {
  if (!n) return "?";
  return n.replace(/\..*$/, "").replace(/^ip-/, "").replace(/-/g, ".");
}
function fmtTs(ts) {
  return new Date(ts * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── single chart ─────────────────────────────────────────────────────────────

function Chart({ title, seriesList, nodeNames, colors, fmt, maxY, hoverIdx, onHover }) {
  const svgRef = useRef(null);

  // Layout: leave left padding for Y-axis labels
  const W = 100, H = 88;
  const pxL = 8, pxR = 1, py = 4, pbottom = 4;
  const IW = W - pxL - pxR;
  const IH = H - py - pbottom;

  const allVals = seriesList.flatMap(s => (s?.points ?? []).map(p => p.v));
  const globalMax = maxY ?? ((allVals.length > 0 ? Math.max(...allVals) : 1) || 1);
  const totalPts = Math.max(...seriesList.map(s => s?.points?.length ?? 0), 1);

  const chartId = title.replace(/\W/g, "");

  function xOf(i)   { return pxL + (totalPts > 1 ? (i / (totalPts - 1)) * IW : 0); }
  function yOf(v)   { return py + IH - ((v / globalMax) * IH); }

  function toLinePath(pts) {
    if (!pts || pts.length < 2) return null;
    return pts.map((p, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(2)},${yOf(p.v).toFixed(2)}`).join(" ");
  }
  function toAreaPath(pts) {
    if (!pts || pts.length < 2) return null;
    const base = (py + IH).toFixed(2);
    const line = pts.map((p, i) => `L${xOf(i).toFixed(2)},${yOf(p.v).toFixed(2)}`).join(" ");
    const firstX = xOf(0).toFixed(2);
    const lastX  = xOf(pts.length - 1).toFixed(2);
    return `M${firstX},${base} ${line} L${lastX},${base} Z`;
  }

  // Y-axis grid labels: 0%, 25%, 50%, 75%, 100% (or raw values)
  const gridFracs = [0.25, 0.5, 0.75, 1.0];

  function handleMouseMove(e) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = (e.clientX - rect.left - (rect.width * pxL / W)) / (rect.width * IW / W);
    const idx = Math.round(Math.max(0, Math.min(1, relX)) * (totalPts - 1));
    onHover(idx);
  }

  const hoverX = hoverIdx != null ? xOf(hoverIdx) : null;

  return (
    <div style={{
      background: "var(--color-background-secondary)",
      borderRadius: "var(--border-radius-md)",
      padding: "10px 12px",
      flex: 1,
      minWidth: 240,
    }}>
      {/* Title */}
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>{title}</div>

      {/* Legend inline at top */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 10px", marginBottom: 6 }}>
        {nodeNames.map((name, i) => {
          const pts = seriesList[i]?.points;
          const val = hoverIdx != null ? pts?.[hoverIdx]?.v : pts?.[pts.length - 1]?.v;
          return (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 2.5, borderRadius: 2, background: colors[i % colors.length], display: "inline-block", flexShrink: 0 }}/>
              <span style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{shortHost(name)}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: colors[i % colors.length] }}>{fmt(val ?? null)}</span>
            </div>
          );
        })}
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: 90, display: "block", cursor: "crosshair", overflow: "visible" }}
        onMouseMove={handleMouseMove} onMouseLeave={() => onHover(null)}>

        <defs>
          {seriesList.map((_, i) => (
            <linearGradient key={i} id={`grad-${chartId}-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={colors[i % colors.length]} stopOpacity="0.25" />
              <stop offset="100%" stopColor={colors[i % colors.length]} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* Horizontal grid lines with Y-axis labels */}
        {gridFracs.map(f => {
          const gy = (py + IH * (1 - f)).toFixed(2);
          const labelVal = globalMax * f;
          const labelStr = maxY != null
            ? `${Math.round(labelVal)}%`
            : fmtBytes(labelVal).replace("/s", "");
          return (
            <g key={f}>
              <line x1={pxL} y1={gy} x2={pxL + IW} y2={gy}
                stroke="rgba(255,255,255,0.07)" strokeWidth="0.4"/>
              <text x={pxL - 1} y={Number(gy) + 1} textAnchor="end"
                fontSize="3.5" fill="rgba(255,255,255,0.2)" fontFamily="monospace">
                {labelStr}
              </text>
            </g>
          );
        })}

        {/* Area fills */}
        {seriesList.map((s, i) => {
          const area = toAreaPath(s?.points);
          return area ? (
            <path key={i} d={area} fill={`url(#grad-${chartId}-${i})`} />
          ) : null;
        })}

        {/* Lines */}
        {seriesList.map((s, i) => {
          const line = toLinePath(s?.points);
          return line ? (
            <path key={i} d={line} fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
          ) : null;
        })}

        {/* Crosshair */}
        {hoverX != null && (
          <>
            <line x1={hoverX.toFixed(2)} y1={py} x2={hoverX.toFixed(2)} y2={py + IH}
              stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" strokeDasharray="4 2"/>
            {seriesList.map((s, i) => {
              const p = s?.points?.[hoverIdx];
              if (!p) return null;
              return (
                <circle key={i}
                  cx={hoverX.toFixed(2)} cy={yOf(p.v).toFixed(2)}
                  r="1.8" fill={colors[i % colors.length]}
                  stroke="rgba(0,0,0,0.5)" strokeWidth="0.4"/>
              );
            })}
          </>
        )}

        {/* Invisible hit area */}
        <rect x={pxL} y={py} width={IW} height={IH} fill="transparent"/>
      </svg>
    </div>
  );
}

// ─── tooltip ─────────────────────────────────────────────────────────────────

function Tooltip({ charts, nodes, hoverIdx, colors, mouse }) {
  if (hoverIdx == null || !mouse) return null;

  const allTs = charts?.cpu?.find(Boolean)?.points?.[hoverIdx]?.t;

  return (
    <div style={{
      position: "fixed", left: mouse.x + 16, top: mouse.y - 10,
      background: "rgba(10,10,20,0.95)", border: "0.5px solid rgba(255,255,255,0.12)",
      borderRadius: 8, padding: "8px 12px", zIndex: 999, pointerEvents: "none",
      boxShadow: "0 8px 24px rgba(0,0,0,0.6)", minWidth: 160,
    }}>
      {allTs && (
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 6, fontFamily: "monospace" }}>
          {fmtTs(allTs)}
        </div>
      )}
      {nodes.map((n, i) => {
        const cpu = charts?.cpu?.find(s => s.node === n || s.node.startsWith(n.split(".")[0]))?.points?.[hoverIdx]?.v;
        const mem = charts?.memory?.find(s => s.node === n || s.node.startsWith(n.split(".")[0]))?.points?.[hoverIdx]?.v;
        return (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[i % colors.length], flexShrink: 0 }}/>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", minWidth: 90 }}>{shortHost(n)}</span>
            <span style={{ fontSize: 11, color: colors[i % colors.length], fontWeight: 600, fontFamily: "monospace" }}>
              {fmtPct(cpu)}
            </span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
              {fmtPct(mem)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function NodeCharts() {
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rangeIdx, setRangeIdx] = useState(4); // default 1h
  const [hoverIdx, setHoverIdx] = useState(null);
  const [mouse, setMouse] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [live, setLive] = useState(false);
  const timerRef = useRef(null);

  const range = TIME_RANGES[rangeIdx];

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await fetchNodeCharts(range.hours, range.step);
      setCharts(data);
      setLastRefresh(new Date());
      setError(null);
    } catch {
      setError("Prometheus indisponível");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [range.hours, range.step]);

  // Initial + range-change load
  useEffect(() => {
    load(true);
  }, [load]);

  // Auto-refresh
  useEffect(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setLive(true);
      load(false).finally(() => setTimeout(() => setLive(false), 600));
    }, range.refresh * 1000);
    return () => clearInterval(timerRef.current);
  }, [load, range.refresh]);

  // Global mouse tracking for tooltip
  useEffect(() => {
    function onMove(e) { setMouse({ x: e.clientX, y: e.clientY }); }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (loading) return (
    <div style={{ padding: "0.75rem 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>
      Carregando gráficos do Prometheus...
    </div>
  );
  if (error || !charts) return (
    <div style={{ padding: "0.75rem 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>{error ?? "Dados indisponíveis"}</div>
  );

  const nodes = [...new Set([
    ...charts.cpu.map(s => s.node),
    ...charts.memory.map(s => s.node),
  ])].sort();

  if (nodes.length === 0) return (
    <div style={{ padding: "0.75rem 0", fontSize: 12, color: "var(--color-text-tertiary)" }}>
      Aguardando dados do Prometheus (pode levar ~2 min após instalação)...
    </div>
  );

  function get(arr, node) {
    return arr.find(s => s.node === node || s.node.startsWith(node.split(".")[0])) ?? null;
  }
  function getList(arr) { return nodes.map(n => get(arr, n)); }

  return (
    <div style={{ marginTop: "1.25rem" }}>
      {/* Header: title + range selector + live indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: ".04em", textTransform: "uppercase" }}>
          Histórico de métricas
        </span>

        {/* Range buttons */}
        <div style={{ display: "flex", gap: 2, background: "var(--color-background-secondary)", borderRadius: 8, padding: 3 }}>
          {TIME_RANGES.map((r, i) => (
            <button key={r.label} onClick={() => setRangeIdx(i)} style={{
              padding: "3px 10px", fontSize: 11, fontWeight: i === rangeIdx ? 600 : 400,
              borderRadius: 6, border: "none", cursor: "pointer",
              background: i === rangeIdx ? "#3b82f6" : "transparent",
              color: i === rangeIdx ? "#fff" : "var(--color-text-tertiary)",
              transition: "all 0.15s",
            }}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Live indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: "auto" }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: live ? "#4ade80" : "var(--color-border-secondary)",
            boxShadow: live ? "0 0 6px #4ade80" : "none",
            transition: "all 0.3s", flexShrink: 0,
          }}/>
          <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>
            {lastRefresh ? `${lastRefresh.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "—"}
          </span>
          <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>· refresh {range.refresh}s</span>
        </div>
      </div>

      {/* Charts grid 2x3 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Chart title="CPU %" seriesList={getList(charts.cpu)} nodeNames={nodes}
          colors={NODE_COLORS} fmt={fmtPct} maxY={100} hoverIdx={hoverIdx} onHover={setHoverIdx}/>
        <Chart title="Memória %" seriesList={getList(charts.memory)} nodeNames={nodes}
          colors={NODE_COLORS} fmt={fmtPct} maxY={100} hoverIdx={hoverIdx} onHover={setHoverIdx}/>
        <Chart title="Rede — RX (entrada)" seriesList={getList(charts.net_rx)} nodeNames={nodes}
          colors={NODE_COLORS} fmt={fmtBytes} hoverIdx={hoverIdx} onHover={setHoverIdx}/>
        <Chart title="Rede — TX (saída)" seriesList={getList(charts.net_tx)} nodeNames={nodes}
          colors={NODE_COLORS} fmt={fmtBytes} hoverIdx={hoverIdx} onHover={setHoverIdx}/>
        <Chart title="Disco — Leitura" seriesList={getList(charts.disk_read)} nodeNames={nodes}
          colors={NODE_COLORS} fmt={fmtBytes} hoverIdx={hoverIdx} onHover={setHoverIdx}/>
        <Chart title="Disco — Escrita" seriesList={getList(charts.disk_write)} nodeNames={nodes}
          colors={NODE_COLORS} fmt={fmtBytes} hoverIdx={hoverIdx} onHover={setHoverIdx}/>
      </div>

      {/* Global tooltip */}
      <Tooltip charts={charts} nodes={nodes} hoverIdx={hoverIdx} colors={NODE_COLORS} mouse={mouse}/>
    </div>
  );
}
