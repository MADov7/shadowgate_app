// Experience mode: cinematic (WebGL + scroll choreography) vs static (no WebGL or reduced motion).
import { create } from 'zustand';
import {
  detectQuality,
  detectWebGL,
  initialMotionPref,
  isReducedMotion,
  urlFlag,
  type MotionPref,
  type Quality,
} from '../lib/capabilities';
import { KEYS, readString, writeString } from '../lib/storage';

export type Mode = 'cinematic' | 'static';
export type WelcomeState = 'visible' | 'entering' | 'hidden';

interface ExperienceState {
  webgl: boolean;
  motionPref: MotionPref;
  reducedMotion: boolean;
  mode: Mode;
  quality: Quality;
  welcome: WelcomeState;
  /** True once the 3D scene has rendered its first frame. */
  sceneReady: boolean;
  soundOn: boolean;
  setMotionPref: (pref: MotionPref) => void;
  setQuality: (quality: Quality) => void;
  setWelcome: (state: WelcomeState) => void;
  setSceneReady: (ready: boolean) => void;
  /** Called if the WebGL context is lost or the renderer fails — switches to the static experience. */
  failWebGL: () => void;
  setSound: (on: boolean) => void;
}

function computeMode(webgl: boolean, reduced: boolean): Mode {
  return webgl && !reduced ? 'cinematic' : 'static';
}

export function applyModeToDocument(mode: Mode, reduced: boolean): void {
  const root = document.documentElement;
  root.dataset.mode = mode;
  root.dataset.motion = reduced ? 'reduced' : 'full';
}

function initialWelcome(): WelcomeState {
  const intro = urlFlag('intro');
  if (intro === '1') return 'visible';
  if (intro === '0') return 'hidden';
  // Arriving on a deep link (e.g. #catalog) bypasses the cinematic entrance.
  if (window.location.hash.length > 1) return 'hidden';
  return readString(KEYS.entered, 'session') === '1' ? 'hidden' : 'visible';
}

const webgl = detectWebGL();
const motionPref = initialMotionPref();
const reduced = isReducedMotion(motionPref);

export const useExperience = create<ExperienceState>((set, get) => ({
  webgl,
  motionPref,
  reducedMotion: reduced,
  mode: computeMode(webgl, reduced),
  quality: detectQuality(),
  welcome: initialWelcome(),
  sceneReady: false,
  soundOn: false, // ambient sound is always muted by default
  setMotionPref: (pref) => {
    writeString(KEYS.motion, pref);
    const r = isReducedMotion(pref);
    const mode = computeMode(get().webgl, r);
    applyModeToDocument(mode, r);
    set({ motionPref: pref, reducedMotion: r, mode });
  },
  setQuality: (quality) => set({ quality }),
  setWelcome: (state) => {
    if (state === 'hidden') writeString(KEYS.entered, '1', 'session');
    set({ welcome: state });
  },
  setSceneReady: (ready) => set({ sceneReady: ready }),
  failWebGL: () => {
    const r = get().reducedMotion;
    applyModeToDocument('static', r);
    set({ webgl: false, mode: 'static', sceneReady: false });
  },
  setSound: (on) => set({ soundOn: on }),
}));
