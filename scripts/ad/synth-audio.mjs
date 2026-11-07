// Original 12-second soundtrack for the SHADOW GATE ad, synthesised from scratch (no samples, no stock audio).
// Timing mirrors src/ad/timeline.ts: hook pulse + impact, gate opening, five layer "lock-ins", assembly ticks,
// brand resolve, calm teal-horizon pad. Output: 48 kHz stereo 16-bit WAV (loudness-normalised later by ffmpeg).
//   node scripts/ad/synth-audio.mjs ad-package/render/work/soundtrack.wav
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const out = process.argv[2] ?? 'ad-package/render/work/soundtrack.wav';
const SR = 48000;
const DUR = 12;
const N = SR * DUR;
const L = new Float32Array(N);
const R = new Float32Array(N);

// ---------- helpers ----------
let seed = 1337;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const TAU = Math.PI * 2;

function add(i, l, r = l) {
  if (i >= 0 && i < N) {
    L[i] += l;
    R[i] += r;
  }
}

/** Generic voice: fn(tLocal) → sample, placed at start for dur seconds with pan (-1..1). */
function voice(start, dur, fn, gain = 1, pan = 0) {
  const s0 = Math.floor(start * SR);
  const len = Math.floor(dur * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let k = 0; k < len; k++) {
    const v = fn(k / SR);
    add(s0 + k, v * gl, v * gr);
  }
}

