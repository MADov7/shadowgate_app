// Composites plates + typography + soundtrack into the final MP4s (and posters) with ffmpeg.
//   node scripts/ad/assemble.mjs            → all four: en/ar × 16:9/9:16
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';

const work = 'ad-package/render/work';
const outDir = 'ad-package/render';
mkdirSync(outDir, { recursive: true });

const audio = `${work}/soundtrack-14lufs.wav`;
if (!existsSync(audio)) {
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', `${work}/soundtrack.wav`, '-af', 'loudnorm=I=-14:TP=-1.0:LRA=7', '-ar', '48000', audio], {
    stdio: 'inherit',
  });
}

for (const aspect of ['16x9', '9x16']) {
  for (const lang of ['en', 'ar']) {
    const plate = `${work}/plate-${aspect}/%04d.jpg`;
    const overlay = `${work}/overlay-${aspect}-${lang}/%04d.png`;
    const file = `${outDir}/shadow-gate-ad-12s-${lang}-${aspect}.mp4`;
    execFileSync(
      'ffmpeg',
      [
        '-y', '-hide_banner', '-loglevel', 'error',
        '-framerate', '24', '-i', plate,
        '-framerate', '24', '-i', overlay,
        '-i', audio,
        '-filter_complex',
        // light film grain on the picture only, then the typography on top (kept crisp)
        '[0:v]noise=alls=2:allf=t,format=yuv444p[pic];[pic][1:v]overlay=0:0:format=auto,format=yuv420p[v]',
        '-map', '[v]', '-map', '2:a',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-maxrate', '10M', '-bufsize', '20M', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
        '-r', '24', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', '12',
        file,
      ],
      { stdio: 'inherit' },
    );
    // Posters: brand beat + end card.
    for (const [label, ts] of [['brand', '9.80'], ['endcard', '11.90']]) {
      execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-ss', ts, '-i', file, '-frames:v', '1', `${outDir}/poster-${label}-${lang}-${aspect}.jpg`]);
    }
    console.log('wrote', file);
  }
}
