// Renders still frames of the animatic (file:// — no server) for QA or for a printed storyboard.
//
//   node ad-package/tools/preview-frames.mjs [outDir] [--times 1,6,11] [--aspect 16x9|9x16] [--lang en|ar] [--safe]
//
// Fails (exit 1) on page errors, console errors or any request that is not file:/data:.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = { out: 'shots/adpack', times: '1,6,11', aspect: '16x9', lang: 'en', safe: false, page: false };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--safe') opt.safe = true;
  else if (a === '--page') opt.page = true;
  else if (a.startsWith('--')) opt[a.slice(2)] = args[++i];
  else opt.out = a;
}
mkdirSync(opt.out, { recursive: true });
const url = pathToFileURL(resolve(HERE, '..', 'animatic', 'index.html')).href;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: opt.aspect === '9x16' ? 1500 : 1000 } });
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => (m.type() === 'error' ? problems.push(`console: ${m.text()}`) : null));
page.on('request', (r) => (/^(file|data):/.test(r.url()) ? null : problems.push(`external request: ${r.url()}`)));

for (const t of opt.times.split(',').map(Number)) {
  const q = new URLSearchParams({ t: String(t), aspect: opt.aspect, lang: opt.lang, ...(opt.safe ? { safe: '1' } : {}) });
  await page.goto(`${url}?${q}`);
  await page.waitForTimeout(300);
  const file = join(opt.out, `animatic-${opt.aspect}-${opt.lang}-t${String(t).replace('.', '_')}${opt.safe ? '-safe' : ''}.png`);
  await page.locator('#stageWrap').screenshot({ path: file });
  const info = await page.evaluate(() => ({ tc: document.getElementById('tc').textContent, beat: document.getElementById('beatName').textContent }));
  console.log(`${file}  ${info.tc}  ${info.beat}`);
}
if (opt.page) {
  await page.goto(url);
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(opt.out, 'animatic-page.png'), fullPage: true });
}
await browser.close();
if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else console.log('no page errors, no external requests');
