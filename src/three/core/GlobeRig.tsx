// Writes globeState (yaw + matrix) once per frame, before the globe dots and the threat arcs render.
//  - while forming (T 0.35→1.25) the globe spins into place
//  - during the radar it drifts slowly, keeping the illustrative demo network on the visible face
//  - when an event is selected it eases so the selected arc faces the camera
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { scrollState } from '../../state/scroll';
import { smoothstep } from '../../lib/choreo';
import { HOME_REGION } from '../../lib/geo';
import { WORLD } from '../worldLayout';
import { angleDelta, globeState, syncGlobeMatrix } from './globeState';

const DEG = Math.PI / 180;
const HOME_LON = HOME_REGION.lon * DEG;

export function GlobeRig() {
  const first = useRef(true);
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const T = scrollState.T;
    const time = state.clock.elapsedTime;
    const cam = state.camera.position;
    const camAz = Math.atan2(cam.x - WORLD.core[0], cam.z - WORLD.core[2]);

    let target: number;
    let rate: number;
    const f = globeState.focus;
    if (f) {
      target = camAz - Math.atan2(f.x, f.z);
      rate = 2.4;
    } else {
      // Home a little right of centre so arcs from the west sweep across the visible hemisphere.
      target = camAz - HOME_LON - 0.38 + 0.2 * Math.sin(time * 0.06) + (T - 1.8) * 0.2;
      target -= (1 - smoothstep(0.3, 1.25, T)) * 1.5;
      rate = 1.5;
    }
    if (first.current) globeState.rotY = target;
    else globeState.rotY += angleDelta(globeState.rotY, target) * (1 - Math.exp(-dt * rate));
    first.current = false;
    syncGlobeMatrix();
  }, -1);
  return null;
}
