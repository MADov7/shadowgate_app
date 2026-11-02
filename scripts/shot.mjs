// Visual QA helper: screenshots the running dev server at given scroll positions (WebGL via SwiftShader).
//
//   node scripts/shot.mjs --url http://localhost:5181/?intro=0 --at home --at radar:0.5 --out shots/radar
//   node scripts/shot.mjs --url "http://localhost:5181/?intro=1" --at top --wait 2500 --out shots/welcome
//   node scripts/shot.mjs --url ... --width 390 --height 844 --mobile --at catalog
//   node scripts/shot.mjs --url ... --click "text=Enter Shadow Gate" --after 3000 --at top
//
// --at <section-id>[:fraction]  scrolls so the section top is at the viewport top, plus
//        fraction × (section height − viewport height) — i.e. through a sticky section. "top" = y 0.
// Prints console errors/warnings so regressions are visible in agent logs.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const opt = { at: [], click: [] };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--mobile') opt.mobile = true;
  else if (a === '--reduced') opt.reduced = true;
  else if (a.startsWith('--')) {
    const key = a.slice(2);
    const val = args[++i];
    if (key === 'at') opt.at.push(val);
    else if (key === 'click') opt.click.push(val);
    else opt[key] = val;
  }
}
const url = opt.url ?? 'http://localhost:5173/?intro=0';
const out = opt.out ?? 'shots/shot';
const width = Number(opt.width ?? 1440);
const height = Number(opt.height ?? 900);
const wait = Number(opt.wait ?? 1800);
if (opt.at.length === 0) opt.at.push('top');
mkdirSync(out.replace(/[\\/][^\\/]*$/, '') || '.', { recursive: true });

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
});
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  isMobile: !!opt.mobile,
  hasTouch: !!opt.mobile,
  reducedMotion: opt.reduced ? 'reduce' : 'no-preference',
});
const page = await context.newPage();
const logs = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`);
});
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(wait);
for (const sel of opt.click) {
  await page.locator(sel).first().click();
  await page.waitForTimeout(Number(opt.after ?? 1500));
}

let n = 0;
for (const spec of opt.at) {
  const [id, frac] = spec.split(':');
  await page.evaluate(
    ([sid, f]) => {
      let y = 0;
      if (sid !== 'top') {
        const el = document.getElementById(sid);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY;
          y = top + Math.max(0, el.offsetHeight - window.innerHeight) * Number(f || 0);
        }
      }
      const lenis = window.__lenis;
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
      window.scrollTo(0, y);
    },
    [id, frac],
  );
  await page.waitForTimeout(wait);
  const file = `${out}-${String(++n).padStart(2, '0')}-${spec.replace(/[:/]/g, '_')}.png`;
  await page.screenshot({ path: file });
  console.log('saved', file);
}
if (logs.length) console.log('CONSOLE:\n' + [...new Set(logs)].slice(0, 30).join('\n'));
else console.log('CONSOLE: clean');
await browser.close();
