// Scene F (T 9 → 10) — the final gate opens toward a calm teal horizon behind the individuals + contact sections.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import { useExperience } from '../state/experience';
import { scrollState } from '../state/scroll';
import { useStudioEnv } from './scenes/env';
import { createHorizonScene } from './scenes/horizonScene';
import { usePrecompile } from './scenes/precompile';
import { dotTexture } from './scenes/shaders';

export function HorizonGate() {
  const env = useStudioEnv();
  // Built once with the start-up quality: stable materials, so a later quality step never rebuilds/recompiles.
  const [quality] = useState(() => useExperience.getState().quality);
  const scene = useMemo(() => createHorizonScene(env, quality), [env, quality]);
  useEffect(() => () => scene.dispose(), [scene]);
  usePrecompile([scene.root], [dotTexture()]);
  useFrame((state, delta) => {
    scene.update(scrollState.T, state.clock.elapsedTime, Math.min(delta, 0.1));
  });
  return (
    <>
      <primitive object={scene.root} />
      <primitive object={scene.light} />
    </>
  );
}