/** RBJ band-pass biquad with per-sample cutoff function. */
function bandpassNoise(start, dur, freqFn, q, ampFn, gain, pan = 0) {
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0;
  voice(
    start,
    dur,
    (t) => {
      const f = freqFn(t);
      const w = (TAU * f) / SR;
      const alpha = Math.sin(w) / (2 * q);
      const b0 = alpha,
        b2 = -alpha,
        a0 = 1 + alpha,
        a1 = -2 * Math.cos(w),
        a2 = 1 - alpha;
      const x = rand();
      const y = (b0 * x + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      x2 = x1;
      x1 = x;
      y2 = y1;
      y1 = y;
      return y * ampFn(t);
    },
    gain,
    pan,
  );
}

function lowNoise(start, dur, cutoff, ampFn, gain) {
  let y = 0;
  const a = 1 - Math.exp((-TAU * cutoff) / SR);
  voice(start, dur, (t) => (y += a * (rand() - y)) * ampFn(t), gain);
}

function tone(start, dur, freq, { attack = 0.004, decay = 0.6, gain = 0.2, partials = [[1, 1]], pan = 0, vibrato = 0 } = {}) {
  voice(
    start,
    dur,
    (t) => {
      const env = Math.min(1, t / attack) * Math.exp(-t / decay);
      let s = 0;
      for (const [mul, amp] of partials) s += Math.sin(TAU * freq * mul * t + vibrato * Math.sin(TAU * 5 * t)) * amp;
      return s * env;
    },
    gain,
    pan,
  );
}

function boom(start, { f0 = 64, f1 = 30, decay = 0.9, gain = 0.9 } = {}) {
  let phase = 0;
  voice(start, decay * 4, (t) => {
    const f = f1 + (f0 - f1) * Math.exp(-t / 0.12);
    phase += (TAU * f) / SR;
    return Math.tanh(Math.sin(phase) * 1.6) * Math.min(1, t / 0.003) * Math.exp(-t / decay);
  }, gain);
}

function click(start, gain = 0.25, pan = 0, freq = 1800) {
  bandpassNoise(start, 0.08, () => freq, 4, (t) => Math.exp(-t / 0.012), gain, pan);
  tone(start, 0.2, freq * 0.5, { decay: 0.05, gain: gain * 0.4, pan });
}

// ---------- score ----------
// Drone bed (A1 + E2 + octave), swelling, ducking under the brand hit, ending on the CTA pad.
voice(0, 10.2, (t) => {
  const env = smooth(0, 0.35, t) * (0.55 + 0.45 * smooth(1.8, 7.5, t)) * (1 - smooth(9.7, 10.15, t));
  const lfo = 0.75 + 0.25 * Math.sin(TAU * 0.23 * t);
  let s = 0;
  for (const [f, a] of [
    [55, 0.5],
    [55.4, 0.35],
    [82.41, 0.28],
    [110, 0.16],
    [164.8, 0.05],
  ])
    s += Math.sin(TAU * f * t) * a;
  return s * env * lfo;
}, 0.32);

// HOOK — threat heartbeat + riser as the red pulse races in (0.12 → 1.62 s), then impact.
for (const at of [0.14, 0.62, 1.02, 1.32, 1.5]) boom(at, { f0: 80, f1: 46, decay: 0.12, gain: 0.35 });
bandpassNoise(0.12, 1.55, (t) => 260 + 3200 * Math.pow(t / 1.5, 2.2), 2.2, (t) => smooth(0, 1.4, t) * 0.9, 0.55, -0.3);
voice(0.2, 1.42, (t) => Math.sin(TAU * (180 * t + 260 * t * t)) * smooth(0, 1.3, t) * 0.5, 0.08);
boom(1.62, { f0: 70, f1: 28, decay: 0.85, gain: 1.0 });
bandpassNoise(1.62, 0.35, () => 2600, 0.8, (t) => Math.exp(-t / 0.06), 0.55);
tone(1.62, 1.4, 155.6, { decay: 0.5, gain: 0.12, partials: [[1, 1], [2.01, 0.4], [3.03, 0.2]] }); // dissonant sting

// PRODUCT — teal light traces the gate edges (glints), leaves open (rumble), we pass through (whoosh → light).
[1.92, 2.04, 2.16, 2.28, 2.4].forEach((at, i) =>
  tone(at, 1.2, [1760, 2217.5, 2637, 3520, 2960][i], { decay: 0.35, gain: 0.05, pan: i % 2 ? 0.5 : -0.5, partials: [[1, 1], [2, 0.25]] }),
);
lowNoise(2.3, 1.2, 140, (t) => smooth(0, 0.3, t) * (1 - smooth(0.8, 1.2, t)), 0.7);
bandpassNoise(2.55, 0.9, (t) => 500 + 4500 * Math.pow(t / 0.85, 1.8), 1.4, (t) => smooth(0, 0.8, t), 0.4);
tone(3.4, 2.6, 880, { attack: 0.01, decay: 1.2, gain: 0.07, partials: [[1, 1], [1.5, 0.5], [2, 0.3]] });
boom(3.4, { f0: 52, f1: 36, decay: 0.5, gain: 0.35 });

// Network data texture (soft ticks every 1/4 s until the benefit beat ends).
for (let t = 3.6; t < 7.7; t += 0.25) click(t, 0.035, Math.sin(t * 3) * 0.6, 3200);

// BENEFIT — five protection layers lock in (timed to the layer reveals in the 3D scene).
const tOfT = (T) => {
  // invert T = lerp(3.14, 4.98, easeInOutCubic(range(5, 7.8, t)))
  const u = clamp01((T - 3.14) / (4.98 - 3.14));
  let lo = 0,
    hi = 1;
  for (let k = 0; k < 40; k++) {
    const m = (lo + hi) / 2;
    if (easeInOutCubic(m) < u) lo = m;
    else hi = m;
  }
  return 5 + lo * 2.8;
};
const span = (1 - 0.08 - 0.08) / 5;
const lockNotes = [880, 1108.73, 1318.51, 1760, 2217.46];
for (let i = 0; i < 5; i++) {
  const at = tOfT(3 + 2 * (0.08 + i * span + span * 0.45));
  click(at, 0.22, i % 2 ? 0.35 : -0.35, 2400);
  tone(at, 1.6, lockNotes[i], { attack: 0.006, decay: 0.55, gain: 0.11, partials: [[1, 1], [1.5, 0.35], [2, 0.18]], pan: (i - 2) * 0.2 });
  boom(at, { f0: 90, f1: 60, decay: 0.15, gain: 0.18 });
}

// Dip to black → BRAND: structure assembles (ticks), the mark resolves (hit + bell).
bandpassNoise(7.55, 0.45, (t) => 2400 - 2000 * (t / 0.45), 1.2, (t) => Math.sin(Math.PI * clamp01(t / 0.45)), 0.25);
for (let k = 1; k <= 9; k++) click(8.05 + (k * 1.15) / 9 - 0.02, 0.16, k % 2 ? 0.45 : -0.45, 1500 + k * 90);
boom(9.48, { f0: 58, f1: 30, decay: 1.1, gain: 0.85 });
tone(9.48, 2.6, 440, { attack: 0.003, decay: 1.1, gain: 0.13, partials: [[1, 1], [2.76, 0.45], [5.4, 0.25], [8.93, 0.1]] });
tone(9.48, 2.6, 659.25, { attack: 0.003, decay: 0.9, gain: 0.06, partials: [[1, 1], [2.76, 0.3]] });

// CTA — light flash, calm A-major (add9) horizon pad, gentle shimmer; soft tail to the end.
bandpassNoise(9.7, 0.4, (t) => 1500 + 6000 * (t / 0.4), 1.1, (t) => smooth(0, 0.4, t), 0.22);
voice(10, 2, (t) => {
  const env = smooth(0, 0.6, t) * (1 - smooth(1.65, 2, t));
  let s = 0;
  for (const [f, a] of [
    [110, 0.35],
    [220, 0.3],
    [277.18, 0.24],
    [329.63, 0.24],
    [493.88, 0.14],
    [659.25, 0.08],
  ])
    s += Math.sin(TAU * f * t + 0.3 * Math.sin(TAU * 0.5 * t)) * a;
  return s * env;
}, 0.3);
[1760, 1318.51, 2217.46, 1975.53, 2637].forEach((f, i) =>
  tone(10.15 + i * 0.28, 1.3, f, { decay: 0.45, gain: 0.04, pan: i % 2 ? 0.6 : -0.6 }),
);
tone(11.2, 0.8, 1760, { decay: 0.35, gain: 0.05, partials: [[1, 1], [2, 0.2]] });

// ---------- space: small Schroeder reverb ----------
function reverb(buf, mix, combs, allpasses) {
  const out = new Float32Array(buf.length);
  for (const [delayMs, fb] of combs) {
    const d = Math.floor((delayMs / 1000) * SR);
    const line = new Float32Array(d);
    let idx = 0;
    for (let i = 0; i < buf.length; i++) {
      const y = line[idx];
      line[idx] = buf[i] + y * fb;
      idx = (idx + 1) % d;
      out[i] += y / combs.length;
    }
  }
  for (const [delayMs, g] of allpasses) {
    const d = Math.floor((delayMs / 1000) * SR);
    const line = new Float32Array(d);
    let idx = 0;
    for (let i = 0; i < out.length; i++) {
      const x = out[i];
      const y = line[idx];
      const v = x + g * y;
      line[idx] = v;
      out[i] = y - g * v;
      idx = (idx + 1) % d;
    }
  }
  for (let i = 0; i < buf.length; i++) buf[i] = buf[i] * (1 - mix) + out[i] * mix * 1.6;
}
reverb(L, 0.22, [[29.7, 0.78], [37.1, 0.76], [41.1, 0.74], [43.7, 0.72]], [[5, 0.7], [1.7, 0.7]]);
reverb(R, 0.22, [[31.3, 0.78], [36.1, 0.76], [40.3, 0.74], [45.1, 0.72]], [[5.3, 0.7], [1.9, 0.7]]);

// ---------- master: fade edges, soft clip, normalise ----------
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const edge = smooth(0, 0.03, t) * (1 - smooth(11.7, 12, t));
  L[i] = Math.tanh(L[i] * 1.25 * edge);
  R[i] = Math.tanh(R[i] * 1.25 * edge);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = peak > 0 ? 0.89 / peak : 1;

const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), i * 4);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), i * 4 + 2);
}
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, Buffer.concat([header, data]));
console.log(`soundtrack written: ${out} (${DUR}s, peak normalised)`);
