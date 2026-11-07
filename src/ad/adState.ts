// Mutable per-frame state for the ad renderer (read by the 3D extras in useFrame).
import { worldAt, type AdWorldState } from './timeline';

export const adState: { frame: number; world: AdWorldState } = {
  frame: 0,
  world: worldAt(0),
};
