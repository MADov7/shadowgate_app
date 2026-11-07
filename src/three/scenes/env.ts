// Studio reflection environment for the metallic objects in the later scenes (network, constellation, build,
// horizon gate): a dark room with one soft overhead key, two teal strips and a cool fill. Faceted metal picks
// up crisp, brand-coloured highlights from it. It is applied per material (material.envMap), so it never
// touches the global scene.environment owned by the world-core scene.
import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import {
  BackSide,
  BoxGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  type Texture,
  type WebGLRenderer,
} from 'three';
import { COLORS } from '../../brand/brand';

const cache = new WeakMap<WebGLRenderer, Texture>();

function panel(
  scene: Scene,
  size: [number, number],
  color: string,
  intensity: number,
  pos: [number, number, number],
  look: [number, number, number],
) {
  const mesh = new Mesh(
    new PlaneGeometry(size[0], size[1]),
    new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity), side: DoubleSide }),
  );
  mesh.position.set(...pos);
  mesh.lookAt(...look);
  scene.add(mesh);
}

export function getStudioEnv(gl: WebGLRenderer): Texture {
  const hit = cache.get(gl);
  if (hit) return hit;
  const scene = new Scene();
  scene.add(new Mesh(new BoxGeometry(30, 16, 30), new MeshBasicMaterial({ color: '#0b1324', side: BackSide })));
  panel(scene, [16, 3.5], '#ffffff', 2.4, [0, 7.8, -1], [0, 0, 0]); // overhead softbox
  panel(scene, [1.4, 11], COLORS.teal, 3.4, [-13, 1, -5], [0, 1, 0]); // teal strip, back-left
  panel(scene, [1.0, 9], COLORS.teal, 1.7, [12, 0.5, 9], [0, 0.5, 0]); // teal strip, front-right
  panel(scene, [9, 5], '#6c84b4', 0.55, [9, 2.5, -13], [0, 0, 0]); // cool fill
  panel(scene, [30, 30], '#05080f', 1, [0, -7.9, 0], [0, 0, 0]); // dark floor
  const pmrem = new PMREMGenerator(gl);
  const texture = pmrem.fromScene(scene, 0.035).texture;
  pmrem.dispose();
  scene.traverse((o) => {
    if (o instanceof Mesh) {
      o.geometry.dispose();
      (o.material as MeshBasicMaterial).dispose();
    }
  });
  cache.set(gl, texture);
  return texture;
}

/** The shared studio environment texture for this renderer (built once, lives as long as the canvas). */
export function useStudioEnv(): Texture {
  const gl = useThree((s) => s.gl);
  return useMemo(() => getStudioEnv(gl), [gl]);
}
