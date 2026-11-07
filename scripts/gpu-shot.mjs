// Real-GPU screenshot of a section, with and without the DOM layer (to separate 3D issues from DOM issues).
//   node scripts/gpu-shot.mjs layers 0.5 [port]
import { chromium } from '@playwright/test';
const [id = 'layers', frac = '0.5', port = '5190'] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto(`http://localhost:${port}/?intro=0&quality=${process.env.Q || "high"}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.evaluate(([sid, f]) => {
  const el = document.getElementById(sid);
  const y = el.getBoundingClientRect().top + scrollY + Math.max(0, el.offsetHeight - innerHeight) * Number(f);
  if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y);
}, [id, frac]);
await page.waitForTimeout(2500);
await page.screenshot({ path: `shots/gpu-${id}-${frac}.png` });
await page.addStyleTag({ content: '#main, header, footer, .sg-atmo, .sg-toaster { visibility: hidden !important; }' });
await page.waitForTimeout(600);
await page.screenshot({ path: `shots/gpu-${id}-${frac}-3d.png` });
console.log(await page.evaluate(() => ({ T: (window.__sgT ?? null), y: scrollY })));
await browser.close();
