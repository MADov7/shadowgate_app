// OWNER: world-core agent. The ONE WebGL canvas, fixed behind the page.
// Lazy-loaded so essential UI renders before three.js downloads.
//  - DPR caps per quality tier (high 1.5, medium 1.25, low 1).
//  - WebGL context loss: wait for the browser to restore the context (three re-initialises itself) and remount the
//    world so every GPU resource — including render-target-generated environment maps — is rebuilt. Only when no
//    restore arrives within RESTORE_GRACE_MS does the site fall back to the static experience.
//  - The canvas dims behind long reading sections (opacity is a pure function of T); Effects' FrameDriver also
//    renders at a reduced rate there.
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { ACESFilmicToneMapping, SRGBColorSpace, type WebGLRenderer } from 'three';
import { useExperience } from '../state/experience';
import { scrollState } from '../state/scroll';
import { canvasOpacityAt } from '../lib/choreo';
import { COLORS } from '../brand/brand';
import { World } from './World';
import { QA_ENTRY, QA_T } from './core/qa';
import './Stage.css';

const DPR = { high: [1, 1.5], medium: [1, 1.25], low: [1, 1] } as const;
const RESTORE_GRACE_MS = 2500;

/** QA: ?entry=<0..1> pins the entrance progress so every welcome state can be screenshotted (?qaT pins T, dev). */
function QaEntryPin() {
  useFrame(() => {
    if (QA_ENTRY !== null) scrollState.entry = QA_ENTRY;
    if (QA_T !== null) scrollState.T = QA_T;
  }, -3);
  return null;
}

export default function Stage() {
  const quality = useExperience((s) => s.quality);
  const setSceneReady = useExperience((s) => s.setSceneReady);
  const failWebGL = useExperience((s) => s.failWebGL);
  const wrap = useRef<HTMLDivElement>(null);
  const [gl, setGl] = useState<WebGLRenderer | null>(null);
  /** Bumped after a context restore → remounts the world. */
  const [generation, setGeneration] = useState(0);
  // Context attributes are fixed at creation: MSAA on the default framebuffer only matters for the
  // composer-less low tier (the composer has its own multisampling).
  const initialQuality = useRef(quality).current;

  useEffect(() => {
    if (QA_ENTRY !== null) scrollState.entry = QA_ENTRY;
  }, []);

  // Dim the canvas behind long reading sections (opacity is a pure function of T).
  useEffect(() => {
    let raf = 0;
    let last = -1;
    const tick = () => {
      const o = canvasOpacityAt(scrollState.T);
      if (wrap.current && Math.abs(o - last) > 0.005) {
        wrap.current.style.opacity = o.toFixed(3);
        last = o;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Context loss → give the browser a moment to restore it before giving up on WebGL.
  useEffect(() => {
    if (!gl) return;
    const canvas = gl.domElement;
    let timer = 0;
    const onLost = (e: Event) => {
      e.preventDefault(); // signals that we will handle a restore
      window.clearTimeout(timer);
      timer = window.setTimeout(failWebGL, RESTORE_GRACE_MS);
    };
    const onRestored = () => {
      window.clearTimeout(timer);
      timer = 0;
      setGeneration((g) => g + 1);
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    return () => {
      window.clearTimeout(timer);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
    };
  }, [gl, failWebGL]);

  // Dev-only inspection hook (frame-time probes, shader-program counts, context-loss drills).
  useEffect(() => {
    if (!import.meta.env.DEV || !gl) return;
    const w = window as unknown as Record<string, unknown>;
    w.__sg3d = {
      gl,
      scroll: scrollState,
      programs: () => gl.info.programs?.length ?? 0,
      quality: () => useExperience.getState().quality,
      loseContext: (restoreAfterMs = 800) => {
        const ext = gl.getContext().getExtension('WEBGL_lose_context');
        ext?.loseContext();
        if (ext && restoreAfterMs >= 0) window.setTimeout(() => ext.restoreContext(), restoreAfterMs);
        return !!ext;
      },
    };
    return () => {
      delete w.__sg3d;
    };
  }, [gl]);

  return (
    <div ref={wrap} className="sg-stage" aria-hidden="true">
      <Canvas
        dpr={[...DPR[quality]] as [number, number]}
        gl={{
          antialias: initialQuality === 'low',
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
          depth: true,
        }}
        camera={{ fov: 42, near: 0.1, far: 240, position: [0, 1.7, 11.4] }}
        onCreated={({ gl: renderer, scene }) => {
          renderer.setClearColor(COLORS.navy, 1);
          renderer.toneMapping = ACESFilmicToneMapping;
          renderer.outputColorSpace = SRGBColorSpace;
          scene.background = null;
          setGl(renderer);
          requestAnimationFrame(() => setSceneReady(true));
        }}
      >
        <QaEntryPin />
        <World key={generation} />
      </Canvas>
    </div>
  );
}
