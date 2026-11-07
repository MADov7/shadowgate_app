// Scene C — the company network and its five protection layers. Built imperatively once; `update` is a pure
// function of the world timeline T (plus a gentle idle clock for pulses/rotation), so scrolling back reverses
// every reveal exactly. Threat packets are symbolic storytelling, not real traffic.
import {
  Color,
  CylinderGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  PointLight,
  QuadraticBezierCurve3,
  Quaternion,
  RingGeometry,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  AdditiveBlending,
  DoubleSide,
  type Camera,
  type Object3D,
  type ShaderMaterial,
  type Texture,
} from 'three';
import { COLORS } from '../../brand/brand';
import { activeLayerIndex, layerReveal, layersProgressFromT, smoothstep, LAYER_ORDER } from '../../lib/choreo';
import type { Quality } from '../../lib/capabilities';
import { WORLD } from '../worldLayout';
import { framingShift, pickFrame, type FrameTarget } from './framing';
import { circlePoints, disposeObject, goldbergWire, polygonPoints } from './geometry';
import { buildBrowser, buildCloud, buildCore, buildEnvelope, buildIdentity, buildPedestal, BOB, SPIN, type NetKit } from './networkForms';
import { buildPacketPaths, NET, networkNodePos, packetAt, type PacketState } from './networkLayout';
import { FOG_FADE, TEAL, THREAT, fresnelShellMaterial, revealWireMaterial, sceneShader } from './shaders';

const VISIBLE_FROM = 2.0;
const VISIBLE_TO = 6.1;
const FLASH_LIFE = 0.55;

/**
 * Where the network sits on screen: right of the Layers glass panel on desktop (mirrored in Arabic), centred
 * above the compact bottom panel on phones (scaled down so the ring of shells fits the narrow width).
 */
const FRAME_WIDE: FrameTarget = { x: 0.3, y: -0.04, scale: 1 };
const FRAME_MEDIUM: FrameTarget = { x: 0.2, y: 0.02, scale: 0.9 };
const FRAME_PORTRAIT: FrameTarget = { x: 0, y: 0.42, scale: 0.52 };
/** Reference T for the framing (middle of the Layers hold). */
const FRAME_REF_T = 4;
const LIGHT_OFFSET: [number, number, number] = [0, 4.2, 1.5];

const damp = (a: number, b: number, lambda: number, dt: number) => a + (b - a) * (1 - Math.exp(-lambda * dt));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

