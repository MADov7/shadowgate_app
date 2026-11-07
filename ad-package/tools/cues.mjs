// SHADOW GATE — 12-second ad: the single source of truth for timing, overlay text, type and placement.
// build.mjs turns this into overlays.json, overlays.srt, the overlay cards in assets/ and the animatic.
// All times are integer frames at 24 fps. "out" is exclusive (the first frame AFTER the element).

export const FPS = 24;
export const TOTAL_FRAMES = 288; // 12.0 s

export const STATUS =
  'VIDEO RENDER: PENDING — no video has been generated; this is the production-ready package for Google Flow.';

/** The five beats, in the required order Hook → Product → Benefit → Brand → CTA. */
export const BEATS = [
  {
    id: 'hook', n: 1, name: 'Hook', in: 0, out: 48,
    action: 'A red threat pulse races toward an exposed digital gateway.',
    camera: 'Slow push-in at eye level, 35 mm.',
  },
  {
    id: 'product', n: 2, name: 'Product', in: 48, out: 120,
    action: 'The camera passes through the gateway; website, email and account nodes resolve and connect.',
    camera: 'Dolly through the gate into a slow orbit right, 35 mm.',
  },
  {
    id: 'benefit', n: 3, name: 'Benefit', in: 120, out: 192,
    action: 'Teal protection layers lock into place and interrupt the simulated threat path.',
    camera: 'Orbit continues with a slight pull-back, 35 mm.',
  },
  {
    id: 'brand', n: 4, name: 'Brand', in: 192, out: 240,
    action: 'Dip through dark; the sealed Shadow Gate gateway resolves, centred, in a dark cinematic hall.',
    camera: 'Locked-off frontal, very slow push-in, 50 mm.',
  },
  {
    id: 'cta', n: 5, name: 'CTA', in: 240, out: 288,
    action: 'The gateway panels slide apart toward a calm teal horizon.',
    camera: 'Steady symmetrical dolly forward on the same 50 mm lens as shot 4.',
  },
];

export const COLORS = {
  navy: '#070B14', navy1: '#0A1020', navy2: '#0E1628', navy3: '#142035', navy4: '#1B2A44',
  teal: '#35F2C4', tealSoft: '#8AF7DA', white: '#F3F6FA', muted: '#A9B4C4', metal: '#1C2638',
  threat: '#FF4D5E', ash: '#6B7688',
};

/** The real mark (src/brand/Logo.tsx) in its 64-unit grid. */
export const MARK = {
  frame: 'M12 58V21L24.5 8.5h15L52 21v37',
  s: 'M41 22.5H24.5v12h15v12H23',
  /** Brand accent derived from the frame's chamfered top ("gate cap"). */
  cap: 'M12 21L24.5 8.5h15L52 21',
  stroke: 5,
};

/** Frame formats. Safe areas are where overlay text must live. */
export const FORMATS = {
  '16x9': {
    w: 1920, h: 1080, label: '16:9 master 1920×1080',
    titleSafe: { x: 96, y: 54, w: 1728, h: 972 }, // 90 %
    actionSafe: { x: 67, y: 38, w: 1786, h: 1004 }, // 93 %
    uiZones: [],
  },
  '9x16': {
    w: 1080, h: 1920, label: '9:16 vertical 1080×1920',
    // Text box kept clear of Reels / Shorts / TikTok chrome: top 260 px, bottom 520 px, 120 px each side.
    titleSafe: { x: 120, y: 260, w: 840, h: 1140 },
    actionSafe: { x: 54, y: 96, w: 972, h: 1728 },
    uiZones: [
      { name: 'Platform top bar', x: 0, y: 0, w: 1080, h: 260 },
      { name: 'Caption, sound and CTA button area', x: 0, y: 1400, w: 1080, h: 520 },
      { name: 'Action rail (like / comment / share)', x: 960, y: 900, w: 120, h: 500 },
    ],
  },
};

