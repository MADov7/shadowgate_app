// Measures frame times of the running site with the machine's real GPU (headless Chromium + ANGLE D3D11).
//   node scripts/perf-probe.mjs [url] [seconds]
import { chromium } from '@playwright/test';
const url = process.argv[2] ?? 'http://localhost:5190/?intro=0';
const secs = Number(process.argv[3] ?? 4);
const browser = await chromium.launch({
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--disable-frame-rate-limit'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.25 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || /context/i.test(m.text())) errors.push(m.text().slice(0, 200)); });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const gpu = await page.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl2');
  const ext = gl?.getExtension('WEBGL_debug_renderer_info');
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
});
console.log('GPU:', gpu);
async function sample(label, scrollFn) {
  const r = await page.evaluate(async ([secs, fnSrc]) => {
    const scroll = new Function('t', fnSrc);
    const times = [];
    let last = performance.now();
    const start = last;
    await new Promise((res) => {
      function f(t) {
        times.push(t - last); last = t;
        scroll((t - start) / 1000);
        if (t - start < secs * 1000) requestAnimationFrame(f); else res();
      }
      requestAnimationFrame(f);
    });
    times.sort((a, b) => a - b);
    const q = (p) => times[Math.min(times.length - 1, Math.floor(times.length * p))].toFixed(1);
    return { frames: times.length, fps: (times.length / secs).toFixed(0), median: q(0.5), p95: q(0.95), max: q(0.999) };
  }, [secs, scrollFn]);
  console.log(label, JSON.stringify(r));
}
await sample('idle@hero', '');
await sample('scroll-pass-1', "const L=window.__lenis; const y=(t*900)%(document.documentElement.scrollHeight-innerHeight); if(L) L.scrollTo(y,{immediate:true,force:true}); else scrollTo(0,y);");
await sample('scroll-pass-2', "const L=window.__lenis; const y=(t*900)%(document.documentElement.scrollHeight-innerHeight); if(L) L.scrollTo(y,{immediate:true,force:true}); else scrollTo(0,y);");
console.log('errors:', errors.slice(0, 10));
await browser.close();
