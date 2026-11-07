// Scene E — "Build your protection": a symbolic gateway of nine segments (base, pillars, chamfers, lintel, two
// leaves, the S path) that assembles as the request basket grows. Segments beyond the basket count stay as
// faint wireframe ghosts. Purely symbolic — selecting services does not activate any protection.
import {
  AdditiveBlending,
  BoxGeometry,
  CircleGeometry,
  EdgesGeometry,
  ExtrudeGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
  type BufferGeometry,
  type Material,
  type Texture,
} from 'three';
import { COLORS } from '../../brand/brand';
import { smoothstep } from '../../lib/choreo';
import { WORLD } from '../worldLayout';
import { chamferFramePoints, disposeObject, polygonShape } from './geometry';
import { TEAL, glowTexture } from './shaders';

export const BUILD_SEGMENTS = 9;
const VISIBLE_FROM = 7.85;
const VISIBLE_TO = 9.45;

/** Frame dimensions (local units). */
const W = 4.4;
const H = 5.0;
const C = 1.2;
const TH = 0.4;
const Y0 = 0.32;
const DEPTH = 0.56;

function extrudePoly(points: ReadonlyArray<readonly [number, number]>, depth: number, bevel = 0.025): ExtrudeGeometry {
  const g = new ExtrudeGeometry(polygonShape(points), {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

interface Segment {
  /** Group that flies into place (built state). */
  built: Group;
  /** Wireframe ghost (always present, fades as the segment is built). */
  ghost: Group;
  ghostMat: LineBasicMaterial;
  edgeMat: LineBasicMaterial;
  glowMats: MeshBasicMaterial[];
  /** Direction the segment arrives from. */
  from: [number, number, number];
  value: number;
}

export interface BuildScene {
  root: Group;
  light: PointLight;
  /** Number of basket line items (services + package). */
  setCount: (count: number) => void;
  update: (T: number, time: number, dt: number) => void;
  dispose: () => void;
}

export function createBuildScene(env: Texture): BuildScene {
  const root = new Group();
  root.name = 'sg-build';
  root.position.set(...WORLD.build);

  const metal = new MeshStandardMaterial({ color: '#33445f', metalness: 0.9, roughness: 0.3, envMap: env, envMapIntensity: 1.3, flatShading: true });
  const metalLight = new MeshStandardMaterial({ color: '#4d5f7e', metalness: 0.88, roughness: 0.26, envMap: env, envMapIntensity: 1.3, flatShading: true });
  const metalDark = new MeshStandardMaterial({ color: '#151e30', metalness: 0.85, roughness: 0.4, envMap: env, envMapIntensity: 1.0, flatShading: true });

  const { outer, inner } = chamferFramePoints(W, H, C, TH, Y0);
  const segments: Segment[] = [];

  function addSegment(parent: Group, geos: { geo: BufferGeometry; mat: Material; glow?: boolean }[], from: [number, number, number]) {
    const built = new Group();
    const edgeMat = new LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
    const ghostMat = new LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.2, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
    const ghost = new Group();
    const glowMats: MeshBasicMaterial[] = [];
    for (const { geo, mat, glow } of geos) {
      const m = new Mesh(geo, mat);
      built.add(m);
      if (glow) glowMats.push(mat as MeshBasicMaterial);
      const edges = new EdgesGeometry(geo, 25);
      built.add(new LineSegments(edges, edgeMat));
      ghost.add(new LineSegments(edges, ghostMat));
    }
    parent.add(built);
    parent.add(ghost);
    segments.push({ built, ghost, ghostMat, edgeMat, glowMats, from, value: 0 });
  }

  // 1 — base plinth
  addSegment(root, [{ geo: extrudePoly([[-3.0, 0], [3.0, 0], [2.75, Y0], [-2.75, Y0]], 1.6, 0.03), mat: metalDark }], [0, -1.2, 0]);
  // 2, 3 — pillars
  addSegment(root, [{ geo: extrudePoly([outer[0], inner[0], inner[1], outer[1]], DEPTH), mat: metal }], [-1.6, 0.4, 0.6]);
  addSegment(root, [{ geo: extrudePoly([inner[5], outer[5], outer[4], inner[4]], DEPTH), mat: metal }], [1.6, 0.4, 0.6]);
  // 4, 5 — chamfers
  addSegment(root, [{ geo: extrudePoly([outer[1], inner[1], inner[2], outer[2]], DEPTH), mat: metalLight }], [-1.2, 1.4, 0.8]);
  addSegment(root, [{ geo: extrudePoly([inner[4], outer[4], outer[3], inner[3]], DEPTH), mat: metalLight }], [1.2, 1.4, 0.8]);
  // 6 — lintel
  addSegment(root, [{ geo: extrudePoly([outer[2], inner[2], inner[3], outer[3]], DEPTH), mat: metal }], [0, 1.8, 0.6]);

  // 7, 8 — leaves on hinge pivots (they swing open as the camera flies through at the end of the section)
  const m = 0.06;
  const gap = 0.035;
  const hingeL = inner[0][0] + m;
  const leafTop = inner[2][1] - m;
  const leafL: [number, number][] = [
    [0, Y0 + m],
    [-gap - hingeL, Y0 + m],
    [-gap - hingeL, leafTop],
    [inner[2][0] + m * 0.4 - hingeL, leafTop],
    [0, inner[1][1] - m * 0.4],
  ];
  const pivotL = new Group();
  pivotL.position.set(hingeL, 0, -0.05);
  const pivotR = new Group();
  pivotR.position.set(-hingeL, 0, -0.05);
  root.add(pivotL, pivotR);
  const leafGeoL = extrudePoly(leafL, 0.09, 0.015);
  const leafGeoR = extrudePoly(
    leafL.map(([x, y]) => [-x, y] as [number, number]),
    0.09,
    0.015,
  );
  const seamL = new MeshBasicMaterial({ color: TEAL.clone().multiplyScalar(0.6), toneMapped: false });
  const seamR = seamL.clone();
  const seamGeoL = new BoxGeometry(0.03, leafTop - Y0 - 2 * m, 0.1);
  seamGeoL.translate(-gap - hingeL - 0.02, (leafTop + Y0) / 2, 0);
  const seamGeoR = seamGeoL.clone();
  seamGeoR.translate(2 * (gap + hingeL + 0.02), 0, 0);
  addSegment(pivotL, [{ geo: leafGeoL, mat: metalLight }, { geo: seamGeoL, mat: seamL, glow: true }], [0, 0.2, 1.4]);
  addSegment(pivotR, [{ geo: leafGeoR, mat: metalLight }, { geo: seamGeoR, mat: seamR, glow: true }], [0, 0.2, 1.4]);

  // 9 — the S path (brand mark), split between the two leaves so it parts when the gate opens.
  const k = 0.105;
  const sx = (x: number) => (x - 32) * k;
  const sy = (y: number) => Y0 + 1.05 + (46.5 - y) * k;
  const bars: [number, number, number, number][] = [
    [41, 22.5, 24.5, 22.5],
    [24.5, 22.5, 24.5, 34.5],
    [24.5, 34.5, 39.5, 34.5],
    [39.5, 34.5, 39.5, 46.5],
    [39.5, 46.5, 23, 46.5],
  ];
  const sMatL = new MeshBasicMaterial({ color: TEAL.clone(), toneMapped: false });
  const sMatR = sMatL.clone();
  const thick = 0.13;
  const sGeosL: { geo: BufferGeometry; mat: Material; glow: boolean }[] = [];
  const sGeosR: { geo: BufferGeometry; mat: Material; glow: boolean }[] = [];
  for (const [x1, y1, x2, y2] of bars) {
    const ax = sx(x1);
    const bx = sx(x2);
    const ay = sy(y1);
    const by = sy(y2);
    const pieces: [number, number, number, number][] = [];
    if (ay === by && Math.min(ax, bx) < 0 && Math.max(ax, bx) > 0) {
      pieces.push([Math.min(ax, bx) - thick / 2, ay, -gap, ay], [gap, ay, Math.max(ax, bx) + thick / 2, ay]);
    } else if (ay === by) {
      pieces.push([Math.min(ax, bx) - thick / 2, ay, Math.max(ax, bx) + thick / 2, ay]);
    } else {
      pieces.push([ax, Math.min(ay, by) - thick / 2, bx, Math.max(ay, by) + thick / 2]);
    }
    for (const [px1, py1, px2, py2] of pieces) {
      const horizontal = py1 === py2;
      const len = horizontal ? Math.abs(px2 - px1) : Math.abs(py2 - py1);
      const geo = new BoxGeometry(horizontal ? len : thick, horizontal ? thick : len, 0.07);
      const cx = (px1 + px2) / 2;
      const left = cx < 0;
      geo.translate(cx - (left ? hingeL : -hingeL), (py1 + py2) / 2, 0.1);
      (left ? sGeosL : sGeosR).push({ geo, mat: left ? sMatL : sMatR, glow: true });
    }
  }
  // Both halves form one logical segment: build them as a pair.
  addSegment(pivotL, sGeosL, [0, 0, 1.6]);
  const sLeft = segments.pop() as Segment;
  addSegment(pivotR, sGeosR, [0, 0, 1.6]);
  const sRight = segments.pop() as Segment;
  const sPair = { left: sLeft, right: sRight, value: 0 };

  // Assembly counter ticks on the floor + a soft floor glow that grows with the count.
  const ticks: MeshBasicMaterial[] = [];
  for (let i = 0; i < BUILD_SEGMENTS; i++) {
    const a = (-0.5 + i / (BUILD_SEGMENTS - 1)) * 1.9;
    const mat = new MeshBasicMaterial({ color: TEAL.clone().multiplyScalar(0.12), toneMapped: false });
    const tick = new Mesh(new BoxGeometry(0.26, 0.02, 0.06), mat);
    tick.position.set(Math.sin(a) * 3.35, 0.015, Math.cos(a) * 3.35 - 0.2);
    tick.rotation.y = a;
    root.add(tick);
    ticks.push(mat);
  }
  const floorMat = new MeshBasicMaterial({ map: glowTexture(), color: TEAL.clone(), transparent: true, opacity: 0.1, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
  const floor = new Mesh(new CircleGeometry(4.6, 48), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.01;
  root.add(floor);

  const light = new PointLight(COLORS.tealSoft, 0, 20, 2);
  light.position.set(WORLD.build[0] + 0.8, WORLD.build[1] + 4.2, WORLD.build[2] + 4.6);
  const metals = [metal, metalLight, metalDark];

  let count = 0;
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

  function applySegment(s: Segment, v: number, time: number) {
    const e = easeOut(v);
    s.built.visible = v > 0.002;
    s.built.position.set(s.from[0] * (1 - e), s.from[1] * (1 - e), s.from[2] * (1 - e));
    s.built.scale.setScalar(0.9 + 0.1 * e);
    const arrive = Math.sin(Math.PI * Math.min(1, v));
    s.edgeMat.opacity = 0.16 + 0.75 * arrive;
    s.ghostMat.opacity = 0.04 + 0.14 * (1 - e) * (0.85 + 0.15 * Math.sin(time * 1.4));
    for (const g of s.glowMats) g.color.copy(TEAL).multiplyScalar(0.5 + 0.9 * e + 0.6 * arrive);
  }

  function update(T: number, time: number, dt: number) {
    const visible = T > VISIBLE_FROM && T < VISIBLE_TO;
    root.visible = visible;
    light.intensity = visible ? 16 + 3.2 * Math.min(count, BUILD_SEGMENTS) : 0;
    // Animate toward the basket count; chained so several new items assemble one after another.
    const rate = dt / 0.85;
    const all = [...segments, sPair];
    for (let i = 0; i < all.length; i++) {
      const s = all[i];
      const target = i < count ? 1 : 0;
      if (target > s.value) {
        const prev = i === 0 ? 1 : all[i - 1].value;
        if (prev > 0.35) s.value = Math.min(1, s.value + rate);
      } else if (target < s.value) {
        const next = i === all.length - 1 ? 0 : all[i + 1].value;
        if (next < 0.65) s.value = Math.max(0, s.value - rate * 1.4);
      }
    }
    if (!visible) return;
    for (const s of segments) applySegment(s, s.value, time);
    sPair.left.value = sPair.right.value = sPair.value;
    applySegment(sPair.left, sPair.value, time);
    applySegment(sPair.right, sPair.value, time);
    for (let i = 0; i < ticks.length; i++) {
      const v = all[i].value;
      ticks[i].color.copy(TEAL).multiplyScalar(0.1 + 1.1 * v);
    }
    const built = all.reduce((sum, s) => sum + s.value, 0) / BUILD_SEGMENTS;
    floorMat.opacity = 0.06 + 0.4 * built;
    // Built metal picks up a faint teal inner light as the structure completes ("lights up").
    for (const m of metals) m.emissive.copy(TEAL).multiplyScalar(0.012 + 0.05 * built);

    // Leaves rest slightly ajar, then swing open as the camera flies through the finished structure.
    const open = smoothstep(8.86, 9.05, T);
    const angle = 0.22 + (1.5 - 0.22) * open;
    pivotL.rotation.y = angle;
    pivotR.rotation.y = -angle;
  }

  return {
    root,
    light,
    setCount: (n: number) => {
      count = Math.max(0, Math.min(BUILD_SEGMENTS, n));
    },
    update,
    dispose: () => disposeObject(root),
  };
}
