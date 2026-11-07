// 2D orthographic dotted globe (SVG) for the static experience and narrow screens.
// Draws the same simulated arcs / markers / selection as the 3D globe, from the same radar store.
// Geometry is projected imperatively (setAttribute) so the optional slow rotation never re-renders React.
// Positions are ILLUSTRATIVE region centroids — never attribution.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useI18n } from '../../i18n';
import { HOME_REGION, fibonacciDots, regionById } from '../../lib/geo';
import { CATEGORY_COLOR_VAR, selectedEvent, useRadar, type ThreatEvent } from '../../state/radar';
import { CAT_LABEL } from './radarText';

const SIZE = 400;
const C = SIZE / 2;
const R = 168;
const MAX_ARCS = 10;
const DEG = Math.PI / 180;
/** Default framing: Europe / Africa / Middle East / South Asia around the demo network. */
const DEFAULT_VIEW = { lon: 34, lat: 18 };

interface Dot {
  sinLat: number;
  cosLat: number;
  lon: number;
}
let landDots: Dot[] | null = null;
function getLandDots(): Dot[] {
  if (!landDots) {
    landDots = fibonacciDots(5200)
      .filter((d) => d.land)
      .map((d) => ({ sinLat: Math.sin(d.lat * DEG), cosLat: Math.cos(d.lat * DEG), lon: d.lon * DEG }));
  }
  return landDots;
}

interface View {
  lon: number;
  lat: number;
}

/** Orthographic projection of a unit-sphere direction scaled by r; returns screen x/y and depth z. */
function project(lat: number, lon: number, r: number, v: View): [number, number, number] {
  const phi = lat * DEG;
  const lam = (lon - v.lon) * DEG;
  const phi0 = v.lat * DEG;
  const cp = Math.cos(phi);
  const x = cp * Math.sin(lam);
  const y = Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * cp * Math.cos(lam);
  const z = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * cp * Math.cos(lam);
  return [C + x * r * R, C - y * r * R, z];
}

function toLatLon(v: [number, number, number]): { lat: number; lon: number } {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return { lat: Math.asin(v[1] / len) / DEG, lon: Math.atan2(v[0], v[2]) / DEG };
}

function vec(lat: number, lon: number): [number, number, number] {
  const p = lat * DEG;
  const l = lon * DEG;
  return [Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)];
}

/** Lifted great-circle path from origin to home, split where it passes behind the globe. */
function arcPath(fromId: string, v: View): { d: string; head: [number, number] | null; mid: View } {
  const a = regionById(fromId) ?? HOME_REGION;
  const va = vec(a.lat, a.lon);
  const vb = vec(HOME_REGION.lat, HOME_REGION.lon);
  const dot = Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
  const omega = Math.acos(dot);
  const lift = 0.05 + 0.3 * (omega / Math.PI);
  const steps = 36;
  let d = '';
  let pen = false;
  let head: [number, number] | null = null;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let p: [number, number, number];
    if (omega < 1e-5) p = va;
    else {
      const s = Math.sin(omega);
      const wa = Math.sin((1 - t) * omega) / s;
      const wb = Math.sin(t * omega) / s;
      p = [va[0] * wa + vb[0] * wb, va[1] * wa + vb[1] * wb, va[2] * wa + vb[2] * wb];
    }
    const ll = toLatLon(p);
    const r = 1 + lift * Math.sin(Math.PI * t);
    const [x, y, z] = project(ll.lat, ll.lon, r, v);
    // Visible if in front of the globe, or lifted outside its silhouette.
    const visible = z > 0 || Math.hypot(x - C, y - C) > R;
    if (visible) {
      d += `${pen ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
      pen = true;
      if (i === 0) head = [x, y];
    } else pen = false;
  }
  const midVec = (() => {
    const m = [va[0] + vb[0], va[1] + vb[1], va[2] + vb[2]] as [number, number, number];
    return toLatLon(m);
  })();
  return { d, head, mid: { lon: midVec.lon, lat: midVec.lat } };
}

function graticulePath(v: View): string {
  let d = '';
  const line = (pts: Array<[number, number]>) => {
    let pen = false;
    for (const [lat, lon] of pts) {
      const [x, y, z] = project(lat, lon, 1, v);
      if (z > 0.02) {
        d += `${pen ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
        pen = true;
      } else pen = false;
    }
  };
  for (let lon = -180; lon < 180; lon += 30) {
    const pts: Array<[number, number]> = [];
    for (let lat = -80; lat <= 80; lat += 5) pts.push([lat, lon]);
    line(pts);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts: Array<[number, number]> = [];
    for (let lon = -180; lon <= 180; lon += 5) pts.push([lat, lon]);
    line(pts);
  }
  return d;
}

