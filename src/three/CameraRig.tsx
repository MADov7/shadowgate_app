// OWNER: world-core agent (may refine). Drives the single camera from the scroll timeline T and the
// entrance progress, with critically-damped smoothing and gentle pointer parallax.
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';
import { scrollState } from '../state/scroll';
import { easeInOutCubic, range } from '../lib/choreo';
import { ENTRY_PHASES, WELCOME_CAM, sampleCamera, type CamPose } from './worldLayout';

export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const pose = useRef<CamPose>({ pos: [0, 0, 0], look: [0, 0, 0], fov: 45 });
  const pos = useRef(new Vector3(...WELCOME_CAM.pos));
  const look = useRef(new Vector3(...WELCOME_CAM.look));
  const target = useRef(new Vector3());
  const targetLook = useRef(new Vector3());

  useFrame((_, delta) => {
    const p = sampleCamera(scrollState.T, pose.current);
    const fly = easeInOutCubic(range(ENTRY_PHASES.fly[0], ENTRY_PHASES.fly[1], scrollState.entry));
    target.current.set(
      WELCOME_CAM.pos[0] + (p.pos[0] - WELCOME_CAM.pos[0]) * fly,
      WELCOME_CAM.pos[1] + (p.pos[1] - WELCOME_CAM.pos[1]) * fly,
      WELCOME_CAM.pos[2] + (p.pos[2] - WELCOME_CAM.pos[2]) * fly,
    );
    targetLook.current.set(
      WELCOME_CAM.look[0] + (p.look[0] - WELCOME_CAM.look[0]) * fly,
      WELCOME_CAM.look[1] + (p.look[1] - WELCOME_CAM.look[1]) * fly,
      WELCOME_CAM.look[2] + (p.look[2] - WELCOME_CAM.look[2]) * fly,
    );
    // Gentle pointer parallax.
    target.current.x += scrollState.pointerX * 0.35;
    target.current.y += scrollState.pointerY * 0.2;

    const k = 1 - Math.exp(-delta * 5);
    pos.current.lerp(target.current, k);
    look.current.lerp(targetLook.current, k);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
    const fov = WELCOME_CAM.fov + (p.fov - WELCOME_CAM.fov) * fly;
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov += (fov - camera.fov) * k;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}
