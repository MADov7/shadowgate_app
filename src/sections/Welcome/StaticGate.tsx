// Original SVG gateway drawn from the logo geometry (MARK_FRAME chamfer + MARK_S route, scaled ×8):
// a chamfered metal frame, two leaves carrying the split "S" route, and a teal edge light.
// Shown whenever the 3D gate is not available (loading / static mode). On "opening" the edge light traces
// the frame, the leaves slide into the frame and the view pushes through the opening (pure CSS).
import { memo } from 'react';
import { mulberry32 } from '../../lib/random';
import './StaticGate.css';

// Logo frame M12 58V21L24.5 8.5h15L52 21v37 → x' = (x − 12)·8 + 40, y' = (y − 8.5)·8 + 20
const FRAME = 'M40 416V120L140 20H260L360 120V416';
// Opening (inside the 30px frame band).
const OPENING = 'M55 416V126L146 35H254L345 126V416Z';
const LEAF_L = 'M55 416V126L146 35H200V416Z';
const LEAF_R = 'M200 35H254L345 126V416H200Z';
const EDGE = 'M55 416V126L146 35H254L345 126V416';
// Logo S path M41 22.5H24.5v12h15v12H23 with the same transform.
const ROUTE = 'M272 132H140V228H260V324H128';

const DUST = (() => {
  const rand = mulberry32(2207);
  return Array.from({ length: 34 }, (_, i) => ({
    x: rand() * 100,
    y: rand() * 100,
    r: 0.6 + rand() * 1.4,
    o: 0.15 + rand() * 0.45,
    layer: i % 3,
  }));
})();

interface StaticGateProps {
  state: 'idle' | 'opening';
  /** Faded out (the 3D gate took over). */
  hidden?: boolean;
}

