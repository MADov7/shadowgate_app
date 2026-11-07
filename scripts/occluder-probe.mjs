// Finds which 3D objects darken the view at a given T: hides each scene child in turn and measures how much the
// frame brightens (mean luminance of the canvas region). Usage: node scripts/occluder-probe.mjs 3.6 [port]
import { chromium } from '@playwright/test';

const T = process.argv[2] ?? '3.6';
const port = process.argv[3] ?? '5190';
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const lab = await browser.newPage();
await page.addInitScript(() => {
  const hook = new EventTarget();
  window.__sgScenes = [];
  hook.addEventListener('observe', (e) => e.detail?.isScene && window.__sgScenes.push(e.detail));
  window.__THREE_DEVTOOLS__ = hook;
});
// ?static is not used; hide DOM so only the canvas is measured.
await page.goto(`http://localhost:${port}/?intro=0&qaT=${T}&quality=high`, { waitUntil: 'networkidle' });
await page.addStyleTag({ content: 'body > *:not(.sg-stage), #main, header, footer, .sg-atmo { visibility: hidden !important; } .sg-stage { opacity: 1 !important; visibility: visible !important; }' });
await page.waitForTimeout(3000);

async function luminance() {
  await page.waitForTimeout(250);
  const png = await page.screenshot();
  return lab.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = 180;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, 320, 180);
    const d = ctx.getImageData(0, 0, 320, 180).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 4) s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    return s / (d.length / 4);
  }, png.toString('base64'));
}

await page.screenshot({ path: `shots/occluder-T${T}-base.png` });
const base = await luminance();
const children = await page.evaluate(() => {
  const scene = window.__sgScenes.slice().sort((a, b) => b.children.length - a.children.length)[0];
  window.__probeScene = scene;
  const list = [];
  scene.traverse((o) => {
    if (o === scene) return;
    const depth = (() => { let d = 0; for (let p = o.parent; p && p !== scene; p = p.parent) d++; return d; })();
    if (depth <= 1 && o.visible) list.push({ id: o.id, label: `${'  '.repeat(depth)}${o.name || o.type}#${o.id} (${o.children.length} kids)` });
  });
  return list;
});
console.log(`T=${T} base luminance ${base.toFixed(2)}`);
const results = [];
for (const c of children) {
  await page.evaluate((id) => { window.__probeScene.getObjectById(id).visible = false; }, c.id);
  const l = await luminance();
  await page.evaluate((id) => { window.__probeScene.getObjectById(id).visible = true; }, c.id);
  results.push({ label: c.label, delta: l - base });
}
results.sort((a, b) => b.delta - a.delta);
for (const r of results.slice(0, 12)) console.log(`${r.delta >= 0 ? '+' : ''}${r.delta.toFixed(2)}  ${r.label}`);
await browser.close();
