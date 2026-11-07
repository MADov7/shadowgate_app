// Scene C (T 2.6 → 5.5) — an abstract company network on a dark hex platform: a central core and four assets
// (website, email, cloud, accounts) linked by luminous data lines. The five protection layers reveal with T
// (layerReveal in LAYER_ORDER); symbolic red packets are intercepted at revealed shells. Storytelling only.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import { useLangStore } from '../i18n';
import { useExperience } from '../state/experience';
import { scrollState } from '../state/scroll';
import { useStudioEnv } from './scenes/env';
import { createNetworkScene } from './scenes/networkScene';
import { usePrecompile } from './scenes/precompile';

export function DefenseNetwork() {
  const env = useStudioEnv();
  // Built once with the start-up quality: stable materials, so a later quality step never rebuilds/recompiles.
  const [quality] = useState(() => useExperience.getState().quality);
  const scene = useMemo(() => createNetworkScene(env, quality), [env, quality]);
  useEffect(() => () => scene.dispose(), [scene]);
  useEffect(() => {
    scene.setRtl(useLangStore.getState().lang === 'ar');
    return useLangStore.subscribe((s) => scene.setRtl(s.lang === 'ar'));
  }, [scene]);
  usePrecompile([scene.root]);
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
  return (
    <>
      <primitive object={scene.root} />
      <primitive object={scene.light} />
    </>
  );
}
