// OWNER: world-core agent (may refine). The ONE WebGL canvas, fixed behind the page.
// Lazy-loaded so essential UI renders before three.js downloads.
import { Canvas } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { useExperience } from '../state/experience';
import { scrollState } from '../state/scroll';
import { canvasOpacityAt } from '../lib/choreo';
import { COLORS } from '../brand/brand';
import { World } from './World';
import './Stage.css';

const DPR = { high: [1, 2], medium: [1, 1.5], low: [1, 1.25] } as const;

export default function Stage() {
  const quality = useExperience((s) => s.quality);
  const setSceneReady = useExperience((s) => s.setSceneReady);
  const failWebGL = useExperience((s) => s.failWebGL);
  const wrap = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={wrap} className="sg-stage" aria-hidden="true">
      <Canvas
        dpr={[...DPR[quality]] as [number, number]}
        gl={{ antialias: quality !== 'low', powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ fov: 42, near: 0.1, far: 220, position: [0, 2.3, 12.5] }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(COLORS.navy, 1);
          gl.toneMapping = ACESFilmicToneMapping;
          gl.outputColorSpace = SRGBColorSpace;
          scene.background = null;
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            failWebGL();
          });
          requestAnimationFrame(() => setSceneReady(true));
        }}
      >
        <World />
      </Canvas>
    </div>
  );
}
