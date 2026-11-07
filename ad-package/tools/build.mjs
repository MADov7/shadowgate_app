// SHADOW GATE ad package — asset builder.
//
//   node ad-package/tools/build.mjs
//
// Generates, from tools/cues.mjs (the single source of truth):
//   assets/shadow-gate-*.svg        byte-identical copies of public/brand/*.svg + a stacked lockup
//   assets/png/                     transparent PNG renders of the logo files
//   assets/overlays/<fmt>/          transparent overlay title cards (SVG with embedded fonts + PNG), EN and AR
//   overlays.json, overlays.srt, overlays.ar.srt
//   animatic/index.html             self-contained animatic (fonts inlined, no external requests)
// and checks every overlay's text against the format's title-safe area (exit code 1 on a violation).
// Uses only installed dependencies (@playwright/test Chromium for measuring and PNG rendering).
import { chromium } from '@playwright/test';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as C from './cues.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = resolve(HERE, '..');
const ROOT = resolve(PKG, '..');
const NM = join(ROOT, 'node_modules');
const rel = (p) => relative(PKG, p).replace(/\\/g, '/');

// ---------- fonts (SIL OFL 1.1, via Fontsource) ----------
const b64 = (p) => readFileSync(join(NM, p)).toString('base64');
const AR_RANGE =
  'U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC';
const LATIN_RANGE = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212,U+FEFF,U+FFFD';
const F = {
  manrope: b64('@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2'),
  taj800a: b64('@fontsource/tajawal/files/tajawal-arabic-800-normal.woff2'),
  taj800l: b64('@fontsource/tajawal/files/tajawal-latin-800-normal.woff2'),
  taj500a: b64('@fontsource/tajawal/files/tajawal-arabic-500-normal.woff2'),
  taj500l: b64('@fontsource/tajawal/files/tajawal-latin-500-normal.woff2'),
  mono: b64('@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2'),
};
const face = (family, data, weight, range) =>
  `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${data}) format('woff2');font-weight:${weight};font-style:normal;font-display:block${range ? `;unicode-range:${range}` : ''}}`;
const FACE = {
  manrope: face('SG Manrope', F.manrope, '200 800'),
  tajawal: [
    face('SG Tajawal', F.taj800a, 800, AR_RANGE),
    face('SG Tajawal', F.taj800l, 800, LATIN_RANGE),
    face('SG Tajawal', F.taj500a, 500, AR_RANGE),
    face('SG Tajawal', F.taj500l, 500, LATIN_RANGE),
  ].join(''),
  mono: face('SG Mono', F.mono, '100 800'),
};
const fontCSS = (lang) => (lang === 'ar' ? FACE.manrope + FACE.tajawal : FACE.manrope);

// ---------- helpers ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r2 = (n) => Math.round(n * 100) / 100;
const write = (p, data) => {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, data);
};
const cue = (id) => C.CUES.find((c) => c.id === id);
const SHADOW_FILTER =
  '<filter id="sgShadow" x="-15%" y="-60%" width="130%" height="220%" color-interpolation-filters="sRGB">' +
  `<feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${C.COLORS.navy}" flood-opacity="0.55"/>` +
  `<feDropShadow dx="0" dy="6" stdDeviation="14" flood-color="${C.COLORS.navy}" flood-opacity="0.7"/></filter>`;

// ---------- browser (measuring + rendering) ----------
const browser = await chromium.launch();
const page = await browser.newPage();

/** Advance width of the wordmark ("SHADOW" + gap + "GATE") at 27 px, as in public/brand/shadow-gate-lockup.svg. */
async function measureWordmark() {
  await page.setContent(
    `<html><head><style>${FACE.manrope}</style></head><body><svg width="600" height="100"><text id="w" x="0" y="50" font-family="'SG Manrope'" font-size="27" font-weight="800" letter-spacing="5">SHADOW<tspan dx="10">GATE</tspan></text></svg></body></html>`,
  );
  return page.evaluate(async () => {
    await document.fonts.load("800 27px 'SG Manrope'");
    await document.fonts.ready;
    return document.getElementById('w').getComputedTextLength();
  });
}
const WORD27 = await measureWordmark(); // includes the trailing 5 px of tracking
const WORD_VISUAL = (size) => (WORD27 - 5) * (size / 27);

