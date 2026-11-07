// Diagnoses what fills the screen at a given world timeline T: lists visible meshes by screen coverage.
//   node scripts/scene-probe.mjs 3.6 [port]
import { chromium } from '@playwright/test';

const T = process.argv[2] ?? '3.6';
const port = process.argv[3] ?? '5190';
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.addInitScript(() => {
  const hook = new EventTarget();
  window.__sgScenes = [];
  hook.addEventListener('observe', (e) => {
    const o = e.detail;
    if (o && o.isScene) window.__sgScenes.push(o);
  });
  window.__THREE_DEVTOOLS__ = hook;
});
await page.goto(`http://localhost:${port}/?intro=0&qaT=${T}&quality=high`, { waitUntil: 'networkidle' });
await page.waitForTimeout(3500);
await page.screenshot({ path: `shots/probe-T${T}.png` });
const report = await page.evaluate(() => {
  const scenes = window.__sgScenes;
  const scene = scenes.slice().sort((a, b) => { let na = 0, nb = 0; a.traverse(() => na++); b.traverse(() => nb++); return nb - na; })[0];
  if (!scene) return 'no scene captured';
  let camera = null;
  scene.traverse((o) => { if (o.isCamera) camera = o; });
  const rows = [];
  const V = (x, y, z) => ({ x, y, z });
  scene.traverse((o) => {
    if (!o.isMesh && !o.isPoints && !o.isLine) return;
    let vis = true;
    for (let p = o; p; p = p.parent) if (!p.visible) vis = false;
    if (!vis || !o.geometry) return;
    o.geometry.computeBoundingSphere?.();
    const bs = o.geometry.boundingSphere;
    if (!bs) return;
    const c = bs.center.clone().applyMatrix4(o.matrixWorld);
    const scale = Math.max(o.matrixWorld.getMaxScaleOnAxis(), 1e-6);
    const r = bs.radius * scale;
    const name = [];
    for (let p = o; p && name.length < 4; p = p.parent) name.push(p.name || p.type);
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    rows.push({ name: name.join('<'), type: o.type, mat: m?.type, color: m?.color?.getHexString?.(), opacity: m?.opacity, transparent: m?.transparent, center: [c.x, c.y, c.z].map((v) => +v.toFixed(1)), radius: +r.toFixed(1) });
  });
  return { count: rows.length, big: rows.filter((r) => r.radius > 3).sort((a, b) => b.radius - a.radius).slice(0, 25) };
});
console.log(JSON.stringify(report, null, 1));
await browser.close();
