// OWNER: world-core agent — controlled post-processing (bloom / vignette / grain), quality-gated, plus the frame
// driver that renders the world.
// HDR pipeline: the scene renders into a half-float buffer, Bloom picks up only values above ~0.9 (emissive lines,
// gate light, sparkling particles — never the dark metal or navy fog), then ACES tone mapping, vignette and a
// whisper of grain. Low quality skips the composer entirely (the renderer tone-maps directly).
// FrameDriver (useFrame priority 1 → R3F's own render is off):
//  - renders through the composer (high/medium) or straight to the screen (low)
//  - warms the whole world up once at start (and after a quality change): shader precompile for the exact target
//    + one offscreen upload pass, so the first visit to every scene is hitch-free (see core/warmup.ts)
//  - while the canvas is dimmed behind the catalog / packages (canvasOpacityAt < 0.3) it renders every third
//    frame only; skipped frames simply keep the last image on screen (never a black canvas)
// PerformanceMonitor steps the quality tier down on sustained low FPS (never up again, to avoid flip-flopping).
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode, type EffectComposer as ComposerImpl } from 'postprocessing';
import { Vector2, type WebGLRenderTarget } from 'three';
import { useExperience } from '../state/experience';
import { scrollState } from '../state/scroll';
import { canvasOpacityAt } from '../lib/choreo';
import type { Quality } from '../lib/capabilities';
import { QA_QUALITY_FORCED } from './core/qa';
import { IS_DEV } from '../lib/env';
import { compileWorld, createWarmTarget, uploadWorld } from './core/warmup';

const STEP_DOWN = { high: 'medium', medium: 'low', low: 'low' } as const;
/** Frames to wait after (re)mount before warming up: lets every scene mount and the environment map render. */
const WARM_DELAY_FRAMES = 3;
/** While dimmed, render one frame in this many. */
const DIM_EVERY = 3;
const DIM_BELOW = 0.3;

/** Shared with the QualityGovernor so it ignores the deliberate warm-up frames. */
const warmState = { busy: true, doneAt: 0 };

function QualityGovernor() {
  const lastStep = useRef(0);
  const setQuality = useExperience((s) => s.setQuality);
  if (QA_QUALITY_FORCED) return null;
  return (
    <PerformanceMonitor
      ms={300}
      iterations={10}
      flipflops={Infinity}
      bounds={() => [32, 200]}
      onDecline={() => {
        const now = performance.now();
        // Ignore the warm-up and its aftermath, and give each tier time to settle.
        if (warmState.busy || now - warmState.doneAt < 4000 || now - lastStep.current < 6000) return;
        // A dimmed canvas deliberately renders at a third of the rate — that is not a slow GPU.
        if (canvasOpacityAt(scrollState.T) < DIM_BELOW) return;
        const q = useExperience.getState().quality;
        if (q === 'low') return;
        lastStep.current = now;
        setQuality(STEP_DOWN[q]);
      }}
    />
  );
}

type WarmPhase = 'wait' | 'compiling' | 'upload' | 'done';
interface WarmState {
  phase: WarmPhase;
  frames: number;
  target: WebGLRenderTarget | null;
  t0: number;
  programs0: number;
  /** Bumped on every (re)start so a superseded compile never advances the current warm-up. */
  run: number;
}

function finishWarm(w: WarmState, programs: number, quality: Quality): void {
  w.phase = 'done';
  warmState.busy = false;
  warmState.doneAt = performance.now();
  if (IS_DEV) {
    const ms = (warmState.doneAt - w.t0).toFixed(0);
    console.info(`[world] warm-up (${quality}): ${programs - w.programs0} programs compiled in ${ms} ms`);
  }
}

function FrameDriver({ composer, quality }: { composer: React.RefObject<ComposerImpl | null>; quality: Quality }) {
  const size = useRef(new Vector2());
  const applied = useRef({ w: -1, h: -1, pr: -1, c: null as ComposerImpl | null });
  const frame = useRef(0);
  const warm = useRef<WarmState>({ phase: 'wait', frames: 0, target: null, t0: 0, programs0: 0, run: 0 });

  // Re-warm after a quality change: the scenes rebuild their geometry and the render target may change.
  useEffect(() => {
    const w = warm.current;
    w.phase = 'wait';
    w.frames = 0;
    warmState.busy = true;
  }, [quality]);
  useEffect(
    () => () => {
      warm.current.target?.dispose();
      warm.current.target = null;
    },
    [],
  );

  useFrame((state, delta) => {
    const { gl, scene, camera } = state;
    const c = quality !== 'low' ? composer.current : null;
    if (quality !== 'low' && !c) return; // composer not created yet: the canvas keeps its clear colour

    // ---- warm-up (runs while the welcome screen is showing) ----
    const w = warm.current;
    if (w.phase === 'wait' && ++w.frames >= WARM_DELAY_FRAMES) {
      w.phase = 'compiling';
      const run = ++w.run;
      w.t0 = performance.now();
      w.programs0 = gl.info.programs?.length ?? 0;
      if (c && !w.target) w.target = createWarmTarget();
      const forTarget = c ? w.target : null;
      compileWorld(gl, scene, camera, forTarget)
        .catch(() => undefined)
        .then(() => {
          if (w.run !== run || w.phase !== 'compiling') return; // superseded by a quality change / remount
          if (forTarget) w.phase = 'upload';
          else finishWarm(w, gl.info.programs?.length ?? 0, quality);
        });
    }
    if (w.phase === 'upload' && c && w.target) {
      uploadWorld(gl, scene, camera, w.target);
      finishWarm(w, gl.info.programs?.length ?? 0, quality);
    }

    // ---- dimmed behind reading sections: cut GPU work, keep the last frame on screen ----
    frame.current++;
    if (canvasOpacityAt(scrollState.T) < DIM_BELOW && frame.current % DIM_EVERY !== 0) return;

    if (c) {
      gl.getSize(size.current);
      const pr = gl.getPixelRatio();
      const a = applied.current;
      if (a.c !== c || a.w !== size.current.x || a.h !== size.current.y || a.pr !== pr) {
        c.setSize(size.current.x, size.current.y);
        a.c = c;
        a.w = size.current.x;
        a.h = size.current.y;
        a.pr = pr;
      }
      const prevAutoClear = gl.autoClear;
      gl.autoClear = true;
      c.render(delta);
      gl.autoClear = prevAutoClear;
    } else {
      gl.render(scene, camera);
    }
  }, 1);
  return null;
}

export function Effects() {
  const quality = useExperience((s) => s.quality);
  const composer = useRef<ComposerImpl | null>(null);
  return (
    <>
      <QualityGovernor />
      {quality !== 'low' ? (
        // enabled={false}: the composer's own render loop is off — FrameDriver renders it (warm-up, throttling).
        <EffectComposer ref={composer} enabled={false} multisampling={quality === 'high' ? 4 : 2} enableNormalPass={false}>
          <Bloom
            mipmapBlur
            luminanceThreshold={0.88}
            luminanceSmoothing={0.22}
            intensity={quality === 'high' ? 0.95 : 0.8}
            radius={0.74}
            levels={quality === 'high' ? 7 : 5}
          />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          <Vignette offset={0.26} darkness={0.66} />
          <Noise premultiply opacity={0.035} blendFunction={BlendFunction.SOFT_LIGHT} />
        </EffectComposer>
      ) : null}
      <FrameDriver composer={composer} quality={quality} />
    </>
  );
}
