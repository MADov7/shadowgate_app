// Static SVG of the company network (static experience): core + four nodes, each wrapped in a shell,
// and an outer ring for the ongoing review. Purely illustrative — the ordered list beside it carries the content.
import { MARK_FRAME, MARK_S } from '../../brand/Logo';
import { useI18n, type TKey } from '../../i18n';
import type { LayerKey } from '../../lib/choreo';

const C = 240;
const NODE_R = 128;
const RING_R = 212;

type NodeKey = Exclude<LayerKey, 'ongoing'>;
// Nodes spread wide (±30° / ±150°) so the space under the core stays free for its label.
const NODES: ReadonlyArray<{ key: NodeKey; angle: number; label: TKey }> = [
  { key: 'website', angle: -150, label: 'layers.websiteShort' },
  { key: 'email', angle: -30, label: 'layers.emailShort' },
  { key: 'cloud', angle: 30, label: 'layers.cloudShort' },
  { key: 'accounts', angle: 150, label: 'layers.accountsShort' },
];

const polar = (r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};

/** Chamfered square (echoes the gateway mark) centred on x,y. */
function chamfer(x: number, y: number, s: number, k: number): string {
  return `M${x - s + k} ${y - s}H${x + s - k}L${x + s} ${y - s + k}V${y + s - k}L${x + s - k} ${y + s}H${x - s + k}L${x - s} ${y + s - k}V${y - s + k}Z`;
}

export function NetworkDiagram({ active }: { active?: number }) {
  const { t, isAr } = useI18n();
  // Mirror in RTL so the numbering reads from the top-right, like the text.
  const dir = (deg: number) => (isAr ? 180 - deg : deg);
  return (
    <svg className="layers-svg" viewBox="0 0 480 480" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="layers-svg-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#35F2C4" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#35F2C4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="layers-svg-shell" cx="50%" cy="50%" r="50%">
          <stop offset="62%" stopColor="#35F2C4" stopOpacity="0" />
          <stop offset="100%" stopColor="#35F2C4" stopOpacity="0.16" />
        </radialGradient>
      </defs>

      {/* Orbit guides */}
      <circle cx={C} cy={C} r={92} className="layers-svg__guide" />
      <circle cx={C} cy={C} r={170} className="layers-svg__guide" />

      {/* 05 — ongoing review: the outer ring around everything */}
      <circle
        cx={C}
        cy={C}
        r={RING_R}
        className="layers-svg__ring"
        data-on={active === undefined || active >= 4 ? 'true' : 'false'}
      />
      <g transform={`translate(${C} ${C - RING_R})`}>
        <rect x={-58} y={-13} width={116} height={26} rx={13} className="layers-svg__pill" />
        <text y={4.5} textAnchor="middle" className="layers-svg__pilltext">
          {`05 · ${t('layers.ongoingShort')}`}
        </text>
      </g>

      {/* Links core → nodes with small packets */}
      {NODES.map(({ key, angle }) => {
        const [x1, y1] = polar(58, dir(angle));
        const [x2, y2] = polar(NODE_R - 44, dir(angle));
        const [px, py] = polar(84, dir(angle));
        return (
          <g key={`link-${key}`}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className="layers-svg__link" />
            <circle cx={px} cy={py} r={2.6} className="layers-svg__packet" />
          </g>
        );
      })}

      {/* Nodes 01–04, each inside its shell */}
      {NODES.map(({ key, angle, label }, i) => {
        const [x, y] = polar(NODE_R, dir(angle));
        const on = active === undefined || active >= i;
        const below = y > C;
        return (
          <g key={key} className="layers-svg__node" data-on={on ? 'true' : 'false'}>
            <circle cx={x} cy={y} r={46} fill="url(#layers-svg-shell)" className="layers-svg__shell" />
            <circle cx={x} cy={y} r={54} className="layers-svg__shell2" />
            <path d={chamfer(x, y, 21, 7)} className="layers-svg__body" />
            <text x={x} y={y + 4.5} textAnchor="middle" className="layers-svg__num">
              {String(i + 1).padStart(2, '0')}
            </text>
            <text x={x} y={below ? y + 76 : y - 66} textAnchor="middle" className="layers-svg__label">
              {t(label)}
            </text>
          </g>
        );
      })}

      {/* Core — the business, marked with the gateway */}
      <circle cx={C} cy={C} r={74} fill="url(#layers-svg-core)" />
      <circle cx={C} cy={C} r={50} className="layers-svg__core" />
      <g transform={`translate(${C - 24} ${C - 25}) scale(0.75)`}>
        <path d={MARK_FRAME} className="layers-svg__mark-frame" />
        <path d={MARK_S} className="layers-svg__mark-s" />
      </g>
      <text x={C} y={C + 74} textAnchor="middle" className="layers-svg__corelabel">
        {t('layers.coreLabel')}
      </text>
    </svg>
  );
}
