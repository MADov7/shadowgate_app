// Scene D (T 5.5 → 7.5) — Hamol-inspired constellation of the eight business services. The focused object grows,
// brightens and turns; the DOM section (#explore) reads the projected hotspots and drives the drag yaw.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import { useLangStore } from '../i18n';
import { useExperience } from '../state/experience';
import { scrollState } from '../state/scroll';
import { useStudioEnv } from './scenes/env';
import { createConstellationScene } from './scenes/constellationScene';
import { usePrecompile } from './scenes/precompile';
import { dotTexture, glowTexture } from './scenes/shaders';

export function ServiceConstellation() {
  const env = useStudioEnv();
  // Built once with the start-up quality: stable materials, so a later quality step never rebuilds/recompiles.
  const [quality] = useState(() => useExperience.getState().quality);
  const scene = useMemo(() => createConstellationScene(env, quality), [env, quality]);
  useEffect(() => () => scene.dispose(), [scene]);
  useEffect(() => {
    scene.setRtl(useLangStore.getState().lang === 'ar');
    return useLangStore.subscribe((s) => scene.setRtl(s.lang === 'ar'));
  }, [scene]);
  usePrecompile([scene.root], [glowTexture(), dotTexture()]);
  useFrame((state, delta) => {
    scene.update(
      scrollState.T,
      state.clock.elapsedTime,
      Math.min(delta, 0.1),
      state.camera,
      state.size.width,
      state.size.height,
    );
  });
  return <primitive object={scene.root} />;
}
