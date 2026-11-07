// Contact sheet of the overlay PNGs on a navy background (QA only).
import { chromium } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const dir = process.argv[2];
const out = process.argv[3];
const filter = new RegExp(process.argv[4] || '.');
const files = readdirSync(dir).filter((f) => f.endsWith('.png') && filter.test(f)).sort();
const is916 = dir.includes('9x16');
const tiles = files
  .map((f) => `<figure><img src="data:image/png;base64,${readFileSync(join(dir, f)).toString('base64')}"><figcaption>${f}</figcaption></figure>`)
  .join('');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: is916 ? 1500 : 1600, height: 900 } });
await page.setContent(`<html><body style="margin:0;background:#222;font:12px sans-serif;color:#ddd">
<style>body{display:grid;grid-template-columns:repeat(${is916 ? 6 : 3},1fr);gap:8px;padding:8px}
figure{margin:0}img{width:100%;display:block;background:radial-gradient(circle at 50% 60%,#142035,#070B14);outline:1px solid #444}</style>${tiles}</body></html>`);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(files.length, 'tiles →', out);
