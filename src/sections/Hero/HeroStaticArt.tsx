// Static-mode art panel for the hero: the data core drawn as a dotted sphere (same Fibonacci lattice and
// land mask as the 3D globe it becomes), two orbit rings carrying the protected surfaces, and the gateway
// mark at its centre. Pure SVG, no animation — this is the "no WebGL / reduced motion" version of Scene A.
import { memo, useMemo } from 'react';
import { MARK_FRAME, MARK_S } from '../../brand/Logo';
import { fibonacciDots } from '../../lib/geo';
import { useI18n } from '../../i18n';

const C = 260; // centre of the 520×520 viewBox
const R = 168; // sphere radius

interface Dot {
  x: number;
  y: number;
  r: number;
  o: number;
  land: boolean;
}

let cache: Dot[] | null = null;
function sphereDots(): Dot[] {
  if (cache) return cache;
  const tiltX = (-20 * Math.PI) / 180;
  const spinY = (35 * Math.PI) / 180;
  const out: Dot[] = [];
  for (const d of fibonacciDots(900)) {
    const lat = (d.lat * Math.PI) / 180;
    const lon = (d.lon * Math.PI) / 180 + spinY;
    // Unit sphere, then a gentle tilt toward the viewer.
    let x = Math.cos(lat) * Math.sin(lon);
    let y = Math.sin(lat);
    let z = Math.cos(lat) * Math.cos(lon);
    const y2 = y * Math.cos(tiltX) - z * Math.sin(tiltX);
    const z2 = y * Math.sin(tiltX) + z * Math.cos(tiltX);
    y = y2;
    z = z2;
    if (z < -0.05) continue; // back hemisphere hidden
    const depth = (z + 0.05) / 1.05;
    out.push({
      x: C + x * R,
      y: C - y * R,
      r: (d.land ? 1.5 : 0.9) + depth * 1.1,
      o: (d.land ? 0.35 : 0.1) + depth * (d.land ? 0.6 : 0.3),
      land: d.land,
    });
  }
  cache = out;
  return out;
}

/** Points on a tilted ellipse (orbit) for the surface nodes. */
function orbitPoint(angleDeg: number, rx: number, ry: number, rotDeg: number): [number, number] {
  const a = (angleDeg * Math.PI) / 180;
  const rot = (rotDeg * Math.PI) / 180;
  const ex = Math.cos(a) * rx;
  const ey = Math.sin(a) * ry;
  return [C + ex * Math.cos(rot) - ey * Math.sin(rot), C + ex * Math.sin(rot) + ey * Math.cos(rot)];
}

const NODE_ANGLES = [200, 290, 20, 110];

export const HeroStaticArt = memo(function HeroStaticArt() {
  const { t } = useI18n();
  const dots = useMemo(sphereDots, []);
  const surfaces = t('hero.teleSurfaces')
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <figure className="hero-art" data-hr="art">
      <svg className="hero-art__svg" viewBox="0 0 520 520" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="hero-art-core" cx="0.42" cy="0.38" r="0.7">
            <stop offset="0" stopColor="#35f2c4" stopOpacity="0.2" />
            <stop offset="0.55" stopColor="#0e1628" stopOpacity="0.6" />
            <stop offset="1" stopColor="#070b14" stopOpacity="0" />
          </radialGradient>
          <filter id="hero-art-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {/* Outer instrument rings */}
        <circle cx={C} cy={C} r="246" stroke="#f3f6fa" strokeOpacity="0.08" />
        <circle cx={C} cy={C} r="236" stroke="#f3f6fa" strokeOpacity="0.22" strokeDasharray="1 7" />
        <path d={`M${C} 6v18M${C} 496v18M6 ${C}h18M496 ${C}h18`} stroke="#35f2c4" strokeOpacity="0.6" />
        <path d="M120 86A206 206 0 0 1 400 86" stroke="#35f2c4" strokeOpacity="0.5" strokeWidth="1.5" />

        {/* Core */}
        <circle cx={C} cy={C} r={R + 30} fill="url(#hero-art-core)" />
        <circle cx={C} cy={C} r={R} stroke="#35f2c4" strokeOpacity="0.18" />
        <g>
          {dots.map((d, i) => (
            <circle key={i} cx={d.x.toFixed(1)} cy={d.y.toFixed(1)} r={d.r.toFixed(2)} fill={d.land ? '#35f2c4' : '#8592a5'} opacity={d.o.toFixed(2)} />
          ))}
        </g>

        {/* Orbits with the four protected surfaces */}
        <ellipse cx={C} cy={C} rx="232" ry="64" transform={`rotate(-16 ${C} ${C})`} stroke="#35f2c4" strokeOpacity="0.35" />
        <ellipse cx={C} cy={C} rx="210" ry="120" transform={`rotate(24 ${C} ${C})`} stroke="#f3f6fa" strokeOpacity="0.1" strokeDasharray="3 6" />
        {NODE_ANGLES.map((angle, i) => {
          const [x, y] = orbitPoint(angle, 232, 64, -16);
          return (
            <g key={angle}>
              <circle cx={x} cy={y} r="9" fill="#35f2c4" opacity="0.18" filter="url(#hero-art-glow)" />
              <circle cx={x} cy={y} r="4.5" fill="#070b14" stroke="#35f2c4" strokeWidth="1.5" />
              <circle cx={x} cy={y} r="1.6" fill="#35f2c4" />
              <text className="hero-art__node" x={x} y={y + (y > C ? 24 : -14)} textAnchor="middle">
                {surfaces[i] ?? ''}
              </text>
            </g>
          );
        })}

        {/* The gateway mark at the centre of the core */}
        <g transform={`translate(${C - 44} ${C - 46}) scale(1.375)`}>
          <path d={MARK_FRAME} stroke="#35f2c4" strokeWidth="7" opacity="0.35" filter="url(#hero-art-glow)" />
          <path d={MARK_FRAME} stroke="#f3f6fa" strokeWidth="4" strokeLinecap="square" />
          <path d={MARK_S} stroke="#35f2c4" strokeWidth="4" strokeLinecap="square" />
        </g>
      </svg>
      <figcaption className="hero-art__caption">
        <span className="telemetry hero-art__live">
          <i className="hero-tele__dot" aria-hidden="true" />
          {t('hero.teleCore')}
        </span>
        <span className="telemetry">{t('hero.teleScope')}</span>
        <span className="hero-art__note">{t('hero.artCaption')}</span>
      </figcaption>
    </figure>
  );
});
