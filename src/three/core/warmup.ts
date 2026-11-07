// Start-up warm-up for the whole world, so scrolling into a scene for the first time never hitches.
//  1. compileAsync: every material in the scene graph (visible or not — three's compile() walks the full tree)
//     is compiled for the SAME target the frame will use (the composer's HDR buffer, or the screen on the low
//     tier). Tone mapping / output colour space are part of a program's key, so compiling for the wrong target
//     would just compile a second, unused variant. KHR_parallel_shader_compile keeps this off the main thread.
//  2. upload pass: once the programs are ready, one render of the WHOLE graph (all objects forced visible, no
//     frustum culling) into a tiny offscreen target uploads every geometry buffer and texture to the GPU.
// Visibility / culling flags are restored immediately, inside the same frame, so nothing ever flashes on screen.
import {
  HalfFloatType,
  WebGLRenderTarget,
  type Camera,
  type Object3D,
  type Scene,
  type WebGLRenderer,
} from 'three';

/** True for objects that make draw calls. */
function isRenderable(o: Object3D): boolean {
  const r = o as Object3D & { isMesh?: boolean; isPoints?: boolean; isLine?: boolean; isSprite?: boolean };
  return !!(r.isMesh || r.isPoints || r.isLine || r.isSprite);
}

function effectivelyVisible(o: Object3D): boolean {
  for (let p: Object3D | null = o; p; p = p.parent) if (!p.visible) return false;
  return true;
}

/** Small offscreen target whose program variants match the EffectComposer's input buffer (non-null target). */
export function createWarmTarget(): WebGLRenderTarget {
  return new WebGLRenderTarget(32, 32, { type: HalfFloatType, depthBuffer: true, stencilBuffer: false });
}

/**
 * Compiles every material for `target` (null = the screen). Resolves when all programs report ready
 * (or after `timeoutMs`, so a stalled driver can never block the warm-up forever).
 *  - with KHR_parallel_shader_compile: one compileAsync over the whole graph (the driver compiles off-thread)
 *  - without it (compiles block the main thread): object by object across animation frames, ~`budgetMs` per
 *    frame, so the welcome screen keeps animating on weaker devices instead of freezing once.
 */
export function compileWorld(
  gl: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  target: WebGLRenderTarget | null,
  { timeoutMs = 8000, budgetMs = 8 }: { timeoutMs?: number; budgetMs?: number } = {},
): Promise<void> {
  const withTarget = <R>(fn: () => R): R => {
    // compile() reads the current render target synchronously; restore it before anything else renders.
    const prev = gl.getRenderTarget();
    gl.setRenderTarget(target);
    try {
      return fn();
    } finally {
      gl.setRenderTarget(prev);
    }
  };

  let pending: Promise<unknown>;
  if (gl.extensions.has('KHR_parallel_shader_compile')) {
    pending = withTarget(() => gl.compileAsync(scene, camera));
  } else {
    const queue: Object3D[] = [];
    scene.traverse((o) => {
      if (isRenderable(o)) queue.push(o);
    });
    let i = 0;
    pending = new Promise<void>((resolve) => {
      const step = () => {
        const t0 = performance.now();
        withTarget(() => {
          while (i < queue.length && performance.now() - t0 < budgetMs) gl.compile(queue[i++], camera, scene);
        });
        if (i < queue.length) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }
  return Promise.race([pending, new Promise((r) => setTimeout(r, timeoutMs))]).then(() => undefined);
}

/**
 * One render of the entire graph into `target` with everything forced visible and unculled, restoring the
 * flags afterwards. Uploads all buffers/textures (and links any program compileWorld missed).
 */
export function uploadWorld(gl: WebGLRenderer, scene: Scene, camera: Camera, target: WebGLRenderTarget): void {
  // Lights keep their effective visibility: the light count is part of every lit program's key, so forcing a
  // hidden light on would compile variants the real frames never use.
  const lightOn = new Map<Object3D, boolean>();
  scene.traverse((o) => {
    if ((o as Object3D & { isLight?: boolean }).isLight) lightOn.set(o, effectivelyVisible(o));
  });
  const touched: Object3D[] = [];
  const flags: number[] = [];
  scene.traverse((o) => {
    if (o === scene) return;
    touched.push(o);
    flags.push((o.visible ? 1 : 0) | (o.frustumCulled ? 2 : 0));
    o.visible = lightOn.get(o) ?? true;
    if (isRenderable(o)) o.frustumCulled = false;
  });
  const prev = gl.getRenderTarget();
  const prevAutoClear = gl.autoClear;
  try {
    gl.setRenderTarget(target);
    gl.autoClear = true;
    gl.render(scene, camera);
  } finally {
    gl.autoClear = prevAutoClear;
    gl.setRenderTarget(prev);
    for (let i = 0; i < touched.length; i++) {
      touched[i].visible = (flags[i] & 1) === 1;
      touched[i].frustumCulled = (flags[i] & 2) === 2;
    }
  }
}