// ---------- card markup ----------
const P = C.PLACEMENT;

function textAttrs(lang, size, weight, fill) {
  const t = C.TYPE[lang];
  const dir = lang === 'ar' ? ' direction="rtl" unicode-bidi="embed"' : '';
  const ls = t.tracking !== '0' ? ` letter-spacing="${t.tracking}"` : '';
  return `font-family="${esc(t.family)}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="middle"${ls}${dir}`;
}

/** Baselines for a list of lines in a format. */
function lineBaselines(fmt, lang, n, anchor, ref) {
  const t = C.TYPE[lang];
  const lh = t.size[fmt] * t.lineHeight;
  return Array.from({ length: n }, (_, i) => (anchor === 'bottom' ? ref - (n - 1 - i) * lh : ref + i * lh));
}

function capMarkup(fmt, lang, firstBaseline) {
  const s = P[fmt].capScale;
  const size = C.TYPE[lang].size[fmt];
  const top = firstBaseline - size * 0.74; // approximate cap top
  const bottomY = top - P[fmt].capGap;
  const tx = C.FORMATS[fmt].w / 2 - 32 * s;
  const ty = bottomY - 21 * s;
  return `<g data-part="cap"><path d="${C.MARK.cap}" transform="translate(${r2(tx)} ${r2(ty)}) scale(${s})" fill="none" stroke="${C.COLORS.teal}" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linecap="square" stroke-linejoin="miter"/></g>`;
}

function linesMarkup(c, fmt, lang, baselines, { size, weight, fill, withCap }) {
  const groups = c.groups[fmt][lang];
  const W = C.FORMATS[fmt].w;
  let i = 0;
  let out = withCap ? capMarkup(fmt, lang, baselines[0]) : '';
  groups.forEach((g, gi) => {
    out += `<g data-part="g${gi}" filter="url(#sgShadow)">`;
    for (const line of g) {
      out += `<text x="${W / 2}" y="${r2(baselines[i++])}" ${textAttrs(lang, size, weight, fill)}>${esc(line)}</text>`;
    }
    out += '</g>';
  });
  return out;
}

function ctaBaselines(fmt, lang) {
  const n = cue('ov5').groups[fmt][lang].flat().length;
  return lineBaselines(fmt, lang, n, 'top', P[fmt].end.ctaBaseline);
}

function markPaths(strokeW = C.MARK.stroke, frame = C.COLORS.white, path = C.COLORS.teal) {
  return (
    `<path data-draw="1" pathLength="1" d="${C.MARK.frame}" fill="none" stroke="${frame}" stroke-width="${strokeW}" stroke-linecap="square" stroke-linejoin="miter"/>` +
    `<path data-draw="1" pathLength="1" d="${C.MARK.s}" fill="none" stroke="${path}" stroke-width="${strokeW}" stroke-linecap="square" stroke-linejoin="miter"/>`
  );
}

function wordmarkText(x, baseline, size) {
  const w = C.TYPE.wordmark;
  return `<text x="${r2(x)}" y="${r2(baseline)}" font-family="${esc(w.family)}" font-size="${size}" font-weight="${w.weight}" letter-spacing="${r2(w.trackingEm * size)}" fill="${C.COLORS.white}">SHADOW<tspan dx="${r2(w.gapEm * size)}" fill="${C.COLORS.teal}">GATE</tspan></text>`;
}

