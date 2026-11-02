// Detects what the visitor's device can handle and applies URL overrides used for testing.
//   ?static=1            force the static (no-WebGL) experience
//   ?webgl=0             pretend WebGL is unavailable (same as static)
//   ?motion=reduced|full override prefers-reduced-motion for this load
//   ?quality=low|medium|high  force a 3D quality tier
//   ?intro=1 | ?intro=0  force / skip the welcome gate regardless of sessionStorage
import { KEYS, readString } from './storage';

export type Quality = 'high' | 'medium' | 'low';
export type MotionPref = 'system' | 'full' | 'reduced';

const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();

export function urlFlag(name: string): string | null {
  return params.get(name);
}

let webglCache: boolean | null = null;
export function detectWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  if (urlFlag('webgl') === '0' || urlFlag('static') === '1') return (webglCache = false);
  try {
    const canvas = document.createElement('canvas');
    const gl =
      (canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) as WebGLRenderingContext | null) ??
      (canvas.getContext('webgl') as WebGLRenderingContext | null);
    webglCache = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webglCache = false;
  }
  return webglCache;
}

export function systemPrefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function initialMotionPref(): MotionPref {
  const url = urlFlag('motion');
  if (url === 'reduced' || url === 'full') return url;
  const stored = readString(KEYS.motion);
  return stored === 'full' || stored === 'reduced' ? stored : 'system';
}

export function isReducedMotion(pref: MotionPref): boolean {
  return pref === 'reduced' || (pref === 'system' && systemPrefersReducedMotion());
}

export function detectQuality(): Quality {
  const forced = urlFlag('quality');
  if (forced === 'low' || forced === 'medium' || forced === 'high') return forced;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const narrow = window.innerWidth < 820;
  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  if ((coarse && narrow) || memory <= 3 || cores <= 3) return 'low';
  if (coarse || narrow || memory <= 4 || cores <= 4 || window.innerWidth < 1200) return 'medium';
  return 'high';
}

export function isNarrowViewport(): boolean {
  return window.innerWidth < 820;
}
