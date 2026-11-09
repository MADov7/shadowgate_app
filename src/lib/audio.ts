// Ambient sound for the SHADOW GATE experience — fully synthesized with WebAudio (no audio files).
//
//   • Ambient drone: detuned low oscillators → lowpass filter swept by a slow LFO, plus faint filtered noise.
//     Very quiet by design; it should be felt more than heard.
//   • Gate whoosh: band-passed noise sweep + a soft sub "unlock" thump, panned across the stereo field.
//
// Rules: the AudioContext is only ever created inside a user gesture (browser autoplay policy and courtesy),
// everything fades in/out (no clicks), and disposeAudio() releases every node.
// Sound is muted by default; the visitor's choice is remembered for the browser session only.
import { useExperience } from '../state/experience';
import { KEYS, readString, writeString } from './storage';

type AudioCtor = typeof AudioContext;

const AMBIENT_LEVEL = 0.05; // master level for the drone (0..1)
const FADE_IN = 1.8; // seconds
const FADE_OUT = 0.9; // seconds

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

interface Ambient {
  out: GainNode;
  sources: AudioScheduledSourceNode[];
  nodes: AudioNode[];
  stopTimer: number;
}
let ambient: Ambient | null = null;

function audioCtor(): AudioCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export function isAudioSupported(): boolean {
  return audioCtor() !== null;
}

/** Creates (or resumes) the shared context. Call only from a user-gesture handler. */
function ensureContext(): AudioContext | null {
  if (ctx) {
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
    return ctx;
  }
  const Ctor = audioCtor();
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  master = ctx.createGain();
  master.gain.value = 1;
  // Gentle safety limiter so layered sounds never clip.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.knee.value = 12;
  limiter.ratio.value = 6;
  master.connect(limiter).connect(ctx.destination);
  return ctx;
}

function getNoise(c: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === c.sampleRate) return noiseBuffer;
  const length = Math.floor(c.sampleRate * 2.5);
  const buffer = c.createBuffer(2, length, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    // Slightly pinked noise (one-pole lowpass on white) — softer than raw white noise.
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.86 + white * 0.14;
      data[i] = last * 3;
    }
  }
  noiseBuffer = buffer;
  return buffer;
}

function startAmbient(): void {
  const c = ensureContext();
  if (!c || !master) return;
  if (ambient) {
    // Already running (or fading out) — cancel any pending stop and fade back up.
    window.clearTimeout(ambient.stopTimer);
    const g = ambient.out.gain;
    g.cancelScheduledValues(c.currentTime);
    g.setValueAtTime(g.value, c.currentTime);
    g.linearRampToValueAtTime(AMBIENT_LEVEL, c.currentTime + FADE_IN);
    return;
  }
  const now = c.currentTime;
  const out = c.createGain();
  out.gain.setValueAtTime(0, now);
  out.gain.linearRampToValueAtTime(AMBIENT_LEVEL, now + FADE_IN);
  out.connect(master);

  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 340;
  filter.Q.value = 0.9;
  filter.connect(out);

  // Slow LFO breathing on the filter cutoff.
  const lfo = c.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.06;
  const lfoDepth = c.createGain();
  lfoDepth.gain.value = 140;
  lfo.connect(lfoDepth).connect(filter.frequency);

  // Detuned low voices: A1 pair (beating), a fifth above, and a quiet octave sine for body.
  const voices: Array<[OscillatorType, number, number, number]> = [
    ['sawtooth', 55, -7, 0.32],
    ['sawtooth', 55, +6, 0.32],
    ['triangle', 82.41, -3, 0.22],
    ['sine', 110, +2, 0.12],
  ];
  const sources: AudioScheduledSourceNode[] = [lfo];
  const nodes: AudioNode[] = [out, filter, lfoDepth];
  for (const [type, freq, detune, level] of voices) {
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    const g = c.createGain();
    g.gain.value = level;
    osc.connect(g).connect(filter);
    sources.push(osc);
    nodes.push(g);
  }

  // Faint air: looped noise through a narrow band, far below the drone.
  const noise = c.createBufferSource();
  noise.buffer = getNoise(c);
  noise.loop = true;
  const band = c.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 900;
  band.Q.value = 0.7;
  const air = c.createGain();
  air.gain.value = 0.05;
  noise.connect(band).connect(air).connect(out);
  sources.push(noise);
  nodes.push(band, air);

  for (const s of sources) s.start(now);
  ambient = { out, sources, nodes, stopTimer: 0 };
}

function stopAmbient(immediate = false): void {
  if (!ctx || !ambient) return;
  const a = ambient;
  const now = ctx.currentTime;
  const fade = immediate ? 0.05 : FADE_OUT;
  a.out.gain.cancelScheduledValues(now);
  a.out.gain.setValueAtTime(a.out.gain.value, now);
  a.out.gain.linearRampToValueAtTime(0, now + fade);
  window.clearTimeout(a.stopTimer);
  a.stopTimer = window.setTimeout(() => {
    for (const s of a.sources) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
      s.disconnect();
    }
    for (const n of a.nodes) n.disconnect();
    if (ambient === a) ambient = null;
  }, (fade + 0.1) * 1000);
}