/** Typography. Sizes are px at the format's native resolution; pct = share of frame height. */
export const TYPE = {
  en: {
    family: "'SG Manrope', Manrope, 'Manrope Variable', 'Segoe UI', Arial, sans-serif",
    fontName: 'Manrope', weight: 800, sloganWeight: 600, lineHeight: 1.12, tracking: '-0.01em',
    size: { '16x9': 64, '9x16': 72 },
    slogan: { '16x9': 34, '9x16': 42 },
  },
  ar: {
    family: "'SG Tajawal', Tajawal, 'Segoe UI', Tahoma, sans-serif",
    fontName: 'Tajawal', weight: 800, sloganWeight: 500, lineHeight: 1.3, tracking: '0',
    size: { '16x9': 70, '9x16': 80 },
    slogan: { '16x9': 38, '9x16': 46 },
  },
  wordmark: {
    family: "'SG Manrope', Manrope, 'Manrope Variable', 'Segoe UI', Arial, sans-serif",
    weight: 800,
    // Same ratios as public/brand/shadow-gate-lockup.svg (27 px type, 5 px tracking, 10 px gap before GATE).
    trackingEm: 5 / 27, gapEm: 10 / 27,
  },
};

/**
 * Placement per format.
 *  lines   — where the line overlays (hook / product / benefit) sit.
 *  stacked — the brand title card (mark above wordmark), in the upper half: the gate stands below it.
 *  end     — the end card: horizontal lockup, CTA, slogan, also in the upper half above the opening gate.
 */
export const PLACEMENT = {
  '16x9': {
    lines: { anchor: 'bottom', baseline: 936 }, // lower third; last baseline at 86.7 % of frame height
    capScale: 1.6, capGap: 26,
    stacked: { markTop: 150, markSize: 210, wordSize: 72, wordBaseline: 470 },
    end: { lockupCY: 190, lockupMark: 108, ctaBaseline: 380, sloganGap: 72 },
    riseFrac: 0.015,
  },
  '9x16': {
    lines: { anchor: 'top', baseline: 420 }, // upper third, above the gate and clear of platform UI
    capScale: 1.8, capGap: 30,
    stacked: { markTop: 350, markSize: 260, wordSize: 84, wordBaseline: 755 },
    end: { lockupCY: 350, lockupMark: 132, ctaBaseline: 560, sloganGap: 96 },
    riseFrac: 0.01,
  },
};

/**
 * Footage framing targets (where the gateway should sit in each shot), mirrored by the animatic and the prompts.
 * Values are fractions of frame height / width so they apply to any resolution.
 */
export const FRAMING = {
  '16x9': {
    hook: 'gateway centred; base at 73 % of frame height, top at 28 %; lower 20 % kept calm for the line overlay',
    network: 'network centred at 42 % of frame height; nothing important below 70 % (overlay zone)',
    brand: 'gateway in the lower half: top at ~50 %, base at ~89 %; upper 45 % dark and empty for the logo',
    cta: 'same framing as brand; gentle dolly-in (≈10 %) keeps the upper 45 % clear for the end card',
  },
  '9x16': {
    hook: 'gateway centred horizontally; top at ~38 %, base at ~68 %; upper third clear for the overlay',
    network: 'network centred at 52 % of frame height; upper third clear for the overlay',
    brand: 'gateway lower: top at ~44 %, base at ~73 %; upper 42 % dark and empty for the logo',
    cta: 'same framing as brand; gentle dolly-in (≈8 %) keeps the upper 42 % clear for the end card',
  },
};

/**
 * Overlay cues. `groups` = sentences that may enter separately; each group is a list of lines.
 * groupDelay[i] = frames after `in` that group i starts its entry.
 */
