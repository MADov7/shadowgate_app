// OWNER: world-core agent — procedural metallic gateway, edge light trace, opening leaves.
// The frame is the brand mark's chamfered gateway at monument scale: a beveled pillar-and-lintel band, a proud
// casing and border, recessed grooves carrying the light trace, a larger dark back frame for a stepped silhouette,
// and two heavy leaves hinged on the back face so they swing away from the viewer. Everything is driven by
// scrollState.entry (pure function → scrubbable with ?entry=…).
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  Color,
  ExtrudeGeometry,
  Group,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  Shape,
  ShaderMaterial,
  Vector2,
  type Material,
  type Texture,
} from 'three';
import { scrollState } from '../state/scroll';
import { smoothstep } from '../lib/choreo';
import { COLORS } from '../brand/brand';
import { WORLD } from './worldLayout';
import {
  GATE,
  frameBand,
  leafOutline,
  mirrorX,
  openingHalfPath,
  type P2,
  type UShape,
} from './core/gateShapes';
import { buildStrips, type StripPath } from './core/strips';
import { brushedMetalTexture } from './core/textures';
import {
  createGateGlowMaterial,
  createHaloMaterial,
  createScreenFlashMaterial,
  createTraceMaterial,
} from './core/materials';
import { doorOpen, flyProgress, gateLight, traceStages } from './core/entry';

const OPEN: UShape = { w: GATE.openW, h: GATE.openH, c: GATE.openChamfer };
const Z_FRONT = GATE.depth / 2 + GATE.bevel;
const HINGE_X = OPEN.w / 2 + GATE.leafOverlap;
const HINGE_Z = -Z_FRONT;
const LEAF_FRONT = -0.01;

