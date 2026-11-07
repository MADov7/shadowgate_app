// Shader warm-up for the later scenes. Their groups stay hidden (visible = false) until the camera nears them,
// and three.js would otherwise compile each program — and upload each canvas texture — on the first frame the
// group appears, which shows up as a ~200 ms hitch mid-scroll. A few frames after mount (fog, lights and the
// composer are in place by then) every material in the group is compiled against the real scene, for the same
// render-target variant the composer renders into, while the welcome screen / hero is still showing.
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { WebGLRenderTarget, type Object3D, type Texture } from 'three';
import { useExperience } from '../../state/experience';

const WARMUP_FRAME = 3;
let offscreen: WebGLRenderTarget | null = null;

/** Compiles `roots` (hidden or not) once, shortly after mount, and uploads `textures`. Materials must be stable. */
export function usePrecompile(roots: readonly Object3D[], textures: readonly Texture[] = []): void {
  const frames = useRef(0);
  useFrame(({ gl, scene, camera }) => {
    if (frames.current > WARMUP_FRAME) return;
    if (++frames.current <= WARMUP_FRAME) return;
    // With the composer (medium/high) the scene renders into a float target: no tone mapping / sRGB in the
    // material programs. Without it (low) the renderer draws straight to the canvas.
    const viaComposer = useExperience.getState().quality !== 'low';
    const previous = gl.getRenderTarget();
    if (viaComposer) {
      offscreen ??= new WebGLRenderTarget(1, 1);
      gl.setRenderTarget(offscreen);
    } else {
      gl.setRenderTarget(null);
    }
    try {
      for (const root of roots) void gl.compileAsync(root, camera, scene);
    } finally {
      gl.setRenderTarget(previous);
    }
    for (const texture of textures) gl.initTexture(texture);
  });
}
