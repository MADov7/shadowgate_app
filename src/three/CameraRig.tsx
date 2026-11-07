// OWNER: world-core agent. Drives the single camera from the scroll timeline T and the entrance progress.
//  - entry 0 → 1: welcome pose outside the closed gate → a cubic Bézier that threads the camera through the
//    centre of the opening (never through the leaves) → the hero pose for the current T.
//  - critically-damped smoothing (stiffer during the entrance so the path stays inside the opening)
//  - gentle pointer parallax + idle drift (reduced on touch devices)
//  - portrait screens get a wider FOV (and the welcome pose a small dolly-back) so framing survives phones.
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';
import { scrollState } from '../state/scroll';
import { clamp01, smoothstep } from '../lib/choreo';
import { WELCOME_CAM, sampleCamera, type CamPose, type Vec3 } from './worldLayout';
import { flyProgress } from './core/entry';

/** Bézier controls on the gate axis: approach straight on, cross the gate plane near x = 0, then bank. */
const C1: Vec3 = [0, 2.2, 4.8];
const C2: Vec3 = [0, 2.45, -0.9];

function bezier(p0: Vec3, p1: Vec3, p2: Vec3, p3: Vec3, u: number, out: Vector3): Vector3 {
  const v = 1 - u;
  const a = v * v * v;
  const b = 3 * v * v * u;
  const c = 3 * v * u * u;
  const d = u * u * u;
  return out.set(
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
    a * p0[2] + b * p1[2] + c * p2[2] + d * p3[2],
  );
}

export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const pose = useRef<CamPose>({ pos: [0, 0, 0], look: [0, 0, 0], fov: 45 });
  const pos = useRef(new Vector3(...WELCOME_CAM.pos));
  const look = useRef(new Vector3(...WELCOME_CAM.look));
  const target = useRef(new Vector3());
  const targetLook = useRef(new Vector3());
  const welcome = useRef<Vec3>([0, 0, 0]);
  const coarse = useMemo(() => window.matchMedia?.('(pointer: coarse)').matches ?? false, []);
  const first = useRef(true);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const time = state.clock.elapsedTime;
    const aspect = state.size.width / Math.max(1, state.size.height);
    const portrait = clamp01((1.25 - aspect) / 0.8);

    const p = sampleCamera(scrollState.T, pose.current);
    const fly = flyProgress(scrollState.entry);

    // Welcome pose, dollied back a little on portrait screens.
    const w = welcome.current;
    const dolly = 0.32 * portrait;
    for (let i = 0; i < 3; i++) w[i] = WELCOME_CAM.pos[i] + (WELCOME_CAM.pos[i] - WELCOME_CAM.look[i]) * dolly;

    const t = target.current;
    if (fly <= 0) t.set(w[0], w[1], w[2]);
    else if (fly >= 1) t.set(p.pos[0], p.pos[1], p.pos[2]);
    else bezier(w, C1, C2, p.pos, fly, t);

    // Keep looking at the gate until close, then turn toward the scene ahead.
    const lu = smoothstep(0.22, 0.92, fly);
    const L = targetLook.current;
    L.set(
      WELCOME_CAM.look[0] + (p.look[0] - WELCOME_CAM.look[0]) * lu,
      WELCOME_CAM.look[1] + (p.look[1] - WELCOME_CAM.look[1]) * lu,
      WELCOME_CAM.look[2] + (p.look[2] - WELCOME_CAM.look[2]) * lu,
    );

    // Pointer parallax (stronger while standing at the gate) + a slow idle drift so the frame never freezes.
    const par = (coarse ? 0.25 : 1) * (1 + 0.35 * (1 - fly));
    t.x += scrollState.pointerX * 0.34 * par + Math.sin(time * 0.13) * 0.07;
    t.y += scrollState.pointerY * 0.18 * par + Math.sin(time * 0.17 + 1.3) * 0.045;
    L.x += scrollState.pointerX * 0.12 * par;
    L.y += scrollState.pointerY * 0.06 * par;

    const entering = scrollState.entry > 0.001 && scrollState.entry < 0.999;
    const k = first.current ? 1 : 1 - Math.exp(-dt * (entering ? 9 : 4.6));
    first.current = false;
    pos.current.lerp(t, k);
    look.current.lerp(L, k);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);

    const baseFov = WELCOME_CAM.fov + (p.fov - WELCOME_CAM.fov) * fly;
    const fov = Math.min(72, baseFov * (1 + 0.36 * portrait));
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov += (fov - camera.fov) * k;
      camera.updateProjectionMatrix();
    }
  }, -2);
  return null;
}
