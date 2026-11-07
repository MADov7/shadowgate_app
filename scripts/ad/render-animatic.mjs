// Renders the HTML animatic (ad-package/animatic/index.html) to real MP4 files, frame-accurately,
// with the original synthesised soundtrack. Output: ad-package/render/shadow-gate-ad-animatic-<lang>-<aspect>.mp4
//   node scripts/ad/render-animatic.mjs
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const FPS = 24;
const FRAMES = 288;
const work = 'ad-package/render/work';
const audio = `${work}/soundtrack-14lufs.wav`;
mkdirSync(work, { recursive: true });
if (!existsSync(`${work}/soundtrack.wav`)) execFileSync('node', ['scripts/ad/synth-audio.mjs', `${work}/soundtrack.wav`], { stdio: 'inherit' });
if (!existsSync(audio)) {
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', `${work}/soundtrack.wav`, '-af', 'loudnorm=I=-14:TP=-1.0:LRA=7', '-ar', '48000', audio]);
}

const url = pathToFileURL(resolve('ad-package/animatic/index.html')).href;
const browser = await chromium.launch();
const ONLY = process.env.ONLY;
for (const aspect of ['16x9', '9x16']) {
  for (const lang of ['en', 'ar']) {
    if (ONLY && ONLY !== `${aspect}-${lang}`) continue;
    const W = aspect === '9x16' ? 1080 : 1920;
    const H = aspect === '9x16' ? 1920 : 1080;
    const dir = `${work}/animatic-${aspect}-${lang}`;
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await page.goto(`${url}?aspect=${aspect}&lang=${lang}&hud=0&t=0`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__animatic);
    await page.evaluate(() => document.fonts.ready);
    // Show only the film frame, filling the viewport exactly.
    await page.addStyleTag({
      content: `html,body{margin:0!important;padding:0!important;overflow:hidden!important;background:#070B14!important}
        body *{visibility:hidden!important}
        #stage,#stage *{visibility:visible!important}
        #stage{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;z-index:2147483647!important;border:0!important;border-radius:0!important;margin:0!important}`,
    });
    for (let f = 0; f < FRAMES; f++) {
      await page.evaluate((t) => window.__animatic.seek(t), f / FPS);
      await page.screenshot({ path: `${dir}/${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 95 });
    }
    await page.close();
    const out = `ad-package/render/shadow-gate-ad-animatic-${lang}-${aspect}.mp4`;
    execFileSync('ffmpeg', [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-framerate', String(FPS), '-i', `${dir}/%04d.jpg`, '-i', audio,
      '-map', '0:v', '-map', '1:a',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS),
      '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', '12', out,
    ]);
    console.log('wrote', out);
  }
}
await browser.close();
