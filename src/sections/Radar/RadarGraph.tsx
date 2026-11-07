// Rolling time-series of SIMULATED events: last 60 s, 1-second buckets, stacked per visible category.
// Completed buckets are drawn; between bucket boundaries the plot glides left (rAF transform only — React
// re-renders once per second / per batch of new events). Hidden categories are removed from the stack.
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatNumber, useI18n } from '../../i18n';
import { bucketize } from '../../lib/threatSim';
import { useExperience } from '../../state/experience';
import { CATEGORY_COLOR_VAR, selectedEvent, useRadar, type ThreatCategory } from '../../state/radar';
import { CAT_LABEL, STACK_ORDER, formatClock } from './radarText';

const WINDOW_S = 60;
/** Completed buckets kept (two extra off-screen on the left so the curve enters smoothly). */
const BUCKETS = WINDOW_S + 2;
const PAD_TOP = 10;

/** Monotone cubic (Fritsch–Carlson) through the points; no overshoot, so stacked layers never cross. */
function monotone(xs: number[], ys: number[], move: boolean): string {
  const n = xs.length;
  if (n === 0) return '';
  const f = (v: number) => v.toFixed(1);
  let d = `${move ? 'M' : 'L'}${f(xs[0])} ${f(ys[0])}`;
  if (n === 1) return d;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = xs[i + 1] - xs[i];
    m[i] = (ys[i + 1] - ys[i]) / dx[i];
  }
  const tan: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) tan[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  tan[n - 1] = m[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      tan[i] = 0;
      tan[i + 1] = 0;
      continue;
    }
    const a = tan[i] / m[i];
    const b = tan[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      tan[i] = k * a * m[i];
      tan[i + 1] = k * b * m[i];
    }
  }
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${f(xs[i] + h)} ${f(ys[i] + tan[i] * h)} ${f(xs[i + 1] - h)} ${f(ys[i + 1] - tan[i + 1] * h)} ${f(xs[i + 1])} ${f(ys[i + 1])}`;
  }
  return d;
}

function niceMax(v: number): number {
  if (v <= 2) return 2;
  if (v <= 3) return 3;
  if (v <= 4) return 4;
  return Math.ceil(v / 2) * 2;
}

/** Light centred smoothing of the per-second counts (kernel 1-2-3-2-1) → a readable rolling rate. */
const KERNEL = [1, 2, 3, 2, 1];
function smooth(series: number[]): number[] {
  const half = (KERNEL.length - 1) / 2;
  return series.map((_, i) => {
    let sum = 0;
    let weight = 0;
    for (let k = 0; k < KERNEL.length; k++) {
      const j = i + k - half;
      if (j < 0 || j >= series.length) continue;
      sum += series[j] * KERNEL[k];
      weight += KERNEL[k];
    }
    return weight ? sum / weight : 0;
  });
}

const fmtTick = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

export function RadarGraph({ running }: { running: boolean }) {
  const { t, lang } = useI18n();
  const events = useRadar((s) => s.events);
  const filters = useRadar((s) => s.filters);
  const paused = useRadar((s) => s.paused);
  const selected = useRadar(selectedEvent);
  const reduced = useExperience((s) => s.reducedMotion);

  const wrapRef = useRef<HTMLDivElement>(null);
  const glideRef = useRef<SVGGElement>(null);
  const [size, setSize] = useState({ w: 480, h: 132 });
  /** Plot width for the rAF glide — read from the ResizeObserver, never from layout inside the frame loop. */
  const widthRef = useRef(size.w);
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  const nowSecRef = useRef(nowSec);
  nowSecRef.current = nowSec;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.max(160, Math.round(entry.contentRect.width));
      const h = Math.max(90, Math.round(entry.contentRect.height));
      widthRef.current = w;
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Clock: rAF glide when motion is allowed, otherwise one discrete step per second. Stops when not running.
  useEffect(() => {
    if (!running) return;
    setNowSec(Math.floor(Date.now() / 1000));
    if (reduced) {
      glideRef.current?.setAttribute('transform', 'translate(0 0)');
      const id = window.setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 500);
      return () => window.clearInterval(id);
    }
    let raf = 0;
    let lastShift = '';
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = Date.now();
      const sec = Math.floor(now / 1000);
      if (sec !== nowSecRef.current) {
        nowSecRef.current = sec;
        setNowSec(sec);
      }
      const phase = Math.min(1, Math.max(0, (now - nowSecRef.current * 1000) / 1000));
      const shift = (-phase * (widthRef.current / WINDOW_S)).toFixed(1);
      if (shift === lastShift) return; // sub-0.1px change: skip the repaint
      lastShift = shift;
      glideRef.current?.setAttribute('transform', `translate(${shift} 0)`);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, reduced]);

  const visibleCats = useMemo(() => STACK_ORDER.filter((c) => filters[c]), [filters]);

  const model = useMemo(() => {
    const end = nowSec * 1000;
    const buckets = bucketize(events, end, BUCKETS);
    const { w, h } = size;
    const bw = w / WINDOW_S;
    const xs = Array.from({ length: BUCKETS }, (_, i) => (i - 1.5) * bw);
    // Stack visible categories in STACK_ORDER.
    const cumulative: number[][] = [];
    let acc = new Array<number>(BUCKETS).fill(0);
    let raw = new Array<number>(BUCKETS).fill(0);
    for (const c of visibleCats) {
      const sm = smooth(buckets[c]);
      acc = acc.map((v, i) => v + sm[i]);
      raw = raw.map((v, i) => v + buckets[c][i]);
      cumulative.push(acc);
    }
    // Scale from the on-screen window only (the two left-most buckets are off-screen).
    let peak = 0;
    let top = 0;
    for (let i = 2; i < BUCKETS; i++) {
      peak = Math.max(peak, raw[i]);
      top = Math.max(top, acc[i]);
    }
    const yMax = niceMax(top * 1.1);
    const y = (v: number) => h - (v / yMax) * (h - PAD_TOP);
    const layers = visibleCats.map((c, k) => {
      const top = cumulative[k].map(y);
      const bottom = k === 0 ? xs.map(() => h) : cumulative[k - 1].map(y);
      const topLine = monotone(xs, top, true);
      const area = topLine + monotone([...xs].reverse(), [...bottom].reverse(), false) + 'Z';
      return { c, topLine, area };
    });
    const sums = {} as Record<ThreatCategory, number>;
    for (const c of STACK_ORDER) sums[c] = buckets[c].slice(2).reduce((s, n) => s + n, 0);
    const recent = visibleCats.reduce((s, c) => s + buckets[c].slice(-10).reduce((a, n) => a + n, 0), 0) / 10;
    return { layers, yMax, peak, sums, rate: recent, bw, end };
  }, [events, nowSec, size, visibleCats]);

  // Selected event marker (group coordinates, so it glides with the data).
  const windowStart = model.end - WINDOW_S * 1000;
  const selX =
    selected && filters[selected.category] && selected.t >= windowStart - 1000 && selected.t <= model.end + 1000
      ? ((selected.t - windowStart) / 1000) * model.bw
      : null;

  const summary =
    visibleCats.length === 0
      ? t('radar.graphHiddenAll')
      : visibleCats.every((c) => model.sums[c] === 0)
        ? t('radar.graphNoData')
        : visibleCats
            .map((c) => t('radar.graphSummaryItem', { category: t(CAT_LABEL[c]), count: model.sums[c] }))
            .join(', ');
  const label =
    t('radar.graphLabel', { summary, peak: model.peak }) +
    (selX !== null && selected ? ` ${t('radar.graphSelectedLabel', { time: formatClock(selected.t, lang) })}.` : '');

  const { w, h } = size;
  const ticks = [60, 45, 30, 15, 0];

  return (
    <div className="radar-graph">
      <div className="radar-panel__head">
        <span className="radar-code" aria-hidden="true">
          SG//TIMELINE
        </span>
        <h3 className="radar-panel__title">{t('radar.graphTitle')}</h3>
        <span className="radar-graph__rate" aria-hidden="true">
          {paused ? (
            <span className="radar-graph__paused">{t('radar.graphPaused')}</span>
          ) : (
            <>
              ≈ {formatNumber(Math.round(model.rate * 10) / 10, lang)} <small>{t('radar.graphUnit')}</small>
            </>
          )}
        </span>
      </div>
      <div className="radar-graph__plot" role="img" aria-label={label} dir="ltr">
        <div className="radar-graph__y" aria-hidden="true">
          <span>{fmtTick(model.yMax)}</span>
          <span>{fmtTick(model.yMax / 2)}</span>
          <span>0</span>
        </div>
        <div ref={wrapRef} className="radar-graph__canvas">
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
            <defs>
              {STACK_ORDER.map((c) => (
                <linearGradient key={c} id={`rg-fill-${c}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: CATEGORY_COLOR_VAR[c], stopOpacity: 0.42 }} />
                  <stop offset="100%" style={{ stopColor: CATEGORY_COLOR_VAR[c], stopOpacity: 0.06 }} />
                </linearGradient>
              ))}
              <clipPath id="rg-clip">
                <rect x="0" y="0" width={w} height={h} />
              </clipPath>
            </defs>
            <g className="radar-graph__grid">
              {[0, 0.5, 1].map((f) => (
                <line key={f} x1="0" x2={w} y1={PAD_TOP + (h - PAD_TOP) * f} y2={PAD_TOP + (h - PAD_TOP) * f} />
              ))}
              {ticks.map((s) => (
                <line key={s} className="radar-graph__vline" x1={w - (s / WINDOW_S) * w} x2={w - (s / WINDOW_S) * w} y1="0" y2={h} />
              ))}
            </g>
            <g clipPath="url(#rg-clip)">
              <g ref={glideRef}>
                {model.layers.map((l) => (
                  <g key={l.c} className="radar-graph__layer" style={{ ['--cat' as string]: CATEGORY_COLOR_VAR[l.c] }}>
                    <path d={l.area} fill={`url(#rg-fill-${l.c})`} className="radar-graph__area" />
                    <path d={l.topLine} className="radar-graph__line" />
                  </g>
                ))}
                {selX !== null && selected && (
                  <g className="radar-graph__sel" style={{ ['--cat' as string]: CATEGORY_COLOR_VAR[selected.category] }}>
                    <line x1={selX} x2={selX} y1="0" y2={h} />
                    <circle cx={selX} cy={4} r={3} />
                    {/* label flips to the left of the marker near the "now" edge so it is never clipped */}
                    <text x={selX > w - 90 ? selX - 6 : selX + 6} y={12} textAnchor={selX > w - 90 ? 'end' : 'start'}>
                      {t('radar.graphSelected')}
                    </text>
                  </g>
                )}
              </g>
            </g>
            <line className="radar-graph__now" x1={w - 0.5} x2={w - 0.5} y1="0" y2={h} />
          </svg>
        </div>
        <div className="radar-graph__x" aria-hidden="true">
          {ticks.map((s) => (
            <span key={s} style={{ left: `${100 - (s / WINDOW_S) * 100}%` }}>
              {s === 0 ? t('radar.graphAxisNow') : t('radar.graphAxisAgo', { s })}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