function shortestDelta(from: number, to: number): number {
  let d = (to - from) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

interface Props {
  /** Slow auto-rotation (narrow cinematic screens only). Static mode never rotates. */
  rotate: boolean;
}

export function StaticGlobe({ rotate }: Props) {
  const { t, loc } = useI18n();
  const events = useRadar((s) => s.events);
  const filters = useRadar((s) => s.filters);
  const selected = useRadar(selectedEvent);

  const arcs = useMemo(() => {
    const list: ThreatEvent[] = [];
    for (const e of events) {
      if (!filters[e.category]) continue;
      if (list.length < MAX_ARCS) list.push(e);
      else break;
    }
    if (selected && !list.some((e) => e.id === selected.id)) list.push(selected);
    return list;
  }, [events, filters, selected]);

  const svgRef = useRef<SVGSVGElement>(null);
  const landRefs = [useRef<SVGPathElement>(null), useRef<SVGPathElement>(null), useRef<SVGPathElement>(null)];
  const gratRef = useRef<SVGPathElement>(null);
  const homeRef = useRef<SVGGElement>(null);
  const arcsRef = useRef<SVGGElement>(null);
  const view = useRef<View>({ ...DEFAULT_VIEW });
  const target = useRef<View | null>(null);

  const landKey = useRef('');

  const draw = useCallback(() => {
    const v = view.current;
    // Land + graticule depend only on the view: skip them when just the arcs changed (new events).
    const key = `${v.lon.toFixed(2)}|${v.lat.toFixed(2)}`;
    if (key !== landKey.current) {
      landKey.current = key;
      drawLand(v);
    }
    drawArcs(v);

    function drawLand(v: View) {
    // Land dots, bucketed by depth so the limb fades (one path per bucket, round-capped zero-length segments).
    const buckets = ['', '', ''];
    for (const dot of getLandDots()) {
      const lam = dot.lon - v.lon * DEG;
      const phi0 = v.lat * DEG;
      const cl = Math.cos(lam);
      const z = Math.sin(phi0) * dot.sinLat + Math.cos(phi0) * dot.cosLat * cl;
      if (z <= 0.04) continue;
      const x = C + dot.cosLat * Math.sin(lam) * R;
      const y = C - (Math.cos(phi0) * dot.sinLat - Math.sin(phi0) * dot.cosLat * cl) * R;
      const b = z < 0.35 ? 0 : z < 0.7 ? 1 : 2;
      buckets[b] += `M${x.toFixed(1)} ${y.toFixed(1)}h0`;
    }
    landRefs.forEach((r, i) => r.current?.setAttribute('d', buckets[i] || 'M0 0'));
    gratRef.current?.setAttribute('d', graticulePath(v));
    }

    function drawArcs(v: View) {
    const [hx, hy, hz] = project(HOME_REGION.lat, HOME_REGION.lon, 1, v);
    if (homeRef.current) {
      homeRef.current.setAttribute('transform', `translate(${hx.toFixed(1)} ${hy.toFixed(1)})`);
      homeRef.current.style.opacity = hz > 0 ? '1' : '0';
    }
    const group = arcsRef.current;
    if (group) {
      for (const g of Array.from(group.children) as SVGGElement[]) {
        const from = g.dataset.from;
        if (!from) continue;
        const { d, head } = arcPath(from, v);
        g.querySelector('.radar-globe__arc')?.setAttribute('d', d || 'M0 0');
        g.querySelector('.radar-globe__arc-glow')?.setAttribute('d', d || 'M0 0');
        const origin = g.querySelector('.radar-globe__origin');
        if (origin) {
          origin.setAttribute('transform', head ? `translate(${head[0].toFixed(1)} ${head[1].toFixed(1)})` : 'translate(-99 -99)');
        }
      }
    }
    }
    // landRefs/gratRef/homeRef/arcsRef are stable ref objects.
  }, []);

  // Selection re-frames the globe on the arc's midpoint (instantly when not rotating).
  useEffect(() => {
    if (!selected) {
      target.current = null;
      return;
    }
    const { mid } = arcPath(selected.from, view.current);
    const next = { lon: mid.lon, lat: Math.max(-10, Math.min(40, mid.lat)) };
    if (rotate) target.current = next;
    else {
      view.current = next;
      draw();
    }
  }, [selected, rotate, draw]);

  // Redraw after React adds/removes arc elements.
  useLayoutEffect(() => {
    draw();
  }, [arcs, draw]);

  // Slow rotation (≈ 30 fps) only while visible on screen.
  useEffect(() => {
    if (!rotate) return;
    const el = svgRef.current;
    if (!el) return;
    let raf = 0;
    let last = 0;
    let onScreen = false;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!onScreen || document.hidden) {
        last = now;
        return;
      }
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      if (dt < 1 / 32) return;
      last = now;
      const v = view.current;
      const tg = target.current;
      if (tg) {
        const k = 1 - Math.exp(-dt * 3);
        v.lon += shortestDelta(v.lon, tg.lon) * k;
        v.lat += (tg.lat - v.lat) * k;
      } else {
        v.lon = (v.lon + dt * 5) % 360;
        v.lat += (DEFAULT_VIEW.lat - v.lat) * (1 - Math.exp(-dt));
      }
      draw();
    };
    const io = new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting));
    io.observe(el);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [rotate, draw]);

  const selectedRegion = selected ? regionById(selected.from) : undefined;

  return (
    <figure className="radar-globe__figure">
      <div className="radar-globe__stage" role="img" aria-label={t('radar.globeLabel', { count: arcs.length })}>
        <svg ref={svgRef} viewBox={`0 0 ${SIZE} ${SIZE}`} className="radar-globe__svg" aria-hidden="true" focusable="false">
          <defs>
            <radialGradient id="rg-sphere" cx="42%" cy="36%" r="70%">
              <stop offset="0%" stopColor="#13213a" />
              <stop offset="70%" stopColor="#0a1222" />
              <stop offset="100%" stopColor="#070b14" />
            </radialGradient>
            <radialGradient id="rg-halo" cx="50%" cy="50%" r="50%">
              <stop offset="78%" stopColor="rgba(53,242,196,0)" />
              <stop offset="86%" stopColor="rgba(53,242,196,0.16)" />
              <stop offset="100%" stopColor="rgba(53,242,196,0)" />
            </radialGradient>
          </defs>
          <circle cx={C} cy={C} r={R + 30} fill="url(#rg-halo)" />
          <circle cx={C} cy={C} r={R} fill="url(#rg-sphere)" className="radar-globe__sphere" />
          <path ref={gratRef} className="radar-globe__grat" />
          <path ref={landRefs[0]} className="radar-globe__land radar-globe__land--far" />
          <path ref={landRefs[1]} className="radar-globe__land radar-globe__land--mid" />
          <path ref={landRefs[2]} className="radar-globe__land radar-globe__land--near" />
          <circle cx={C} cy={C} r={R} className="radar-globe__rim" />
          <g ref={arcsRef} data-selecting={selected ? 'true' : undefined}>
            {arcs.map((e, i) => (
              <g
                key={e.id}
                data-from={e.from}
                className={`radar-globe__arcgroup${selected?.id === e.id ? ' is-selected' : ''}`}
                style={{ ['--cat' as string]: CATEGORY_COLOR_VAR[e.category], ['--age' as string]: i }}
              >
                <path className="radar-globe__arc-glow" />
                <path className="radar-globe__arc" pathLength={1} />
                <circle className="radar-globe__origin" r={selected?.id === e.id ? 4.5 : 3} />
              </g>
            ))}
          </g>
          <g ref={homeRef} className="radar-globe__home">
            <circle r="14" className="radar-globe__pulse" />
            <circle r="14" className="radar-globe__pulse radar-globe__pulse--late" />
            <circle r="6.5" className="radar-globe__home-ring" />
            <circle r="2.6" className="radar-globe__home-core" />
          </g>
        </svg>
      </div>
      <figcaption className="radar-globe__caption">
        {selected && selectedRegion ? (
          <span className="radar-globe__sel" style={{ ['--cat' as string]: CATEGORY_COLOR_VAR[selected.category] }}>
            <i className="radar-dot" aria-hidden="true" />
            {t('radar.globeSelected', { category: t(CAT_LABEL[selected.category]), region: loc(selectedRegion.label) })}
          </span>
        ) : (
          <span className="radar-globe__legend">
            <i className="radar-globe__legend-home" aria-hidden="true" />
            {t('radar.globeHome')}
          </span>
        )}
        <span className="radar-globe__note">{t('radar.globeNote')}</span>
      </figcaption>
    </figure>
  );
}