function extrudeBand(pts: P2[], depth: number, bevel: number): ExtrudeGeometry {
  const shape = new Shape(pts.map(([x, y]) => new Vector2(x, y)));
  const g = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 2,
    curveSegments: 1,
    steps: 1,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

function both(path: P2[]): StripPath[] {
  return [{ points: path }, { points: mirrorX(path) }];
}

interface GateAssets {
  geoms: BufferGeometry[];
  mats: Material[];
  tex: Texture[];
  frame: { geo: BufferGeometry; mat: Material; z: number }[];
  pillarJoints: BufferGeometry;
  grooves: BufferGeometry;
  traceFrame: BufferGeometry;
  traceBaseA: BufferGeometry;
  traceBaseB: BufferGeometry;
  plinthA: BufferGeometry;
  plinthB: BufferGeometry;
  leaf: {
    body: BufferGeometry;
    rails: BufferGeometry[];
    groove: [BufferGeometry, BufferGeometry];
    trace: [BufferGeometry, BufferGeometry];
    seam: [BufferGeometry, BufferGeometry];
  };
  mat: {
    metal: MeshStandardMaterial;
    trim: MeshStandardMaterial;
    dark: MeshStandardMaterial;
    leaf: MeshStandardMaterial;
    back: MeshStandardMaterial;
    plinth: MeshStandardMaterial;
    traceFrame: ShaderMaterial;
    traceBase: ShaderMaterial;
    traceDoors: ShaderMaterial;
    glow: ShaderMaterial;
    halo: ShaderMaterial;
    spill: ShaderMaterial;
    flash: ShaderMaterial;
  };
  glowPlane: PlaneGeometry;
  haloPlane: PlaneGeometry;
  spillPlane: PlaneGeometry;
  flashPlane: PlaneGeometry;
}

function createSpillMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { uLight: { value: 0 }, uColor: { value: new Color(COLORS.teal) } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uLight; uniform vec3 uColor; varying vec2 vUv;
      void main() {
        float x = abs(vUv.x - 0.5) * 2.0;
        float spread = mix(0.06, 1.0, uLight);
        float across = exp(-x * x / (spread * spread * 0.35));
        float along = pow(clamp(vUv.y, 0.0, 1.0), 2.2);
        gl_FragColor = vec4(uColor * across * along * (0.6 + 2.6 * uLight), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
}

function buildGateAssets(): GateAssets {
  const geoms: BufferGeometry[] = [];
  const mats: Material[] = [];
  const tex: Texture[] = [];
  const keep = <G extends BufferGeometry>(g: G) => (geoms.push(g), g);
  const keepM = <M extends Material>(m: M) => (mats.push(m), m);

  const brushed = brushedMetalTexture();
  brushed.repeat.set(0.32, 0.32);
  tex.push(brushed);

  const metal = keepM(
    new MeshStandardMaterial({
      color: '#6b7588',
      metalness: 0.94,
      roughness: 0.74,
      roughnessMap: brushed,
      bumpMap: brushed,
      bumpScale: 0.35,
      envMapIntensity: 1.25,
    }),
  );
  const trim = keepM(
    new MeshStandardMaterial({ color: '#97a3b8', metalness: 0.96, roughness: 0.5, roughnessMap: brushed, envMapIntensity: 1.4 }),
  );
  const dark = keepM(new MeshStandardMaterial({ color: '#04060b', metalness: 0.5, roughness: 0.8 }));
  const leaf = keepM(
    new MeshStandardMaterial({
      color: '#545e72',
      metalness: 0.92,
      roughness: 0.8,
      roughnessMap: brushed,
      bumpMap: brushed,
      bumpScale: 0.25,
      envMapIntensity: 1.1,
    }),
  );
  const back = keepM(new MeshStandardMaterial({ color: '#2e3646', metalness: 0.9, roughness: 0.42, envMapIntensity: 0.9 }));
  const plinth = keepM(
    new MeshStandardMaterial({ color: '#3a4354', metalness: 0.88, roughness: 0.86, roughnessMap: brushed, envMapIntensity: 0.9 }),
  );

  // Frame layers.
  const frame = [
    // Main pillar-and-lintel band.
    { geo: keep(extrudeBand(frameBand(OPEN, 0, GATE.frame), GATE.depth, GATE.bevel)), mat: metal, z: 0 },
    // Proud casing hugging the opening.
    { geo: keep(extrudeBand(frameBand(OPEN, 0, 0.17), 0.08, 0.022)), mat: trim, z: Z_FRONT + 0.04 },
    // Raised outer border.
    { geo: keep(extrudeBand(frameBand(OPEN, GATE.frame - 0.15, GATE.frame), 0.06, 0.018)), mat: trim, z: Z_FRONT + 0.03 },
    // Larger dark back frame → stepped, monumental silhouette.
    { geo: keep(extrudeBand(frameBand(OPEN, 0.42, 1.6), 1.0, 0.04)), mat: back, z: -Z_FRONT - 0.55 },
  ];

  // Recessed grooves (dark) that carry the light lines, plus horizontal segment joints on the pillars.
  const tracePathsFrame = [...both(openingHalfPath(OPEN, 0.31)), ...both(openingHalfPath(OPEN, 0.6))];
  const grooves = keep(buildStrips(tracePathsFrame, 0.075, Z_FRONT + 0.002));
  const joints: StripPath[] = [];
  for (const y of [0.85, 1.85, 2.85]) {
    const x0 = OPEN.w / 2 + 0.17;
    const x1 = OPEN.w / 2 + GATE.frame - 0.15;
    joints.push({ points: [[x0, y], [x1, y]] }, { points: [[-x0, y], [-x1, y]] });
  }
  const pillarJoints = keep(buildStrips(joints, 0.035, Z_FRONT + 0.0015));
  const traceFrame = keep(buildStrips(tracePathsFrame, 0.026, Z_FRONT + 0.006));

  // Plinth: two broad steps; light lines run outward from the centre along their front edges.
  const plinthA = keep(new BoxGeometry(9.4, 0.18, 5.2));
  plinthA.translate(0, 0.09, 1.0);
  const plinthB = keep(new BoxGeometry(7.6, 0.16, 3.7));
  plinthB.translate(0, 0.18 + 0.08, 0.55);
  const traceBaseA = keep(buildStrips(both([[0, 0.145], [4.7, 0.145]]), 0.02, 1.0 + 2.6 + 0.004));
  const traceBaseB = keep(buildStrips(both([[0, 0.305], [3.8, 0.305]]), 0.024, 0.55 + 1.85 + 0.004));

  // Leaves (left-leaf coordinates: hinge at x = 0, extends to +x; the right leaf is mirrored).
  const outline = leafOutline(OPEN, GATE.leafOverlap, GATE.seamGap);
  const body = keep(extrudeBand(outline, GATE.leafThickness, 0.02));
  body.translate(0, 0, -(GATE.leafThickness / 2 + 0.02) + LEAF_FRONT);
  const rails: BufferGeometry[] = [];
  // Hinge stile (mostly hidden behind the frame overlap) gives the leaf edge some mass when it swings.
  const stile = keep(new BoxGeometry(0.16, OPEN.h - 0.2, 0.035));
  stile.translate(0.17, OPEN.h / 2, LEAF_FRONT + 0.0135);
  rails.push(stile);

  // Doors carry a nested echo of the chamfered opening (a gate within the gate) plus the seam edge line.
  // Paths are in pivot-local coordinates; they climb from the floor and meet at the seam at the top.
  const edge = GATE.seamGap / 2 + 0.035;
  const leafPaths = (side: 1 | -1): { lines: StripPath[]; seam: StripPath[] } => {
    const hingeX = side * HINGE_X;
    const local = (path: P2[]) =>
      path.map(([x, y], i) => {
        const yy = i === 0 ? 0.24 : y;
        const xx = Math.abs(x) < edge ? side * edge : x;
        return [xx - hingeX, yy] as P2;
      });
    const lines = [-0.3, -0.58].map((d) => {
      const half = openingHalfPath(OPEN, d);
      return { points: local(side > 0 ? half : mirrorX(half)) };
    });
    const seamX = side * (edge + 0.006) - hingeX;
    return { lines, seam: [{ points: [[seamX, 0.04], [seamX, OPEN.h + 0.04]] }] };
  };
  const left = leafPaths(-1);
  const right = leafPaths(1);
  const groove: [BufferGeometry, BufferGeometry] = [
    keep(buildStrips(left.lines, 0.08, LEAF_FRONT + 0.002)),
    keep(buildStrips(right.lines, 0.08, LEAF_FRONT + 0.002)),
  ];
  const trace: [BufferGeometry, BufferGeometry] = [
    keep(buildStrips(left.lines, 0.03, LEAF_FRONT + 0.006)),
    keep(buildStrips(right.lines, 0.03, LEAF_FRONT + 0.006)),
  ];
  const seam: [BufferGeometry, BufferGeometry] = [
    keep(buildStrips(left.seam, 0.02, LEAF_FRONT + 0.006)),
    keep(buildStrips(right.seam, 0.02, LEAF_FRONT + 0.006)),
  ];

  const glowPlane = keep(new PlaneGeometry(OPEN.w + 0.7, OPEN.h + 0.5));
  const haloPlane = keep(new PlaneGeometry(19, 12));
  const spillPlane = keep(new PlaneGeometry(OPEN.w, 2.95));
  const flashPlane = keep(new PlaneGeometry(2, 2));

  const traceFrameM = keepM(createTraceMaterial(COLORS.teal, { steady: 1.5, base: 0.035 }));
  const traceBaseM = keepM(createTraceMaterial(COLORS.teal, { steady: 1.2, base: 0.02 }));
  const traceDoorsM = keepM(createTraceMaterial(COLORS.tealSoft, { steady: 2.0, base: 0.16, head: 8 }));

  return {
    geoms,
    mats,
    tex,
    frame,
    pillarJoints,
    grooves,
    traceFrame,
    traceBaseA,
    traceBaseB,
    plinthA,
    plinthB,
    leaf: { body, rails, groove, trace, seam },
    mat: {
      metal,
      trim,
      dark,
      leaf,
      back,
      plinth,
      traceFrame: traceFrameM,
      traceBase: traceBaseM,
      traceDoors: traceDoorsM,
      glow: keepM(createGateGlowMaterial()),
      halo: keepM(createHaloMaterial(COLORS.teal, 0.4)),
      spill: keepM(createSpillMaterial()),
      flash: keepM(createScreenFlashMaterial('#CFFFF1')),
    },
    glowPlane,
    haloPlane,
    spillPlane,
    flashPlane,
  };
}

export function Gate() {
  const a = useMemo(buildGateAssets, []);
  const group = useRef<Group>(null);
  const leftPivot = useRef<Group>(null);
  const rightPivot = useRef<Group>(null);
  const innerLight = useRef<PointLight>(null);
  const spillLight = useRef<PointLight>(null);

  useEffect(
    () => () => {
      a.geoms.forEach((g) => g.dispose());
      a.mats.forEach((m) => m.dispose());
      a.tex.forEach((t) => t.dispose());
    },
    [a],
  );

  useFrame((state) => {
    const e = scrollState.entry;
    const T = scrollState.T;
    const time = state.clock.elapsedTime;
    const camZ = state.camera.position.z;

    const stages = traceStages(e);
    a.mat.traceBase.uniforms.uProgress.value = stages.base;
    a.mat.traceFrame.uniforms.uProgress.value = stages.frame;
    a.mat.traceDoors.uniforms.uProgress.value = stages.doors;
    a.mat.traceBase.uniforms.uTime.value = time;
    a.mat.traceFrame.uniforms.uTime.value = time;
    a.mat.traceDoors.uniforms.uTime.value = time;

    const open = doorOpen(e);
    if (leftPivot.current) leftPivot.current.rotation.y = open * GATE.maxSwing;
    if (rightPivot.current) rightPivot.current.rotation.y = -open * GATE.maxSwing;

    const light = gateLight(e);
    const fly = flyProgress(e);
    const glowU = a.mat.glow.uniforms;
    glowU.uLight.value = light;
    glowU.uTime.value = time;
    // Fade the light card as the camera reaches it (the threshold flash covers the crossing).
    glowU.uFade.value = smoothstep(0.4, 4.5, camZ + 1.25);
    a.mat.halo.uniforms.uIntensity.value = (0.1 + 0.75 * light) * (1 - smoothstep(0.45, 0.8, fly));
    a.mat.spill.uniforms.uLight.value = light * (1 - smoothstep(0.85, 1, fly));

    // Soft teal-white wash exactly as the camera crosses the gate plane.
    const crossing = Math.exp(-((camZ + 0.4) * (camZ + 0.4)) / 1.4);
    a.mat.flash.uniforms.uIntensity.value = e > 0.02 && e < 0.999 ? crossing * 0.32 : 0;

    if (innerLight.current) innerLight.current.intensity = (3 + 70 * open) * (1 - smoothstep(0.9, 1, fly));
    if (spillLight.current) spillLight.current.intensity = 26 * open * (1 - smoothstep(0.9, 1, fly));

    // Nothing of the gate is in view once we are through it and scrolling the story.
    if (group.current) group.current.visible = !(e >= 0.999 && T > 0.4);
  });

  const leaf = (side: -1 | 1) => (
    <group ref={side < 0 ? leftPivot : rightPivot} position={[side * HINGE_X, 0, HINGE_Z]}>
      <group scale={[-side, 1, 1]}>
        <mesh geometry={a.leaf.body} material={a.mat.leaf} />
        {a.leaf.rails.map((g, i) => (
          <mesh key={i} geometry={g} material={a.mat.trim} />
        ))}
      </group>
      <mesh geometry={a.leaf.groove[side < 0 ? 0 : 1]} material={a.mat.dark} />
      <mesh geometry={a.leaf.trace[side < 0 ? 0 : 1]} material={a.mat.traceDoors} renderOrder={2} />
      <mesh geometry={a.leaf.seam[side < 0 ? 0 : 1]} material={a.mat.traceDoors} renderOrder={2} />
    </group>
  );

  return (
    <>
      {/* Lights stay mounted (intensity → 0) so toggling the gate never changes the light count / recompiles. */}
      <pointLight ref={innerLight} position={[0, GATE.plinth + 2.3, -2.1]} color="#c8fff0" distance={15} decay={2} />
      <pointLight ref={spillLight} position={[0, GATE.plinth + 1.1, 1.8]} color={COLORS.teal} distance={9} decay={2} />
      <pointLight position={[-4.1, 5.4, -2.8]} color={COLORS.teal} intensity={34} distance={12} decay={2} />
      <pointLight position={[4.1, 5.4, -2.8]} color={COLORS.teal} intensity={34} distance={12} decay={2} />

      <group ref={group} position={WORLD.gate}>
        <mesh geometry={a.plinthA} material={a.mat.plinth} />
        <mesh geometry={a.plinthB} material={a.mat.plinth} />
        <mesh geometry={a.traceBaseA} material={a.mat.traceBase} renderOrder={2} />
        <mesh geometry={a.traceBaseB} material={a.mat.traceBase} renderOrder={2} />

        <group position={[0, GATE.plinth, 0]}>
          {a.frame.map((f, i) => (
            <mesh key={i} geometry={f.geo} material={f.mat} position={[0, 0, f.z]} />
          ))}
          <mesh geometry={a.grooves} material={a.mat.dark} />
          <mesh geometry={a.pillarJoints} material={a.mat.dark} />
          <mesh geometry={a.traceFrame} material={a.mat.traceFrame} renderOrder={2} />
          {leaf(-1)}
          {leaf(1)}
          {/* Light behind the leaves: visible through the seam, flooding out as they swing. */}
          <mesh
            geometry={a.glowPlane}
            material={a.mat.glow}
            position={[0, (OPEN.h + 0.5) / 2 - 0.04, -Z_FRONT - 0.66]}
            renderOrder={1}
          />
          {/* Spill of light across the plinth in front of the opening. */}
          <mesh
            geometry={a.spillPlane}
            material={a.mat.spill}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.004, 0.875]}
            renderOrder={1}
          />
        </group>
        {/* Backlight haze: silhouettes the frame against a soft teal glow. */}
        <mesh geometry={a.haloPlane} material={a.mat.halo} position={[0, 3.6, -8.5]} renderOrder={0} />
      </group>
      <mesh geometry={a.flashPlane} material={a.mat.flash} frustumCulled={false} renderOrder={1000} />
    </>
  );
}
