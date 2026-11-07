// Scene E (T 8.3 → 9.2) — a symbolic gateway that assembles segment by segment as the request basket grows
// (services + package = line items). Symbolic only: selecting services does not activate any protection.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { useBasket } from '../state/basket';
import { scrollState } from '../state/scroll';
import { useStudioEnv } from './scenes/env';
import { createBuildScene } from './scenes/buildScene';
import { usePrecompile } from './scenes/precompile';
import { glowTexture } from './scenes/shaders';

const lineItems = (s: { serviceIds: readonly unknown[]; packageId: unknown }) => s.serviceIds.length + (s.packageId ? 1 : 0);

export function BuildStructure() {
  const env = useStudioEnv();
  const scene = useMemo(() => createBuildScene(env), [env]);
  useEffect(() => () => scene.dispose(), [scene]);
  // Basket changes reach the scene without re-rendering React.
  useEffect(() => {
    scene.setCount(lineItems(useBasket.getState()));
    return useBasket.subscribe((s) => scene.setCount(lineItems(s)));
  }, [scene]);
  usePrecompile([scene.root], [glowTexture()]);
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