/** Horizontal lockup centred on (cx, cy) with the given mark height — geometry of public/brand/shadow-gate-lockup.svg. */
function lockupMarkup(cx, cy, markH) {
  const k = markH / 64;
  const centreU = (9.5 + 72 + (WORD27 - 5)) / 2; // visual centre in lockup units
  const tx = cx - centreU * k;
  const ty = cy - 33.3 * k;
  return (
    `<g transform="translate(${r2(tx)} ${r2(ty)}) scale(${r2(k)})">` +
    markPaths() +
    `<text x="72" y="43" font-family="${esc(C.TYPE.wordmark.family)}" font-size="27" font-weight="800" letter-spacing="5" fill="${C.COLORS.white}">SHADOW<tspan fill="${C.COLORS.teal}" dx="10">GATE</tspan></text>` +
    '</g>'
  );
}

/** Inner markup of one overlay card (shared by the card files and the animatic). */
function cardInner(c, fmt, lang) {
  const W = C.FORMATS[fmt].w;
  const t = C.TYPE[lang];
  const p = P[fmt];
  let body = '';
  if (c.kind === 'lines') {
    const n = c.groups[fmt][lang].flat().length;
    const bl = lineBaselines(fmt, lang, n, p.lines.anchor, p.lines.baseline);
    body = linesMarkup(c, fmt, lang, bl, { size: t.size[fmt], weight: t.weight, fill: C.COLORS.white, withCap: true });
  } else if (c.kind === 'cta') {
    body = linesMarkup(c, fmt, lang, ctaBaselines(fmt, lang), { size: t.size[fmt], weight: t.weight, fill: C.COLORS.white, withCap: false });
  } else if (c.kind === 'slogan') {
    const cta = ctaBaselines(fmt, lang);
    const y = cta[cta.length - 1] + p.end.sloganGap * (lang === 'ar' ? 1.2 : 1); // Tajawal sits deeper: a little more air
    body = linesMarkup(c, fmt, lang, [y], { size: t.slogan[fmt], weight: t.sloganWeight, fill: C.COLORS.muted, withCap: false });
  } else if (c.kind === 'stacked') {
    const st = p.stacked;
    const k = st.markSize / 64;
    const mark = `<g data-part="mark" transform="translate(${r2(W / 2 - st.markSize / 2)} ${st.markTop}) scale(${r2(k)})">${markPaths()}</g>`;
    const word = `<g data-part="word" filter="url(#sgShadow)">${wordmarkText(W / 2 - WORD_VISUAL(st.wordSize) / 2, st.wordBaseline, st.wordSize)}</g>`;
    body = mark + word;
  } else if (c.kind === 'lockup') {
    body = `<g data-part="lockup" filter="url(#sgShadow)">${lockupMarkup(W / 2, p.end.lockupCY, p.end.lockupMark)}</g>`;
  }
  return `<g data-cue="${c.id}">${body}</g>`;
}

function solidBackground(fmt) {
  const { w, h } = C.FORMATS[fmt];
  const hy = fmt === '16x9' ? 760 : 1250;
  return (
    `<defs><radialGradient id="sgHz" cx="50%" cy="${r2((hy / h) * 100)}%" r="60%" gradientTransform="translate(0 0)"><stop offset="0" stop-color="${C.COLORS.teal}" stop-opacity="0.22"/><stop offset="0.45" stop-color="${C.COLORS.teal}" stop-opacity="0.06"/><stop offset="1" stop-color="${C.COLORS.teal}" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="${C.COLORS.navy}"/>` +
    `<rect width="${w}" height="${h}" fill="url(#sgHz)"/>` +
    `<rect x="0" y="${hy}" width="${w}" height="2" fill="${C.COLORS.tealSoft}" opacity="0.35"/>`
  );
}

function svgDoc(fmt, { title, desc, fonts, inner, background = '' }) {
  const { w, h } = C.FORMATS[fmt];
  const style = fonts ? `<style><![CDATA[${fonts}]]></style>` : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">` +
    `<title>${esc(title)}</title><desc>${esc(desc)}</desc>` +
    `<defs>${style}${SHADOW_FILTER}</defs>${background}${inner}</svg>\n`
  );
}

// ---------- outputs ----------
const ASSETS = join(PKG, 'assets');
const OVERLAYS = join(ASSETS, 'overlays');
const report = { safe: [], files: [] };