export const StaticGate = memo(function StaticGate({ state, hidden = false }: StaticGateProps) {
  return (
    <div className="sgate" data-state={state} data-hidden={hidden} aria-hidden="true">
      <div className="sgate__floor" />
      <div className="sgate__fog" />
      <svg className="sgate__dust" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[0, 1, 2].map((layer) => (
          <g key={layer} className={`sgate__dust-layer sgate__dust-layer--${layer}`}>
            {DUST.filter((d) => d.layer === layer).map((d, i) => (
              <circle key={i} cx={d.x} cy={d.y} r={d.r * 0.12} opacity={d.o} />
            ))}
          </g>
        ))}
      </svg>

      <div className="sgate__rig">
        <svg className="sgate__svg" viewBox="0 0 400 440" fill="none">
          <defs>
            <linearGradient id="sgate-metal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#33445f" />
              <stop offset="0.45" stopColor="#1a2539" />
              <stop offset="1" stopColor="#0c121e" />
            </linearGradient>
            <linearGradient id="sgate-leaf" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#152036" />
              <stop offset="1" stopColor="#090e19" />
            </linearGradient>
            <linearGradient id="sgate-leaf-sheen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#f3f6fa" stopOpacity="0" />
              <stop offset="0.85" stopColor="#f3f6fa" stopOpacity="0.05" />
              <stop offset="1" stopColor="#35f2c4" stopOpacity="0.16" />
            </linearGradient>
            <linearGradient id="sgate-leaf-sheen-r" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0" stopColor="#f3f6fa" stopOpacity="0" />
              <stop offset="0.85" stopColor="#f3f6fa" stopOpacity="0.05" />
              <stop offset="1" stopColor="#35f2c4" stopOpacity="0.16" />
            </linearGradient>
            <radialGradient id="sgate-beyond" cx="0.5" cy="0.62" r="0.62">
              <stop offset="0" stopColor="#d9fff4" />
              <stop offset="0.18" stopColor="#35f2c4" />
              <stop offset="0.55" stopColor="#0f5f55" stopOpacity="0.7" />
              <stop offset="1" stopColor="#070b14" stopOpacity="0" />
            </radialGradient>
            <filter id="sgate-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <clipPath id="sgate-opening">
              <path d={OPENING} />
            </clipPath>
            <clipPath id="sgate-clip-l">
              <path d={LEAF_L} />
            </clipPath>
            <clipPath id="sgate-clip-r">
              <path d={LEAF_R} />
            </clipPath>
          </defs>

          {/* What lies beyond: calm teal light (revealed as the leaves part). */}
          <g clipPath="url(#sgate-opening)">
            <rect x="40" y="20" width="320" height="400" fill="#05080f" />
            <rect className="sgate__beyond" x="40" y="20" width="320" height="400" fill="url(#sgate-beyond)" />
            <path className="sgate__horizon" d="M55 300H345" stroke="#8af7da" strokeOpacity="0.5" strokeWidth="1" />
          </g>

          {/* Two leaves, each carrying its half of the S route. */}
          <g clipPath="url(#sgate-opening)">
            <g className="sgate__leaf sgate__leaf--l">
              <path d={LEAF_L} fill="url(#sgate-leaf)" />
              <path d={LEAF_L} fill="url(#sgate-leaf-sheen)" />
              <g clipPath="url(#sgate-clip-l)">
                <path className="sgate__route-glow" d={ROUTE} stroke="#35f2c4" strokeWidth="14" filter="url(#sgate-glow)" />
                <path className="sgate__route" d={ROUTE} stroke="#35f2c4" strokeWidth="9" strokeLinecap="square" />
              </g>
              <path d="M70 380H190M70 392H190" stroke="#f3f6fa" strokeOpacity="0.06" />
              <path d="M188 60V400" stroke="#f3f6fa" strokeOpacity="0.07" />
              <text className="sgate__label" x="72" y="404">
                SG·01
              </text>
            </g>
            <g className="sgate__leaf sgate__leaf--r">
              <path d={LEAF_R} fill="url(#sgate-leaf)" />
              <path d={LEAF_R} fill="url(#sgate-leaf-sheen-r)" />
              <g clipPath="url(#sgate-clip-r)">
                <path className="sgate__route-glow" d={ROUTE} stroke="#35f2c4" strokeWidth="14" filter="url(#sgate-glow)" />
                <path className="sgate__route" d={ROUTE} stroke="#35f2c4" strokeWidth="9" strokeLinecap="square" />
              </g>
              <path d="M210 380H330M210 392H330" stroke="#f3f6fa" strokeOpacity="0.06" />
              <path d="M212 60V400" stroke="#f3f6fa" strokeOpacity="0.07" />
            </g>
            {/* Seam light between the closed leaves. */}
            <path className="sgate__seam-glow" d="M200 35V416" stroke="#35f2c4" strokeWidth="8" filter="url(#sgate-glow)" />
            <path className="sgate__seam" d="M200 35V416" stroke="#bafbe9" strokeWidth="1.5" />
          </g>

          {/* Metallic frame band + bevel lines. */}
          <path d={FRAME} stroke="url(#sgate-metal)" strokeWidth="30" strokeLinejoin="miter" />
          <path d="M25 416V114L134 5H266L375 114V416" stroke="#f3f6fa" strokeOpacity="0.14" strokeWidth="1" />
          <path d="M33 416V117L137 13H263L367 117V416" stroke="#f3f6fa" strokeOpacity="0.05" strokeWidth="1" />

          {/* Teal edge light on the inner contour: resting glow, an idle travelling spark, the opening trace. */}
          <path className="sgate__edge-rest" d={EDGE} stroke="#35f2c4" strokeWidth="1.5" />
          <path className="sgate__edge-spark" d={EDGE} pathLength={100} stroke="#8af7da" strokeWidth="2.5" />
          <path className="sgate__edge-trace-glow" d={EDGE} pathLength={100} stroke="#35f2c4" strokeWidth="10" filter="url(#sgate-glow)" />
          <path className="sgate__edge-trace" d={EDGE} pathLength={100} stroke="#d9fff4" strokeWidth="2.5" />

          {/* Base plinth. */}
          <path d="M10 416H390" stroke="#f3f6fa" strokeOpacity="0.18" />
          <path d="M120 426H280" stroke="#35f2c4" strokeOpacity="0.35" />
        </svg>
      </div>
      <div className="sgate__flood" />
    </div>
  );
});
