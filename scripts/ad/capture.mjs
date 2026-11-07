// Frame-accurate capture of the ad renderer (/ad.html) — deterministic, independent of render speed.
//   node scripts/ad/capture.mjs --mode plate   --aspect 16x9            [--from 0 --to 287] [--base http://localhost:5190]
//   node scripts/ad/capture.mjs --mode overlay --aspect 9x16 --lang ar
// Plates are JPEG (q95) on the machine's GPU (ANGLE D3D11); overlays are transparent PNGs.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const mode = arg('mode', 'plate');
const aspect = arg('aspect', '16x9');
const lang = arg('lang', 'en');
const base = arg('base', 'http://localhost:5190');
const from = Number(arg('from', 0));
const to = Number(arg('to', 287));
const software = process.argv.includes('--software');
const W = aspect === '9x16' ? 1080 : 1920;
const H = aspect === '9x16' ? 1920 : 1080;
const dir = arg('out', `ad-package/render/work/${mode === 'plate' ? `plate-${aspect}` : `overlay-${aspect}-${lang}`}`);
mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({
  args: software
    ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
    : ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'],
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 240)));

await page.goto(`${base}/ad.html?mode=${mode}&aspect=${aspect}&lang=${lang}&quality=high`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ad && window.__ad.ready);
await page.evaluate(() => window.__ad.ready);
await page.waitForTimeout(mode === 'plate' ? 1500 : 200);

const started = Date.now();
for (let f = from; f <= to; f++) {
  await page.evaluate((frame) => window.__ad.render(frame), f);
  const name = `${dir}/${String(f).padStart(4, '0')}.${mode === 'plate' ? 'jpg' : 'png'}`;
  if (mode === 'plate') await page.screenshot({ path: name, type: 'jpeg', quality: 95 });
  else await page.screenshot({ path: name, omitBackground: true });
  if (f % 24 === 0) process.stdout.write(`f${f} `);
}
console.log(`\n${mode} ${aspect}${mode === 'overlay' ? ' ' + lang : ''}: ${to - from + 1} frames in ${((Date.now() - started) / 1000).toFixed(1)}s → ${dir}`);
if (errors.length) console.log('PAGE ERRORS:\n' + [...new Set(errors)].slice(0, 10).join('\n'));
await browser.close();