/**
 * The gate-open whoosh (~1.8 s). Plays only when sound is on; safe to call from the Enter click handler
 * (that click is the user gesture that may create the context).
 */
export function playWhoosh(): void {
  if (!useExperience.getState().soundOn) return;
  const c = ensureContext();
  if (!c || !master) return;
  const now = c.currentTime;
  const dur = 1.9;

  const out = c.createGain();
  out.gain.value = 1;
  const pan = c.createStereoPanner();
  pan.pan.setValueAtTime(-0.35, now);
  pan.pan.linearRampToValueAtTime(0.35, now + dur);
  out.connect(pan).connect(master);

  // Air rushing through the opening: band-passed noise sweeping up, then settling.
  const noise = c.createBufferSource();
  noise.buffer = getNoise(c);
  const band = c.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = 1.1;
  band.frequency.setValueAtTime(180, now);
  band.frequency.exponentialRampToValueAtTime(2400, now + dur * 0.55);
  band.frequency.exponentialRampToValueAtTime(420, now + dur);
  const nGain = c.createGain();
  nGain.gain.setValueAtTime(0.0001, now);
  nGain.gain.exponentialRampToValueAtTime(0.16, now + dur * 0.5);
  nGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  noise.connect(band).connect(nGain).connect(out);

  // Soft sub thump as the seals release.
  const sub = c.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(64, now);
  sub.frequency.exponentialRampToValueAtTime(34, now + 0.7);
  const sGain = c.createGain();
  sGain.gain.setValueAtTime(0.0001, now);
  sGain.gain.exponentialRampToValueAtTime(0.22, now + 0.04);
  sGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
  sub.connect(sGain).connect(out);

  // A faint bright shimmer as the edge light passes (two detuned sines, quick decay).
  const shimmer: OscillatorNode[] = [];
  for (const f of [1318.5, 1324]) {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    shimmer.push(o);
  }
  const shGain = c.createGain();
  shGain.gain.setValueAtTime(0.0001, now);
  shGain.gain.exponentialRampToValueAtTime(0.012, now + 0.12);
  shGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
  for (const o of shimmer) o.connect(shGain);
  shGain.connect(out);

  const sources: AudioScheduledSourceNode[] = [noise, sub, ...shimmer];
  for (const s of sources) {
    s.start(now);
    s.stop(now + dur + 0.05);
  }
  noise.onended = () => {
    for (const s of sources) s.disconnect();
    for (const n of [band, nGain, sGain, shGain, out, pan]) n.disconnect();
  };
}

/** Turns the ambient drone on/off (with fades). Call from a user gesture when turning on. */
export function setAmbient(on: boolean): void {
  if (on) startAmbient();
  else stopAmbient();
}

/**
 * Single entry point used by every SoundToggle: updates the store, remembers the choice for this
 * browser session, and starts/stops the drone. Must run inside the click handler (user gesture).
 */
export function setSoundEnabled(on: boolean): void {
  useExperience.getState().setSound(on);
  writeString(KEYS.sound, on ? '1' : '0', 'session');
  setAmbient(on);
}

let initialised = false;
let disposeInit: (() => void) | null = null;

/**
 * Idempotent (every SoundToggle calls it; only the first call does anything). Restores a sound choice made
 * earlier in THIS browser session — a fresh session always starts muted. Browsers block audio until the
 * visitor interacts, so a restored "on" starts at the first gesture. Also fades the drone while the tab is hidden.
 */
export function initSound(): void {
  if (initialised) return;
  initialised = true;
  const cleanups: Array<() => void> = [];

  if (readString(KEYS.sound, 'session') === '1') {
    useExperience.getState().setSound(true);
    const onFirstGesture = () => {
      remove();
      if (useExperience.getState().soundOn) startAmbient();
    };
    const remove = () => {
      window.removeEventListener('pointerdown', onFirstGesture, true);
      window.removeEventListener('keydown', onFirstGesture, true);
    };
    window.addEventListener('pointerdown', onFirstGesture, true);
    window.addEventListener('keydown', onFirstGesture, true);
    cleanups.push(remove);
  }

  const onVisibility = () => {
    if (!ctx) return;
    if (document.hidden) stopAmbient(true);
    else if (useExperience.getState().soundOn) startAmbient();
  };
  document.addEventListener('visibilitychange', onVisibility);
  cleanups.push(() => document.removeEventListener('visibilitychange', onVisibility));

  disposeInit = () => {
    cleanups.forEach((fn) => fn());
    initialised = false;
    disposeInit = null;
  };
}

/** Releases every node and closes the context (e.g. on app teardown / HMR). */
export function disposeAudio(): void {
  disposeInit?.();
  if (ambient) {
    window.clearTimeout(ambient.stopTimer);
    for (const s of ambient.sources) {
      try {
        s.stop();
      } catch {
        /* ignore */
      }
      s.disconnect();
    }
    for (const n of ambient.nodes) n.disconnect();
    ambient = null;
  }
  if (ctx) {
    void ctx.close().catch(() => {});
    ctx = null;
    master = null;
  }
  noiseBuffer = null;
}