/** Render an SVG string to a transparent PNG and return the screen boxes of its text / cap elements. */
async function renderPNG(svg, w, h, outPng, extraCSS = '') {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(
    `<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block}${extraCSS}</style></head><body>${svg}</body></html>`,
  );
  const boxes = await page.evaluate(async () => {
    const fams = ["800 64px 'SG Manrope'", "600 32px 'SG Manrope'", "800 64px 'SG Tajawal'", "500 32px 'SG Tajawal'", '800 27px Manrope'];
    for (const f of fams) {
      try {
        await document.fonts.load(f, 'Aa نص');
      } catch {
        /* family not present in this card */
      }
    }
    await document.fonts.ready;
    return [...document.querySelectorAll('text, [data-part="cap"] path, [data-part="mark"] path, [data-part="lockup"] path')].map((el) => {
      const r = el.getBoundingClientRect();
      return { tag: el.tagName, text: el.textContent, x: r.x, y: r.y, w: r.width, h: r.height };
    });
  });
  const shot = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
  write(outPng, shot);
  return boxes;
}

function checkSafe(fmt, file, boxes) {
  const s = C.FORMATS[fmt].titleSafe;
  for (const b of boxes) {
    const ok = b.x >= s.x - 0.5 && b.y >= s.y - 0.5 && b.x + b.w <= s.x + s.w + 0.5 && b.y + b.h <= s.y + s.h + 0.5;
    const rail = C.FORMATS[fmt].uiZones.find(
      (z) => b.x < z.x + z.w && b.x + b.w > z.x && b.y < z.y + z.h && b.y + b.h > z.y,
    );
    report.safe.push({ fmt, file, el: b.text ? b.text.slice(0, 40) : b.tag, ok: ok && !rail, rail: rail?.name, box: [b.x, b.y, b.w, b.h].map(Math.round) });
  }
}

// 1) Brand files: byte-identical copies + stacked lockup + PNG renders.
const BRAND_SRC = join(ROOT, 'public', 'brand');
for (const f of readdirSync(BRAND_SRC).filter((f) => f.endsWith('.svg'))) {
  copyFileSync(join(BRAND_SRC, f), join(ASSETS, f));
  report.files.push(`assets/${f}`);
}
{
  const size = 30;
  const wordW = WORD_VISUAL(size);
  const vw = Math.ceil(Math.max(64, wordW) + 40);
  const vh = 128;
  const stacked =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}" fill="none"><title>SHADOW GATE (stacked lockup)</title>` +
    `<defs><style><![CDATA[${FACE.manrope}]]></style></defs>` +
    `<g transform="translate(${r2(vw / 2 - 32)} 0)">${markPaths().replace(/ data-draw="1" pathLength="1"/g, '')}</g>` +
    wordmarkText(vw / 2 - wordW / 2, 112, size) +
    '</svg>\n';
  write(join(ASSETS, 'shadow-gate-lockup-stacked.svg'), stacked);
  report.files.push('assets/shadow-gate-lockup-stacked.svg');

  const sized = (svg, w, h) => svg.replace('<svg ', `<svg width="${w}" height="${h}" `);
  const brandCSS = `@font-face{font-family:'Manrope';src:url(data:font/woff2;base64,${F.manrope}) format('woff2');font-weight:200 800}`;
  const mark = readFileSync(join(BRAND_SRC, 'shadow-gate-mark.svg'), 'utf8');
  const mono = readFileSync(join(BRAND_SRC, 'shadow-gate-mark-mono.svg'), 'utf8');
  const lock = readFileSync(join(BRAND_SRC, 'shadow-gate-lockup.svg'), 'utf8');
  await renderPNG(sized(mark, 1024, 1024), 1024, 1024, join(ASSETS, 'png', 'shadow-gate-mark-1024.png'));
  await renderPNG(sized(mono, 1024, 1024), 1024, 1024, join(ASSETS, 'png', 'shadow-gate-mark-mono-1024.png'));
  await renderPNG(sized(lock, 2160, 384), 2160, 384, join(ASSETS, 'png', 'shadow-gate-lockup-2160.png'), brandCSS);
  await renderPNG(sized(stacked, vw * 6, vh * 6), vw * 6, vh * 6, join(ASSETS, 'png', 'shadow-gate-lockup-stacked.png'));
  report.files.push(
    'assets/png/shadow-gate-mark-1024.png',
    'assets/png/shadow-gate-mark-mono-1024.png',
    'assets/png/shadow-gate-lockup-2160.png',
    'assets/png/shadow-gate-lockup-stacked.png',
  );
}

