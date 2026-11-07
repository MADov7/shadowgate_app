// Dev-only renderer for the 12-second ad (served at /ad.html, never part of the production build).
//   /ad.html                                   preview player (real-time, with controls)
//   /ad.html?mode=plate&aspect=16x9            3D picture plate, stepped frame by frame by scripts/ad/capture.mjs
//   /ad.html?mode=overlay&aspect=9x16&lang=ar  transparent typography layer for compositing
import { Canvas, advance } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { World } from '../three/World';
import { COLORS } from '../brand/brand';
import { scrollState } from '../state/scroll';
import { useBasket } from '../state/basket';
import { BUSINESS_SERVICE_IDS } from '../data/services';
import { RedPulse } from './RedPulse';
import { AdOverlay } from './AdOverlay';
import { adState } from './adState';
import { FPS, TOTAL_FRAMES, worldAt, type AdLang, type Aspect } from './timeline';

const params = new URLSearchParams(location.search);
const MODE = (params.get('mode') ?? 'preview') as 'preview' | 'plate' | 'overlay';
const ASPECT: Aspect = params.get('aspect') === '9x16' ? '9x16' : '16x9';
const LANG: AdLang = params.get('lang') === 'ar' ? 'ar' : 'en';
const W = ASPECT === '9x16' ? 1080 : 1920;
const H = ASPECT === '9x16' ? 1920 : 1080;
const STEP = 1 / FPS;
const PREROLL = 54; // frames to let the damped camera settle after a cut

// Never touch the visitor's real request basket from the ad page.
useBasket.persist.setOptions({ name: 'sg-ad-scratch' });

function applyWorld(frame: number): { cut: boolean } {
  const world = worldAt(frame / FPS);
  const cut = frame === 0 || world.segment !== adState.world.segment || frame !== adState.frame + 1;
  adState.frame = frame;
  adState.world = world;
  scrollState.T = world.T;
  scrollState.entry = world.entry;
  scrollState.pointerX = 0;
  scrollState.pointerY = 0;
  const count = world.basketCount;
  const ids = BUSINESS_SERVICE_IDS.slice(0, Math.min(8, count));
  const cur = useBasket.getState();
  const pkg = count >= 9 ? 'business' : null;
  if (cur.serviceIds.length !== ids.length || cur.packageId !== pkg) useBasket.setState({ serviceIds: [...ids], packageId: pkg });
  return { cut };
}

function Fx({ frame }: { frame: number }) {
  const w = worldAt(frame / FPS);
  return (
    <>
      <div className="ad-fx ad-fx--vignette" />
      <div className="ad-fx ad-fx--impact" style={{ opacity: w.impact }} />
      <div className="ad-fx ad-fx--darken" style={{ opacity: w.darken }} />
      <div className="ad-fx ad-fx--flash" style={{ opacity: w.flash }} />
      <div className="ad-fx ad-fx--black" style={{ opacity: w.black }} />
    </>
  );
}

function Plate({ frame, stepped }: { frame: number; stepped: boolean }) {
  return (
    <>
      <Canvas
        frameloop={stepped ? 'never' : 'always'}
        dpr={1}
        gl={{ antialias: false, alpha: false, stencil: false, depth: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        camera={{ fov: 42, near: 0.1, far: 240, position: [0, 1.7, 11.4] }}
        style={{ width: W, height: H }}
        onCreated={({ gl }) => {
          gl.setClearColor(COLORS.navy, 1);
          gl.toneMapping = ACESFilmicToneMapping;
          gl.outputColorSpace = SRGBColorSpace;
          (window as unknown as { __adGl?: unknown }).__adGl = gl;
        }}
      >
        <World />
        <RedPulse />
      </Canvas>
      <Fx frame={frame} />
    </>
  );
}

export function AdApp() {
  const [frame, setFrame] = useState(0);
  const clock = useRef(0);
  const transparent = MODE === 'overlay';

  useEffect(() => {
    document.documentElement.classList.toggle('ad-transparent', transparent);
  }, [transparent]);

  // Deterministic stepping API for the capture script.
  const render = useCallback(async (f: number) => {
    const { cut } = applyWorld(f);
    flushSync(() => setFrame(f));
    if (MODE === 'plate') {
      if (cut) for (let i = 0; i < PREROLL; i++) advance((clock.current += STEP));
      advance((clock.current += STEP));
    }
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  }, []);

  useEffect(() => {
    const ready = Promise.all([
      document.fonts.load('800 64px "Manrope Variable"'),
      document.fonts.load('800 64px Tajawal'),
      document.fonts.load('600 32px "Manrope Variable"'),
      document.fonts.ready,
    ]).then(() => undefined);
    (window as unknown as { __ad?: unknown }).__ad = { render, ready, totalFrames: TOTAL_FRAMES, fps: FPS, mode: MODE };
  }, [render]);

  // Preview: real-time playback loop.
  const [playing, setPlaying] = useState(MODE === 'preview');
  useEffect(() => {
    if (MODE !== 'preview' || !playing) return;
    let raf = 0;
    const start = performance.now() - (frame / FPS) * 1000;
    const tick = (now: number) => {
      const f = Math.floor(((now - start) / 1000) * FPS) % TOTAL_FRAMES;
      applyWorld(f);
      setFrame(f);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const scale = useMemo(() => (MODE === 'preview' ? Math.min(innerWidth / W, (innerHeight - 70) / H) : 1), []);

  const stage = (
    <div className="ad-frame" style={{ width: W, height: H }}>
      {MODE !== 'overlay' ? <Plate frame={frame} stepped={MODE === 'plate'} /> : null}
      {MODE !== 'plate' ? <AdOverlay frame={frame} aspect={ASPECT} lang={LANG} /> : null}
    </div>
  );

  if (MODE !== 'preview') return stage;
  return (
    <div className="ad-player">
      <div className="ad-player__stage" style={{ transform: `scale(${scale})` }}>
        {stage}
      </div>
      <div className="ad-player__bar">
        <button type="button" onClick={() => setPlaying((p) => !p)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <span>
          {(frame / FPS).toFixed(2)}s · f{String(frame).padStart(3, '0')} / {TOTAL_FRAMES}
        </span>
        <a href={`?aspect=${ASPECT === '16x9' ? '9x16' : '16x9'}&lang=${LANG}`}>{ASPECT === '16x9' ? '9:16' : '16:9'}</a>
        <a href={`?aspect=${ASPECT}&lang=${LANG === 'en' ? 'ar' : 'en'}`}>{LANG === 'en' ? 'العربية' : 'English'}</a>
      </div>
    </div>
  );
}
