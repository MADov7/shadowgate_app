// Real-GPU sweep: screenshots every section and builds a contact sheet (shots/sweep-<tag>.jpg).
//   node scripts/sweep.mjs [tag] [query] [--mobile]
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const tag = process.argv[2] ?? 'desk';
const query = process.argv[3] ?? '';
const mobile = process.argv.includes('--mobile');
const port = process.env.PORT ?? '5190';
const W = mobile ? 390 : 1440;
const H = mobile ? 844 : 900;
const stops = [
  ['home', 0], ['radar', 0.15], ['radar', 0.7], ['layers', 0.3], ['layers', 0.8], ['simulation', 0],
  ['explore', 0.1], ['explore', 0.7], ['catalog', 0], ['quiz', 0], ['packages', 0], ['build', 0.5],
  ['personal', 0], ['contact', 0], ['about-brand', 0], ['footer', 0],
];
mkdirSync(`shots/sweep-${tag}`, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
await page.goto(`http://localhost:${port}/?intro=0${query ? '&' + query : ''}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const files = [];
for (const [id, f] of stops) {
  await page.evaluate(([sid, frac]) => {
    const el = sid === 'footer' ? document.querySelector('footer') : document.getElementById(sid);
    if (!el) return;
    const y = el.getBoundingClientRect().top + scrollY + Math.max(0, el.offsetHeight - innerHeight) * frac;
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true });
    else scrollTo(0, y);
  }, [id, f]);
  await page.waitForTimeout(1200);
  const file = `shots/sweep-${tag}/${String(files.length).padStart(2, '0')}-${id}-${f}.jpg`;
  await page.screenshot({ path: file, type: 'jpeg', quality: 80 });
  files.push(file);
}
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
await browser.close();
const cols = 4;
const tw = mobile ? 260 : 480;
const th = Math.round((tw * H) / W);
const inputs = files.flatMap((f) => ['-i', f]);
let filter = files.map((_, i) => `[${i}]scale=${tw}:${th}[v${i}];`).join('');
const rows = [];
for (let r = 0; r < Math.ceil(files.length / cols); r++) {
  const idx = [...Array(cols).keys()].map((c) => r * cols + c).filter((i) => i < files.length);
  filter += idx.map((i) => `[v${i}]`).join('') + `hstack=${idx.length}[r${r}];`;
  rows.push(`[r${r}]`);
}
filter += `${rows.join('')}vstack=${rows.length}`;
execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...inputs, '-filter_complex', filter, `shots/sweep-${tag}.jpg`]);
console.log(`sheet: shots/sweep-${tag}.jpg  horizontal overflow: ${overflow}px`);
if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].slice(0, 12).join('\n'));