function platformMaterial(radius: number, ring: number): ShaderMaterial {
  return sceneShader({
    uniforms: {
      uColor: { value: TEAL.clone() },
      uBoot: { value: 0 },
      uTime: { value: 0 },
      uRadius: { value: radius },
      uRing: { value: ring },
      uDome: { value: 0 },
    },
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      varying vec2 vP;
      void main() {
        vP = position.xy;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform vec3 uColor;
      uniform float uBoot;
      uniform float uTime;
      uniform float uRadius;
      uniform float uRing;
      uniform float uDome;
      varying vec2 vP;
      float hexSdf(vec2 p, float R) {
        p = abs(p);
        return max(p.x * 0.8660254 + p.y * 0.5, p.y) - R * 0.8660254;
      }
      float grid(vec2 p, float spacing, float w) {
        vec2 g = abs(fract(p / spacing - 0.5) - 0.5) * spacing;
        vec2 fw = fwidth(p) * w;
        vec2 l = 1.0 - smoothstep(vec2(0.0), fw, g);
        return max(l.x, l.y);
      }
      void main() {
        float r = length(vP);
        float d = hexSdf(vP, uRadius);
        float reach = uBoot * (uRadius + 2.5);
        float boot = 1.0 - smoothstep(reach - 1.6, reach, r);
        // Gaussians use x * x (never pow(x, 2.0): pow of a negative base is NaN on D3D/ANGLE, and one NaN
        // pixel blacks out the whole frame once the bloom mip chain spreads it).
        float wd = (r - reach) / 0.4;
        float wave = exp(-wd * wd) * (1.0 - smoothstep(0.85, 1.0, uBoot));
        float fade = 1.0 - smoothstep(uRadius * 0.25, uRadius * 1.05, r) * 0.6;
        float fine = grid(vP, 0.5, 1.0) * 0.12;
        float major = grid(vP, 2.0, 1.3) * 0.24;
        float r1 = (r - uRing) / 0.035;
        float r2 = (r - 1.55) / 0.03;
        float ring = exp(-r1 * r1) * 0.5 + exp(-r2 * r2) * 0.35;
        float inner = 1.0 - smoothstep(0.0, 0.025, abs(hexSdf(vP, uRadius * 0.62)));
        float edge = exp(d / 0.22) * 0.55 + (1.0 - smoothstep(0.0, 0.035, abs(d + 0.16))) * 0.9;
        float glow = (fine + major) * fade + ring + inner * 0.22 + edge;
        glow *= 0.75 + uDome * 0.35;
        vec3 base = vec3(0.010, 0.016, 0.028) + vec3(0.0, 0.02, 0.018) * (1.0 - smoothstep(0.0, uRadius, r));
        vec3 col = base + uColor * (glow * boot + wave * 0.7);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }
    `,
  });
}

function dataLineMaterial(phase: number, dashed = false): ShaderMaterial {
  return sceneShader({
    additive: true,
    uniforms: {
      uColor: { value: TEAL.clone() },
      uTime: { value: 0 },
      uDraw: { value: 0 },
      uHl: { value: 0 },
      uPhase: { value: phase },
    },
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      varying float vU;
      void main() {
        vU = uv.x;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uDraw;
      uniform float uHl;
      uniform float uPhase;
      varying float vU;
      void main() {
        float draw = 1.0 - smoothstep(uDraw - 0.04, uDraw, vU);
        ${
          dashed
            ? `float dash = step(0.55, fract(vU * 56.0 - uTime * 0.25));
        float a = dash * (0.28 + uHl * 0.3) * draw;`
            : `float p1 = fract(vU - uTime * 0.42 + uPhase);
        float p2 = fract(vU - uTime * 0.42 + uPhase + 0.5);
        float pulse = smoothstep(0.0, 0.04, p1) * (1.0 - smoothstep(0.04, 0.2, p1))
                    + smoothstep(0.0, 0.04, p2) * (1.0 - smoothstep(0.04, 0.2, p2));
        float a = (0.2 + uHl * 0.35 + pulse * (0.85 + uHl * 0.8)) * draw;`
        }
        gl_FragColor = vec4(uColor * a, 1.0);
        ${FOG_FADE}
      }
    `,
  });
}

function beamMaterial(): ShaderMaterial {
  return sceneShader({
    additive: true,
    side: DoubleSide,
    uniforms: { uColor: { value: TEAL.clone() }, uOpacity: { value: 0 } },
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      varying float vH;
      void main() {
        vH = uv.y;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vH;
      void main() {
        float a = pow(clamp(1.0 - vH, 0.0, 1.0), 2.2) * uOpacity;
        gl_FragColor = vec4(uColor * a, 1.0);
        ${FOG_FADE}
      }
    `,
  });
}

interface NodeRig {
  bob: Object3D | undefined;
  spin: Object3D | undefined;
  glow: MeshBasicMaterial;
  glowDim: MeshBasicMaterial;
  rim: LineBasicMaterial;
  shell: Group;
  wire: ShaderMaterial;
  skin: ShaderMaterial;
  scan: LineLoop;
  scanMat: LineBasicMaterial;
  idle: LineLoop;
  idleMat: LineBasicMaterial;
  line: ShaderMaterial;
  beam: ShaderMaterial;
  hl: number;
  hit: number;
}

export interface NetworkScene {
  root: Group;
  light: PointLight;
  update: (T: number, time: number, dt: number, camera: Camera, width: number, height: number) => void;
  /** Right-to-left page (Arabic): the glass panel is on the right, so the network moves left. */
  setRtl: (rtl: boolean) => void;
  dispose: () => void;
}

export function createNetworkScene(env: Texture, quality: Quality): NetworkScene {
  const root = new Group();
  root.name = 'sg-defense-network';
  root.position.set(...WORLD.network);
  const R = NET.platformRadius;
  const top = NET.platformTop;
  const ringR = WORLD.networkRadius;

  const kit: NetKit = {
    metal: new MeshStandardMaterial({ color: '#33445f', metalness: 0.9, roughness: 0.3, envMap: env, envMapIntensity: 1.25, flatShading: true }),
    metalLight: new MeshStandardMaterial({ color: '#5a6d8c', metalness: 0.88, roughness: 0.26, envMap: env, envMapIntensity: 1.35, flatShading: true }),
    metalDark: new MeshStandardMaterial({ color: '#141d2e', metalness: 0.82, roughness: 0.42, envMap: env, envMapIntensity: 0.9, flatShading: true }),
    screen: new MeshStandardMaterial({ color: '#071019', metalness: 0.3, roughness: 0.12, envMap: env, envMapIntensity: 1.4, emissive: new Color(COLORS.teal), emissiveIntensity: 0.04 }),
  };

  // ---- Platform: hex slab + grid surface + edge light ----
  const slab = new Mesh(new CylinderGeometry(R, R + 0.3, 0.4, 6), kit.metalDark);
  slab.rotation.y = Math.PI / 6;
  root.add(slab);
  const gridMat = platformMaterial(R, ringR);
  const surface = new Mesh(new CircleGeometry(R - 0.02, 6), gridMat);
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = top + 0.003;
  root.add(surface);
  const edgeMat = new LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
  const edge = new LineLoop(polygonPoints(6, R + 0.005, top + 0.006), edgeMat);
  root.add(edge);
  const footEdge = new LineLoop(polygonPoints(6, R + 0.3, -0.2), new LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.25, blending: AdditiveBlending, depthWrite: false, toneMapped: false }));
  root.add(footEdge);

  // ---- Company core ----
  const coreGlow = new MeshBasicMaterial({ color: TEAL.clone(), toneMapped: false });
  const coreGlowDim = new MeshBasicMaterial({ color: TEAL.clone().multiplyScalar(0.4), toneMapped: false });
  const core = buildCore(kit, coreGlow, coreGlowDim);
  core.position.y = top;
  root.add(core);
  const coreSpin = core.getObjectByName(SPIN);
  const coreRing = core.getObjectByName(BOB);

  // ---- Nodes, shells, data lines ----
  const builders = [buildBrowser, buildEnvelope, buildCloud, buildIdentity];
  const viewer = new Vector3(-2.2, 8.2, 10.5); // camera at the middle of the layers hold, network-local
  const nodes: NodeRig[] = [];
  const shellWire = goldbergWire(1, NET.shellRadius);
  const shellSkin = new SphereGeometry(NET.shellRadius * 0.985, 36, 22);
  const unitCircle = circlePoints(72);
  for (let i = 0; i < 4; i++) {
    const [x, y, z] = networkNodePos(i, ringR);
    const glow = new MeshBasicMaterial({ color: TEAL.clone(), toneMapped: false });
    const glowDim = new MeshBasicMaterial({ color: TEAL.clone().multiplyScalar(0.3), toneMapped: false });
    const rim = new LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.4, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
    const pedestal = buildPedestal(kit, rim);
    pedestal.position.set(x, y, z);
    root.add(pedestal);
    const form = builders[i](kit, glow, glowDim);
    form.position.set(x, y + NET.nodeLift, z);
    form.rotation.y = Math.atan2(viewer.x - x, viewer.z - z);
    root.add(form);

    const shell = new Group();
    shell.position.set(x, y + NET.nodeLift, z);
    const wire = revealWireMaterial(-NET.shellRadius, NET.shellRadius);
    const skin = fresnelShellMaterial(-NET.shellRadius, NET.shellRadius);
    shell.add(new LineSegments(shellWire, wire));
    shell.add(new Mesh(shellSkin, skin));
    const scanMat = new LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
    const scan = new LineLoop(unitCircle, scanMat);
    shell.add(scan);
    const idleMat = scanMat.clone();
    const idle = new LineLoop(unitCircle, idleMat);
    shell.add(idle);
    root.add(shell);

    // Data line: core → node, lifted into a shallow arc.
    const dir = new Vector3(x, 0, z).normalize();
    const start = dir.clone().multiplyScalar(1.3).setY(top + 0.08);
    const end = new Vector3(x, 0, z).addScaledVector(dir, -0.86).setY(top + 0.08);
    const mid = start.clone().lerp(end, 0.5).setY(top + 0.55);
    const line = dataLineMaterial(i * 0.23);
    root.add(new Mesh(new TubeGeometry(new QuadraticBezierCurve3(start, mid, end), 48, 0.022, 5, false), line));

    // Highlight beam above the node.
    const beam = beamMaterial();
    const beamMesh = new Mesh(new CylinderGeometry(0.62, 0.86, 4.2, 6, 1, true), beam);
    beamMesh.position.set(x, y + 2.1, z);
    root.add(beamMesh);

    nodes.push({
      bob: form.getObjectByName(BOB),
      spin: form.getObjectByName(SPIN),
      glow,
      glowDim,
      rim,
      shell,
      wire,
      skin,
      scan,
      scanMat,
      idle,
      idleMat,
      line,
      beam,
      hl: 0,
      hit: 0,
    });
  }

  // Dashed ring connecting the four assets.
  const ringPts: Vector3[] = [];
  for (let k = 0; k < 64; k++) {
    const a = (k / 64) * Math.PI * 2;
    ringPts.push(new Vector3(Math.cos(a) * ringR, top + 0.05, Math.sin(a) * ringR));
  }
  const ringLine = dataLineMaterial(0, true);
  root.add(new Mesh(new TubeGeometry(new CatmullRomCurve3(ringPts, true), 192, 0.014, 4, true), ringLine));

  // ---- Layer 5: ongoing review dome ----
  const domeR = NET.domeRadius;
  const dome = new Group();
  dome.position.y = top;
  const domeWireMat = revealWireMaterial(0, domeR);
  dome.add(new LineSegments(goldbergWire(quality === 'low' ? 2 : 3, domeR, (a, b) => a.y > -0.01 && b.y > -0.01), domeWireMat));
  const domeSkin = fresnelShellMaterial(0, domeR);
  dome.add(new Mesh(new SphereGeometry(domeR * 0.99, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2), domeSkin));
  const domeScanMat = new LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
  const domeScan = new LineLoop(circlePoints(128), domeScanMat);
  dome.add(domeScan);
  root.add(dome);

  // ---- Symbolic threat packets + interception flashes ----
  const paths = buildPacketPaths(ringR, quality === 'low' ? 1 : 2);
  const packets = new InstancedMesh(
    new OctahedronGeometry(0.075, 0),
    new MeshBasicMaterial({ color: THREAT, toneMapped: false }),
    paths.length,
  );
  packets.instanceMatrix.setUsage(DynamicDrawUsage);
  packets.frustumCulled = false;
  root.add(packets);
  const flashes = new InstancedMesh(
    new RingGeometry(0.55, 0.7, 28),
    new MeshBasicMaterial({ color: '#ffffff', transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
    paths.length,
  );
  flashes.instanceMatrix.setUsage(DynamicDrawUsage);
  flashes.frustumCulled = false;
  for (let j = 0; j < paths.length; j++) flashes.setColorAt(j, new Color(0, 0, 0));
  root.add(flashes);

  const light = new PointLight(COLORS.teal, 0, 22, 2);
  light.position.set(WORLD.network[0] + LIGHT_OFFSET[0], WORLD.network[1] + LIGHT_OFFSET[1], WORLD.network[2] + LIGHT_OFFSET[2]);

  // Aspect / direction-aware framing (recomputed only when either changes).
  const shift = new Vector3();
  let frameAspect = -1;
  let rtl = false;
  let frameRtl = false;
  function applyFrame(aspect: number) {
    if (Math.abs(aspect - frameAspect) < 0.001 && rtl === frameRtl) return;
    frameAspect = aspect;
    frameRtl = rtl;
    const target = pickFrame(aspect, FRAME_WIDE, FRAME_MEDIUM, FRAME_PORTRAIT);
    framingShift(FRAME_REF_T, WORLD.network, aspect, target, rtl, shift);
    root.position.set(...WORLD.network).add(shift);
    root.scale.setScalar(target.scale);
    light.position
      .set(LIGHT_OFFSET[0], LIGHT_OFFSET[1], LIGHT_OFFSET[2])
      .multiplyScalar(target.scale)
      .add(root.position);
  }

  // Scratch objects (no per-frame allocation).
  const m4 = new Matrix4();
  const q = new Quaternion();
  const up = new Vector3(0, 1, 0);
  const pos = new Vector3();
  const scl = new Vector3();
  const dirV = new Vector3();
  const zero = new Vector3(0, 0, 0);
  const col = new Color();
  const packet: PacketState = { s: 0, flying: false, impactAge: -1 };
  const reveal = new Array<number>(LAYER_ORDER.length).fill(0);
  let domeHl = 0;
  let domeHit = 0;

  function update(T: number, time: number, dt: number, camera: Camera, width: number, height: number) {
    const visible = T > VISIBLE_FROM && T < VISIBLE_TO;
    root.visible = visible;
    light.intensity = visible ? 26 : 0;
    if (!visible) return;
    applyFrame(width / Math.max(1, height));
    const progress = layersProgressFromT(T);
    const active = T < 2.95 ? -1 : activeLayerIndex(progress);
    const boot = smoothstep(2.45, 3.05, T);
    for (let i = 0; i < reveal.length; i++) reveal[i] = layerReveal(progress, i);

    gridMat.uniforms.uBoot.value = boot;
    gridMat.uniforms.uTime.value = time;
    gridMat.uniforms.uDome.value = reveal[4];
    edgeMat.opacity = 0.25 + 0.65 * boot;
    ringLine.uniforms.uTime.value = time;
    ringLine.uniforms.uDraw.value = smoothstep(0.35, 1, boot) * 1.05;
    ringLine.uniforms.uHl.value = reveal[4];

    // Core: brighter when the ongoing-review layer is in focus.
    domeHl = damp(domeHl, active === 4 ? 1 : 0, 4, dt);
    const coreLevel = 0.7 + 0.5 * domeHl + 0.25 * reveal[4];
    coreGlow.color.copy(TEAL).multiplyScalar(coreLevel * 1.3);
    coreGlowDim.color.copy(TEAL).multiplyScalar(0.25 + 0.25 * coreLevel);
    if (coreSpin) coreSpin.rotation.y = time * 0.5;
    if (coreRing) coreRing.rotation.z = time * 0.18;

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const r = reveal[i];
      n.hl = damp(n.hl, active === i ? 1 : 0, 4.5, dt);
      n.hit = damp(n.hit, 0, 5, dt);
      if (n.bob) n.bob.position.y = Math.sin(time * 0.9 + i * 1.7) * 0.05;
      if (n.spin) n.spin.rotation.y = time * (0.45 + i * 0.05);
      const level = 0.45 + 0.35 * r + 0.9 * n.hl;
      n.glow.color.copy(TEAL).multiplyScalar(level * 1.25);
      n.glowDim.color.copy(TEAL).multiplyScalar(0.18 + 0.3 * level);
      n.rim.opacity = 0.3 + 0.35 * r + 0.6 * n.hl;
      n.line.uniforms.uTime.value = time;
      n.line.uniforms.uDraw.value = smoothstep(0.2, 0.95, boot) * 1.05;
      n.line.uniforms.uHl.value = Math.max(n.hl, r * 0.5);
      n.beam.uniforms.uOpacity.value = n.hl * 0.42;

      n.shell.visible = r > 0.001;
      const grow = 0.86 + 0.14 * easeOut(r);
      n.shell.scale.setScalar(grow);
      n.shell.rotation.y = time * 0.12 + i;
      n.wire.uniforms.uReveal.value = r;
      n.wire.uniforms.uBoost.value = n.hl * 0.55 + n.hit;
      n.skin.uniforms.uReveal.value = r;
      n.skin.uniforms.uOpacity.value = 0.55 + n.hl * 0.4 + n.hit * 0.8;
      // Reveal sweep ring (bottom → top), then a calm idle scan.
      const sr = NET.shellRadius;
      const sy = -sr + 2 * sr * r;
      const sw = Math.sqrt(Math.max(0, sr * sr - sy * sy));
      n.scan.position.y = sy;
      n.scan.scale.set(sw, 1, sw);
      n.scanMat.opacity = Math.sin(Math.PI * r) * 0.95;
      const iy = Math.sin(time * 0.7 + i * 1.3) * sr * 0.72;
      const iw = Math.sqrt(Math.max(0, sr * sr - iy * iy));
      n.idle.position.y = iy;
      n.idle.scale.set(iw, 1, iw);
      n.idleMat.opacity = Math.pow(r, 3) * (0.22 + 0.5 * n.hl);
    }

    // Dome (layer 5).
    const r5 = reveal[4];
    domeHit = damp(domeHit, 0, 5, dt);
    dome.visible = r5 > 0.001;
    domeWireMat.uniforms.uReveal.value = r5;
    domeWireMat.uniforms.uOpacity.value = 0.34;
    domeWireMat.uniforms.uBoost.value = domeHl * 0.3 + domeHit * 0.6;
    domeSkin.uniforms.uReveal.value = r5;
    domeSkin.uniforms.uOpacity.value = 0.34 + domeHl * 0.2 + domeHit * 0.5;
    const scanY = (0.5 + 0.42 * Math.sin(time * 0.32)) * domeR * 0.95;
    domeSkin.uniforms.uScan.value = scanY;
    domeSkin.uniforms.uScanAmt.value = r5;
    const scanW = Math.sqrt(Math.max(0, domeR * domeR - scanY * scanY));
    domeScan.position.y = scanY;
    domeScan.scale.set(scanW, 1, scanW);
    domeScanMat.opacity = Math.pow(r5, 2) * (0.4 + 0.3 * domeHl);

    // Packets: intercepted at a revealed shell (or the dome), otherwise they reach the node and fade.
    const packetsOn = smoothstep(2.85, 3.1, T);
    for (let j = 0; j < paths.length; j++) {
      const p = paths[j];
      const stop = r5 > 0.5 ? p.tDome : reveal[p.node] > 0.5 ? p.tShell : 1;
      packetAt(time, p.phase, stop, packet);
      pos.set(
        p.from[0] + (p.to[0] - p.from[0]) * packet.s,
        p.from[1] + (p.to[1] - p.from[1]) * packet.s,
        p.from[2] + (p.to[2] - p.from[2]) * packet.s,
      );
      if (packet.flying && packetsOn > 0.01) {
        const fadeIn = smoothstep(0, 0.12, packet.s);
        const fadeOut = stop >= 1 ? 1 - smoothstep(0.8, 0.98, packet.s) : 1;
        const k = fadeIn * fadeOut * packetsOn;
        dirV.set(p.to[0] - p.from[0], p.to[1] - p.from[1], p.to[2] - p.from[2]).normalize();
        q.setFromUnitVectors(up, dirV);
        scl.set(k, k * 3.2, k);
        m4.compose(pos, q, scl);
      } else {
        m4.compose(zero, q.identity(), scl.set(0, 0, 0));
      }
      packets.setMatrixAt(j, m4);

      if (packet.impactAge >= 0 && packet.impactAge < FLASH_LIFE && packetsOn > 0.01) {
        const a = packet.impactAge / FLASH_LIFE;
        const s = 0.22 + a * 0.9;
        m4.compose(pos, camera.quaternion, scl.set(s, s, s));
        col.copy(TEAL).multiplyScalar((1 - a) * (1 - a) * 1.6 * packetsOn);
        if (stop === p.tDome) domeHit = Math.max(domeHit, (1 - a) * 0.5);
        else nodes[p.node].hit = Math.max(nodes[p.node].hit, (1 - a) * 0.6);
      } else {
        m4.compose(zero, q.identity(), scl.set(0, 0, 0));
        col.setRGB(0, 0, 0);
      }
      flashes.setMatrixAt(j, m4);
      flashes.setColorAt(j, col);
    }
    packets.instanceMatrix.needsUpdate = true;
    flashes.instanceMatrix.needsUpdate = true;
    if (flashes.instanceColor) flashes.instanceColor.needsUpdate = true;
  }

  return {
    root,
    light,
    update,
    setRtl: (value: boolean) => {
      rtl = value;
    },
    dispose: () => {
      disposeObject(root);
      unitCircle.dispose();
    },
  };
}