export const CUES = [
  {
    id: 'ov1', slug: 'hook', beat: 'hook', kind: 'lines', in: 0, out: 48, fadeIn: 6, fadeOut: 6,
    text: { en: 'One weak point is enough.', ar: 'نقطة ضعف واحدة تكفي.' },
    groups: {
      '16x9': { en: [['One weak point is enough.']], ar: [['نقطة ضعف واحدة تكفي.']] },
      '9x16': { en: [['One weak point', 'is enough.']], ar: [['نقطة ضعف', 'واحدة تكفي.']] },
    },
    groupDelay: [0],
  },
  {
    id: 'ov2', slug: 'product', beat: 'product', kind: 'lines', in: 54, out: 120, fadeIn: 6, fadeOut: 6,
    text: { en: 'Cybersecurity for businesses and individuals.', ar: 'أمن سيبراني للشركات والأفراد.' },
    groups: {
      '16x9': { en: [['Cybersecurity for businesses', 'and individuals.']], ar: [['أمن سيبراني للشركات والأفراد.']] },
      '9x16': { en: [['Cybersecurity for', 'businesses and', 'individuals.']], ar: [['أمن سيبراني', 'للشركات والأفراد.']] },
    },
    groupDelay: [0],
  },
  {
    id: 'ov3', slug: 'benefit', beat: 'benefit', kind: 'lines', in: 126, out: 192, fadeIn: 6, fadeOut: 6,
    text: { en: 'Understand your risks. Strengthen your defenses.', ar: 'افهم مخاطرك. عزّز دفاعاتك.' },
    groups: {
      '16x9': { en: [['Understand your risks.'], ['Strengthen your defenses.']], ar: [['افهم مخاطرك.'], ['عزّز دفاعاتك.']] },
      '9x16': { en: [['Understand your risks.'], ['Strengthen your', 'defenses.']], ar: [['افهم مخاطرك.'], ['عزّز دفاعاتك.']] },
    },
    groupDelay: [0, 12],
  },
  {
    id: 'ov4', slug: 'brand', beat: 'brand', kind: 'stacked', in: 198, out: 246, fadeIn: 18, fadeOut: 6,
    text: { en: 'SHADOW GATE', ar: 'SHADOW GATE' },
    // mark draws on over frames 198–216; wordmark enters 204–216; cross-dissolves into the end-card lockup 240–246
    markDraw: [198, 216], wordIn: [204, 216],
  },
  {
    id: 'ovL', slug: 'endcard-lockup', beat: 'cta', kind: 'lockup', in: 240, out: 288, fadeIn: 6, fadeOut: 0,
    text: { en: 'SHADOW GATE', ar: 'SHADOW GATE' },
  },
  {
    id: 'ov5', slug: 'cta', beat: 'cta', kind: 'cta', in: 240, out: 288, fadeIn: 6, fadeOut: 0,
    text: { en: 'Start with a security assessment.', ar: 'ابدأ بتقييم أمني.' },
    groups: {
      '16x9': { en: [['Start with a security assessment.']], ar: [['ابدأ بتقييم أمني.']] },
      '9x16': { en: [['Start with a', 'security assessment.']], ar: [['ابدأ بتقييم أمني.']] },
    },
    groupDelay: [0],
  },
  {
    id: 'ov6', slug: 'slogan', beat: 'cta', kind: 'slogan', in: 246, out: 288, fadeIn: 6, fadeOut: 0,
    text: { en: 'Your gateway to a safer digital world.', ar: 'حمايتك تبدأ من هنا' },
    groups: {
      '16x9': { en: [['Your gateway to a safer digital world.']], ar: [['حمايتك تبدأ من هنا']] },
      '9x16': { en: [['Your gateway to a safer digital world.']], ar: [['حمايتك تبدأ من هنا']] },
    },
    groupDelay: [0],
  },
];

/** Reference SRT cues (what is on screen when). Cue 4 spans the brand card and the end-card lockup. */
export const SRT_CUES = [
  { n: 1, in: 0, out: 48, cue: 'ov1' },
  { n: 2, in: 54, out: 120, cue: 'ov2' },
  { n: 3, in: 126, out: 192, cue: 'ov3', lines: true },
  { n: 4, in: 198, out: 288, cue: 'ov4' },
  { n: 5, in: 240, out: 288, cue: 'ov5' },
  { n: 6, in: 246, out: 288, cue: 'ov6' },
];

// ---- time helpers ----
export const pad = (n, w = 2) => String(n).padStart(w, '0');
/** SMPTE non-drop timecode HH:MM:SS:FF at 24 fps. */
export function tc(frame) {
  const f = frame % FPS;
  const s = Math.floor(frame / FPS);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f)}`;
}
export const seconds = (frame) => Math.round((frame / FPS) * 1000) / 1000;
/** SRT time HH:MM:SS,mmm */
export function srtTime(frame) {
  const ms = Math.round((frame / FPS) * 1000);
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)},${pad(ms % 1000, 3)}`;
}