// 2) Overlay cards.
const fragments = { '16x9': { en: {}, ar: {} }, '9x16': { en: {}, ar: {} } };
const assetIndex = {}; // cueId -> fmt -> lang -> { svg, png }
const LANG_NEUTRAL = new Set(['ov4', 'ovL']);

for (const fmt of Object.keys(C.FORMATS)) {
  const { w, h } = C.FORMATS[fmt];
  for (const lang of ['en', 'ar']) {
    for (const c of C.CUES) {
      const inner = cardInner(c, fmt, lang);
      fragments[fmt][lang][c.id] = inner;
      if (lang === 'ar' && LANG_NEUTRAL.has(c.id)) {
        (assetIndex[c.id] ??= {})[fmt] ??= {};
        assetIndex[c.id][fmt].ar = assetIndex[c.id][fmt].en; // same Latin lockup in both versions
        continue;
      }
      const base = LANG_NEUTRAL.has(c.id) ? `${c.id}-${c.slug}` : `${c.id}-${c.slug}_${lang}`;
      const svgPath = join(OVERLAYS, fmt, `${base}.svg`);
      const pngPath = join(OVERLAYS, fmt, `${base}.png`);
      const svg = svgDoc(fmt, {
        title: `SHADOW GATE ad overlay ${c.id} ${c.slug} (${fmt.replace('x', ':')}${LANG_NEUTRAL.has(c.id) ? '' : `, ${lang.toUpperCase()}`})`,
        desc: `Transparent overlay. Text: "${c.text[lang]}". In ${C.tc(c.in)} → out ${C.tc(c.out)} at 24 fps. Source: ad-package/tools/cues.mjs`,
        fonts: c.kind === 'stacked' || c.kind === 'lockup' ? FACE.manrope : fontCSS(lang),
        inner,
      });
      write(svgPath, svg);
      checkSafe(fmt, rel(svgPath), await renderPNG(svg, w, h, pngPath));
      (assetIndex[c.id] ??= {})[fmt] ??= {};
      assetIndex[c.id][fmt][lang] = { svg: rel(svgPath), png: rel(pngPath) };
      report.files.push(rel(svgPath), rel(pngPath));
    }
    // Benefit, one sentence per file (for the staggered entry in simple editors).
    const ben = cue('ov3');
    for (const gi of [0, 1]) {
      const inner = cardInner(ben, fmt, lang).replace(new RegExp(`<g data-part="g${1 - gi}"[^>]*>.*?</g>`), '');
      const keepCap = gi === 0 ? inner : inner.replace(/<g data-part="cap">.*?<\/g>/, '');
      const base = `ov3-benefit-line${gi + 1}_${lang}`;
      const svg = svgDoc(fmt, {
        title: `SHADOW GATE ad overlay ov3 benefit, sentence ${gi + 1} only (${fmt.replace('x', ':')}, ${lang.toUpperCase()})`,
        desc: `Transparent overlay. Same position as ov3-benefit. In ${C.tc(ben.in + ben.groupDelay[gi])} → out ${C.tc(ben.out)} at 24 fps.`,
        fonts: fontCSS(lang),
        inner: keepCap,
      });
      const svgPath = join(OVERLAYS, fmt, `${base}.svg`);
      const pngPath = join(OVERLAYS, fmt, `${base}.png`);
      write(svgPath, svg);
      checkSafe(fmt, rel(svgPath), await renderPNG(svg, w, h, pngPath));
      report.files.push(rel(svgPath), rel(pngPath));
    }
    // End card composite (lockup + CTA + slogan), transparent and solid.
    const endInner = ['ovL', 'ov5', 'ov6'].map((id) => cardInner(cue(id), fmt, lang)).join('');
    for (const solid of [false, true]) {
      const base = `endcard_${lang}${solid ? '_solid' : ''}`;
      const svg = svgDoc(fmt, {
        title: `SHADOW GATE ad end card (${fmt.replace('x', ':')}, ${lang.toUpperCase()}${solid ? ', solid' : ''})`,
        desc: `Logo lockup + "${cue('ov5').text[lang]}" + "${cue('ov6').text[lang]}". On screen ${C.tc(240)} → ${C.tc(288)} at 24 fps.`,
        fonts: fontCSS(lang),
        inner: endInner,
        background: solid ? solidBackground(fmt) : '',
      });
      const svgPath = join(OVERLAYS, fmt, `${base}.svg`);
      const pngPath = join(OVERLAYS, fmt, `${base}.png`);
      write(svgPath, svg);
      checkSafe(fmt, rel(svgPath), await renderPNG(svg, w, h, pngPath));
      report.files.push(rel(svgPath), rel(pngPath));
    }
  }
  // Legibility scrims (no text).
  const scrims = {
    '16x9': [
      ['scrim-lower', `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0.5" stop-color="${C.COLORS.navy}" stop-opacity="0"/><stop offset="1" stop-color="${C.COLORS.navy}" stop-opacity="0.62"/></linearGradient>`],
      ['scrim-upper', `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.COLORS.navy}" stop-opacity="0.55"/><stop offset="0.55" stop-color="${C.COLORS.navy}" stop-opacity="0"/></linearGradient>`],
      ['scrim-vignette', `<radialGradient id="g" cx="50%" cy="48%" r="75%"><stop offset="0.35" stop-color="${C.COLORS.navy}" stop-opacity="0"/><stop offset="1" stop-color="${C.COLORS.navy}" stop-opacity="0.7"/></radialGradient>`],
    ],
    '9x16': [
      ['scrim-upper', `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.COLORS.navy}" stop-opacity="0.6"/><stop offset="0.42" stop-color="${C.COLORS.navy}" stop-opacity="0"/></linearGradient>`],
      ['scrim-vignette', `<radialGradient id="g" cx="50%" cy="45%" r="80%"><stop offset="0.35" stop-color="${C.COLORS.navy}" stop-opacity="0"/><stop offset="1" stop-color="${C.COLORS.navy}" stop-opacity="0.7"/></radialGradient>`],
    ],
  };
  for (const [name, grad] of scrims[fmt]) {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><title>SHADOW GATE ad ${name} (${fmt.replace('x', ':')})</title>` +
      `<defs>${grad}</defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>\n`;
    const svgPath = join(OVERLAYS, fmt, `${name}.svg`);
    write(svgPath, svg);
    await renderPNG(svg, w, h, join(OVERLAYS, fmt, `${name}.png`));
    report.files.push(rel(svgPath), rel(join(OVERLAYS, fmt, `${name}.png`)));
  }
}

// 3) overlays.json + SRT.
const pct = (px, fmt) => r2((px / C.FORMATS[fmt].h) * 100);
const time = (f) => ({ frame: f, timecode: C.tc(f), seconds: C.seconds(f) });
const json = {
  project: 'SHADOW GATE — 12-second ad (Google Flow package)',
  status: C.STATUS,
  fps: C.FPS,
  totalFrames: C.TOTAL_FRAMES,
  durationSeconds: C.TOTAL_FRAMES / C.FPS,
  timeConvention: 'Frames at 24 fps. "out" is exclusive: the first frame after the element (NLE mark-out).',
  beats: C.BEATS.map((b) => ({ n: b.n, id: b.id, name: b.name, in: time(b.in), out: time(b.out), frames: b.out - b.in, durationSeconds: (b.out - b.in) / C.FPS })),
  formats: Object.fromEntries(
    Object.entries(C.FORMATS).map(([k, f]) => [k, { width: f.w, height: f.h, titleSafe: f.titleSafe, actionSafe: f.actionSafe, platformUiZones: f.uiZones }]),
  ),
  fonts: {
    en: { family: 'Manrope', weights: [800, 600], source: '@fontsource-variable/manrope (SIL OFL 1.1)' },
    ar: { family: 'Tajawal', weights: [800, 500], source: '@fontsource/tajawal (SIL OFL 1.1)' },
    wordmark: { family: 'Manrope', weight: 800, tracking: '0.185em', gapBeforeGATE: '0.37em' },
  },
  cues: C.CUES.map((c) => {
    const kindStyle = (fmt, lang) => {
      const t = C.TYPE[lang];
      if (c.kind === 'stacked') {
        const st = P[fmt].stacked;
        return { markSizePx: st.markSize, markSizePctOfFrameHeight: pct(st.markSize, fmt), wordmarkSizePx: st.wordSize, wordmarkSizePctOfFrameHeight: pct(st.wordSize, fmt) };
      }
      if (c.kind === 'lockup') {
        const m = P[fmt].end.lockupMark;
        return { lockupMarkHeightPx: m, lockupMarkHeightPctOfFrameHeight: pct(m, fmt) };
      }
      const size = c.kind === 'slogan' ? t.slogan[fmt] : t.size[fmt];
      return {
        font: t.fontName,
        weight: c.kind === 'slogan' ? t.sloganWeight : t.weight,
        sizePx: size,
        sizePctOfFrameHeight: pct(size, fmt),
        lineHeight: t.lineHeight,
        tracking: t.tracking,
        color: c.kind === 'slogan' ? C.COLORS.muted : C.COLORS.white,
        align: 'centre',
        direction: lang === 'ar' ? 'rtl' : 'ltr',
      };
    };
    const placement = (fmt) => {
      const p = P[fmt];
      if (c.kind === 'lines') return p.lines.anchor === 'bottom' ? `lower third, centred; last baseline at y=${p.lines.baseline} (${pct(p.lines.baseline, fmt)} % of height); teal gate-cap accent above` : `upper third, centred; first baseline at y=${p.lines.baseline} (${pct(p.lines.baseline, fmt)} % of height); teal gate-cap accent above`;
      if (c.kind === 'stacked') return `centred stacked lockup; mark top at y=${p.stacked.markTop}, wordmark baseline y=${p.stacked.wordBaseline}`;
      if (c.kind === 'lockup') return `end card: horizontal lockup centred at y=${p.end.lockupCY}`;
      if (c.kind === 'cta') return `end card: centred, first baseline y=${p.end.ctaBaseline}`;
      return `end card: centred, ${p.end.sloganGap}px below the last CTA baseline`;
    };
    const animation =
      c.kind === 'stacked'
        ? { in: `mark strokes draw on frames ${c.markDraw[0]}–${c.markDraw[1]} (ease-out); wordmark fades + rises frames ${c.wordIn[0]}–${c.wordIn[1]}`, out: `cross-dissolve into the end-card lockup, frames 240–246` }
        : {
            in: `fade 0→100 % + rise ${P['16x9'].riseFrac * 100} % of frame height (16:9) / ${P['9x16'].riseFrac * 100} % (9:16) over ${c.fadeIn} frames, ease-out` + (c.groupDelay?.[1] ? `; sentence 2 starts ${c.groupDelay[1]} frames later` : ''),
            out: c.fadeOut ? `fade 100→0 % over the last ${c.fadeOut} frames` : 'holds to the final frame (no fade-out)',
          };
    return {
      id: c.id,
      slug: c.slug,
      beat: c.beat,
      kind: c.kind,
      text: c.text,
      in: time(c.in),
      out: time(c.out),
      durationSeconds: (c.out - c.in) / C.FPS,
      fadeInFrames: c.fadeIn,
      fadeOutFrames: c.fadeOut,
      ...(c.groups ? { lines: Object.fromEntries(Object.keys(C.FORMATS).map((fmt) => [fmt, { en: c.groups[fmt].en.flat(), ar: c.groups[fmt].ar.flat() }])) } : {}),
      ...(c.groupDelay?.length > 1 ? { sentenceStartFrames: c.groupDelay.map((d) => c.in + d) } : {}),
      style: Object.fromEntries(Object.keys(C.FORMATS).map((fmt) => [fmt, { en: kindStyle(fmt, 'en'), ar: kindStyle(fmt, 'ar') }])),
      placement: Object.fromEntries(Object.keys(C.FORMATS).map((fmt) => [fmt, placement(fmt)])),
      animation,
      assets: assetIndex[c.id],
    };
  }),
  endCard: Object.fromEntries(
    Object.keys(C.FORMATS).map((fmt) => [fmt, Object.fromEntries(['en', 'ar'].map((l) => [l, { transparent: `assets/overlays/${fmt}/endcard_${l}.svg`, solid: `assets/overlays/${fmt}/endcard_${l}_solid.svg` }]))]),
  ),
};
write(join(PKG, 'overlays.json'), JSON.stringify(json, null, 2) + '\n');

for (const lang of ['en', 'ar']) {
  const lines = C.SRT_CUES.map((s) => {
    const c = cue(s.cue);
    const text = s.lines ? c.groups['16x9'][lang].map((g) => g.join(' ')).join('\n') : c.text[lang];
    return `${s.n}\n${C.srtTime(s.in)} --> ${C.srtTime(s.out)}\n${text}\n`;
  });
  write(join(PKG, lang === 'en' ? 'overlays.srt' : 'overlays.ar.srt'), lines.join('\n'));
}

// 4) Animatic.
const tpl = readFileSync(join(HERE, 'animatic.template.html'), 'utf8');
const data = {
  status: C.STATUS,
  fps: C.FPS,
  total: C.TOTAL_FRAMES,
  beats: C.BEATS,
  cues: C.CUES.map(({ id, slug, beat, kind, in: i, out, fadeIn, fadeOut, groupDelay, markDraw, wordIn, text }) => ({ id, slug, beat, kind, in: i, out, fadeIn, fadeOut, groupDelay, markDraw, wordIn, text })),
  formats: C.FORMATS,
  placement: C.PLACEMENT,
  colors: C.COLORS,
  mark: C.MARK,
  fragments,
};
const html = tpl
  .replace('/*__FONT_CSS__*/', FACE.manrope + FACE.tajawal + FACE.mono)
  .replace('/*__SHADOW_FILTER__*/', SHADOW_FILTER)
  .replace('/*__DATA__*/null', JSON.stringify(data));
if (html.includes('__DATA__') || html.includes('__FONT_CSS__')) throw new Error('animatic template markers not replaced');
write(join(PKG, 'animatic', 'index.html'), html);
report.files.push('animatic/index.html', 'overlays.json', 'overlays.srt', 'overlays.ar.srt');

await browser.close();

// ---------- report ----------
const bad = report.safe.filter((s) => !s.ok);
console.log(`Wordmark advance @27px: ${r2(WORD27)} px`);
console.log(`Files written: ${report.files.length}`);
console.log(`Safe-area checks: ${report.safe.length} elements, ${bad.length} outside the title-safe area / in a platform UI zone`);
for (const b of bad) console.log('  ✗', b.fmt, b.file, JSON.stringify(b.el), b.box.join(','), b.rail ?? '');
const widest = {};
for (const s of report.safe) {
  if (!s.el || s.el === 'path') continue;
  const k = s.fmt;
  if (!widest[k] || s.box[2] > widest[k].box[2]) widest[k] = s;
}
for (const [k, s] of Object.entries(widest)) console.log(`  widest text in ${k}: ${s.box[2]} px — "${s.el}" (${s.file})`);
if (bad.length) process.exitCode = 1;
