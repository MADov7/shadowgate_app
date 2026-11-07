// Abstract low-poly metallic forms for the company network (Scene C): the company core and four assets —
// website (browser frame), email (envelope prism), cloud (cluster) and accounts (identity capsule with keyhole).
// Built imperatively once; the scene component animates a few named children.
import {
  BoxGeometry,
  CapsuleGeometry,
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  LineLoop,
  type LineBasicMaterial,
  type Material,
  Mesh,
  OctahedronGeometry,
  PlaneGeometry,
  Shape,
  TorusGeometry,
} from 'three';
import { barBetween, polygonPoints, polygonShape, roundedRect } from './geometry';

export interface NetKit {
  metal: Material;
  metalLight: Material;
  metalDark: Material;
  screen: Material;
}

/** Children the scene animates by name. */
export const SPIN = 'spin';
export const BOB = 'bob';

function extrude(shape: Shape, depth: number, bevel = 0.02) {
  const g = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
    curveSegments: 3,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** Hex pedestal with a glowing rim line (rim uses the node's own line material so it can be highlighted). */
export function buildPedestal(kit: NetKit, rim: LineBasicMaterial, radius = 0.78): Group {
  const g = new Group();
  const base = new Mesh(new CylinderGeometry(radius, radius + 0.08, 0.14, 6), kit.metalDark);
  base.position.y = 0.07;
  g.add(base);
  const cap = new Mesh(new CylinderGeometry(radius * 0.86, radius * 0.86, 0.03, 6), kit.metal);
  cap.position.y = 0.155;
  g.add(cap);
  const line = new LineLoop(polygonPoints(6, radius + 0.02, 0.145, 0), rim);
  g.add(line);
  return g;
}

/** Website — a floating browser frame with lit content blocks. */
export function buildBrowser(kit: NetKit, glow: Material, glowDim: Material): Group {
  const root = new Group();
  const bob = new Group();
  bob.name = BOB;
  root.add(bob);
  const w = 1.56;
  const h = 1.08;
  const outer = roundedRect(w, h, 0.07);
  // The window opening sits low so a top bar remains.
  outer.holes.push(roundedRect(w - 0.14, h - 0.27, 0.03, 0, -0.065));
  const frame = new Mesh(extrude(outer, 0.1, 0.022), kit.metal);
  bob.add(frame);
  const screen = new Mesh(new PlaneGeometry(w - 0.14, h - 0.27), kit.screen);
  screen.position.set(0, -0.065, -0.02);
  bob.add(screen);
  // Three window dots in the top bar.
  for (let i = 0; i < 3; i++) {
    const dot = new Mesh(new CylinderGeometry(0.026, 0.026, 0.02, 10), i === 0 ? glow : glowDim);
    dot.rotation.x = Math.PI / 2;
    dot.position.set(-w / 2 + 0.13 + i * 0.085, h / 2 - 0.098, 0.065);
    bob.add(dot);
  }
  const addressBar = new Mesh(new BoxGeometry(0.62, 0.05, 0.02), glowDim);
  addressBar.position.set(0.18, h / 2 - 0.098, 0.062);
  bob.add(addressBar);
  // Page content blocks.
  const blocks: [number, number, number, number, Material][] = [
    [-0.36, 0.2, 0.52, 0.07, glow],
    [-0.36, 0.06, 0.52, 0.035, glowDim],
    [-0.42, -0.03, 0.4, 0.035, glowDim],
    [-0.39, -0.12, 0.46, 0.035, glowDim],
    [0.36, 0.02, 0.42, 0.34, glowDim],
    [-0.36, -0.27, 0.32, 0.07, glow],
  ];
  for (const [x, y, bw, bh, m] of blocks) {
    const b = new Mesh(new BoxGeometry(bw, bh, 0.012), m);
    b.position.set(x, y - 0.06, -0.008);
    bob.add(b);
  }
  bob.rotation.x = -0.1;
  const neck = new Mesh(new BoxGeometry(0.08, 0.34, 0.06), kit.metalDark);
  neck.position.set(0, -h / 2 - 0.12, -0.02);
  bob.add(neck);
  return root;
}

/** Email — a thick envelope prism with a raised flap and glowing seams. */
export function buildEnvelope(kit: NetKit, glow: Material, glowDim: Material): Group {
  const root = new Group();
  const bob = new Group();
  bob.name = BOB;
  root.add(bob);
  const w = 1.34;
  const h = 0.88;
  const body = new Mesh(extrude(roundedRect(w, h, 0.05), 0.3, 0.03), kit.metal);
  bob.add(body);
  const flapShape = polygonShape([
    [-w / 2 + 0.04, h / 2 - 0.04],
    [w / 2 - 0.04, h / 2 - 0.04],
    [0, -0.08],
  ]);
  const flap = new Mesh(extrude(flapShape, 0.05, 0.015), kit.metalLight);
  flap.position.z = 0.19;
  bob.add(flap);
  const z = 0.235;
  bob.add(barBetween(-w / 2 + 0.06, h / 2 - 0.06, 0, -0.06, 0.022, 0.012, glow, z));
  bob.add(barBetween(w / 2 - 0.06, h / 2 - 0.06, 0, -0.06, 0.022, 0.012, glow, z));
  bob.add(barBetween(-w / 2 + 0.07, -h / 2 + 0.07, -0.16, 0.06, 0.016, 0.01, glowDim, 0.185));
  bob.add(barBetween(w / 2 - 0.07, -h / 2 + 0.07, 0.16, 0.06, 0.016, 0.01, glowDim, 0.185));
  const seal = new Mesh(new CylinderGeometry(0.09, 0.09, 0.03, 6), glow);
  seal.rotation.x = Math.PI / 2;
  seal.position.set(0, -0.06, 0.245);
  bob.add(seal);
  bob.rotation.set(-0.14, 0, 0.06);
  return root;
}

/** Cloud — a cluster of faceted spheres with sync lines down to the pedestal and orbiting data cubes. */
export function buildCloud(kit: NetKit, glow: Material, glowDim: Material): Group {
  const root = new Group();
  const bob = new Group();
  bob.name = BOB;
  root.add(bob);
  const blobs: [number, number, number, number, Material][] = [
    [0, 0.06, 0, 0.44, kit.metal],
    [-0.46, -0.1, 0.04, 0.32, kit.metalLight],
    [0.46, -0.08, -0.03, 0.35, kit.metal],
    [-0.2, 0.26, -0.14, 0.3, kit.metalLight],
    [0.24, 0.24, 0.12, 0.27, kit.metal],
    [0.02, -0.15, 0.28, 0.3, kit.metalLight],
  ];
  for (const [x, y, z, r, m] of blobs) {
    const blob = new Mesh(new IcosahedronGeometry(r, 1), m);
    blob.position.set(x, y, z);
    blob.scale.y = 0.9;
    bob.add(blob);
  }
  // Glowing underside seam.
  const seam = new Mesh(new CylinderGeometry(0.62, 0.62, 0.02, 6), glow);
  seam.position.y = -0.3;
  bob.add(seam);
  for (const x of [-0.3, 0, 0.3]) {
    const line = new Mesh(new BoxGeometry(0.014, 0.42, 0.014), glowDim);
    line.position.set(x, -0.55, 0);
    bob.add(line);
  }
  const orbit = new Group();
  orbit.name = SPIN;
  for (let i = 0; i < 3; i++) {
    const cube = new Mesh(new BoxGeometry(0.07, 0.07, 0.07), glow);
    const a = (i / 3) * Math.PI * 2;
    cube.position.set(Math.cos(a) * 0.86, 0.05 + i * 0.05, Math.sin(a) * 0.86);
    cube.rotation.set(0.6, 0.6, 0);
    orbit.add(cube);
  }
  bob.add(orbit);
  return root;
}

/** Accounts — a faceted identity capsule with a glowing keyhole and a hex identity ring. */
export function buildIdentity(kit: NetKit, glow: Material, glowDim: Material): Group {
  const root = new Group();
  const bob = new Group();
  bob.name = BOB;
  root.add(bob);
  const capsule = new Mesh(new CapsuleGeometry(0.32, 0.6, 2, 6), kit.metal);
  capsule.rotation.y = Math.PI / 6; // a flat facet faces the viewer
  bob.add(capsule);
  const face = 0.32 * Math.cos(Math.PI / 6) + 0.006;
  const holeTop = new Mesh(new CircleGeometry(0.075, 18), glow);
  holeTop.position.set(0, 0.1, face);
  bob.add(holeTop);
  const slot = new Mesh(
    new ExtrudeGeometry(
      polygonShape([
        [-0.03, 0.06],
        [0.03, 0.06],
        [0.055, -0.16],
        [-0.055, -0.16],
      ]),
      { depth: 0.004, bevelEnabled: false },
    ),
    glow,
  );
  slot.position.set(0, 0.04, face - 0.002);
  bob.add(slot);
  const band = new Mesh(new CylinderGeometry(0.335, 0.335, 0.035, 6), glowDim);
  band.rotation.y = Math.PI / 6;
  band.position.y = -0.36;
  bob.add(band);
  const ring = new Mesh(new TorusGeometry(0.62, 0.014, 3, 6), glow);
  ring.name = SPIN;
  ring.rotation.x = Math.PI / 2 - 0.35;
  bob.add(ring);
  return root;
}

/** The company core — stacked hex server slabs with light seams and a floating crown. */
export function buildCore(kit: NetKit, glow: Material, glowDim: Material): Group {
  const root = new Group();
  const plinth = new Mesh(new CylinderGeometry(1.18, 1.3, 0.22, 6), kit.metalDark);
  plinth.position.y = 0.11;
  root.add(plinth);
  for (let i = 0; i < 3; i++) {
    const slab = new Mesh(new CylinderGeometry(0.74, 0.74, 0.32, 6), i === 1 ? kit.metalLight : kit.metal);
    slab.position.y = 0.42 + i * 0.4;
    root.add(slab);
    const seam = new Mesh(new CylinderGeometry(0.7, 0.7, 0.06, 6), i === 2 ? glow : glowDim);
    seam.position.y = 0.42 + i * 0.4 + 0.2;
    root.add(seam);
  }
  const crown = new Mesh(new OctahedronGeometry(0.36, 0), kit.metalLight);
  crown.name = SPIN;
  crown.position.y = 2.05;
  root.add(crown);
  const crownCore = new Mesh(new OctahedronGeometry(0.16, 0), glow);
  crownCore.position.y = 2.05;
  root.add(crownCore);
  const ring = new Mesh(new TorusGeometry(1.02, 0.012, 3, 6), glowDim);
  ring.name = BOB;
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.95;
  root.add(ring);
  return root;
}
