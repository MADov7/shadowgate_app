// Scene D — the service constellation: eight faceted metallic shells on a vertical orbit line. Focus follows the
// world timeline (constellationFocusFloat), a bounded drag yaw comes from src/state/constellation.ts, and each
// object's screen position is published to src/state/projection.ts for the accessible DOM hotspots.
import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Sprite,
  SpriteMaterial,
  Vector3,
  type Camera,
  type ShaderMaterial,
  type Texture,
} from 'three';
import { BUSINESS_SERVICE_IDS } from '../../data/services';
import { CONSTELLATION_COUNT, constellationFocusFloat, constellationProgressFromT, smoothstep } from '../../lib/choreo';
import type { Quality } from '../../lib/capabilities';
import { constellationState, focusEmphasis, stepYaw } from '../../state/constellation';
import { hotspots } from '../../state/projection';
import { mulberry32 } from '../../lib/random';
import { WORLD, constellationItemPos, sampleCamera, type Vec3 } from '../worldLayout';
import { shellGeometry } from './constellationForms';
import { framingShift, pickFrame, type FrameTarget } from './framing';
import { circlePoints, disposeObject } from './geometry';
import { FOG_FADE, TEAL, dotTexture, glowTexture, sceneShader } from './shaders';

const VISIBLE_FROM = 4.75;
const VISIBLE_TO = 8.7;
const HOTSPOT_FROM = 5.42;
const HOTSPOT_TO = 7.6;
const OBJECT_RADIUS = 0.92;

function spineMaterial(): ShaderMaterial {
  return sceneShader({
    additive: true,
    uniforms: {
      uColor: { value: TEAL.clone() },
      uFocusY: { value: 0 },
      uMinY: { value: -20 },
      uMaxY: { value: 8 },
      uLevel: { value: 1 },
    },
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      varying float vY;
      void main() {
        vY = position.y;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform vec3 uColor;
      uniform float uFocusY;
      uniform float uMinY;
      uniform float uMaxY;
      uniform float uLevel;
      varying float vY;
      void main() {
        float ends = smoothstep(uMinY, uMinY + 2.0, vY) * (1.0 - smoothstep(uMaxY - 2.0, uMaxY, vY));
        float nd = (vY - uFocusY) / 1.9;
        float near = exp(-nd * nd);
        float a = (0.14 + 0.7 * near) * ends * uLevel;
        gl_FragColor = vec4(uColor * a, 1.0);
        ${FOG_FADE}
      }
    `,
  });
}

interface Item {
  anchor: Group;
  body: Group;
  metal: MeshStandardMaterial;
  inner: MeshBasicMaterial;
  coreMat: MeshBasicMaterial;
  glow: Sprite;
  glowMat: SpriteMaterial;
  orbit: Group;
  orbitMat: LineBasicMaterial;
  sats: Group;
  dust: Points;
  dustMat: PointsMaterial;
  hair: ShaderMaterial;
  spin: number;
  e: number;
}

export interface ConstellationScene {
  root: Group;
  update: (T: number, time: number, dt: number, camera: Camera, width: number, height: number) => void;
  /** Right-to-left page (Arabic): the panel is on the right, so the spine moves left. */
  setRtl: (rtl: boolean) => void;
  dispose: () => void;
}

/**
 * Spine placement: right of centre on wide screens (the contextual panel sits on the start side — mirrored in
 * Arabic), centred and raised on portrait phones (the compact panel sits at the bottom). Only the horizontal /
 * vertical placement of the spine is shifted; the per-object camera settle points stay as keyed.
 */
const FRAME_WIDE: FrameTarget = { x: 0.22, y: 0.02, scale: 1 };
const FRAME_MEDIUM: FrameTarget = { x: 0.14, y: 0.02, scale: 1 };
const FRAME_PORTRAIT: FrameTarget = { x: 0, y: 0.3, scale: 1 };
const FRAME_REF_T = 6.5;

export function createConstellationScene(env: Texture, quality: Quality): ConstellationScene {
  const root = new Group();
  root.name = 'sg-constellation';
  const pivot = new Group(); // yaw pivots around the vertical spine
  pivot.position.set(WORLD.constellation[0], 0, WORLD.constellation[2]);
  root.add(pivot);

  const first = constellationItemPos(0);
  const last = constellationItemPos(CONSTELLATION_COUNT - 1);
  const topY = first[1] + 2.4;
  const bottomY = last[1] - 2.4;

  // Spine with node ticks and connectors.
  const spineMat = spineMaterial();
  spineMat.uniforms.uMinY.value = bottomY;
  spineMat.uniforms.uMaxY.value = topY;
  const spineGeo = new BufferGeometry();
  const spinePts: number[] = [0, bottomY, 0, 0, topY, 0];
  for (let i = 0; i < CONSTELLATION_COUNT; i++) {
    const [x, y, z] = constellationItemPos(i);
    const lz = z - WORLD.constellation[2];
    // connector from the spine to the object (stops short of the shell)
    const len = Math.hypot(x, lz);
    const k = Math.max(0, (len - 1.15) / len);
    spinePts.push(0, y, 0, x * k, y, lz * k);
    // small tick across the spine
    spinePts.push(-0.12, y, 0, 0.12, y, 0);
  }
  spineGeo.setAttribute('position', new Float32BufferAttribute(spinePts, 3));
  pivot.add(new LineSegments(spineGeo, spineMat));

  const unitCircle = circlePoints(80);
  const glowMap = glowTexture();
  const dotMap = dotTexture();
  const rand = mulberry32(7);
  const items: Item[] = [];
  const dustCount = quality === 'low' ? 10 : 22;

  for (let i = 0; i < CONSTELLATION_COUNT; i++) {
    const [x, y, z] = constellationItemPos(i);
    const anchor = new Group();
    anchor.position.set(x, y, z - WORLD.constellation[2]);
    pivot.add(anchor);

    // Per-object vertical guide line.
    const hairGeo = new BufferGeometry();
    hairGeo.setAttribute('position', new Float32BufferAttribute([0, -1.75, 0, 0, 1.75, 0], 3));
    const hair = spineMaterial();
    hair.uniforms.uMinY.value = -1.9;
    hair.uniforms.uMaxY.value = 1.9;
    hair.uniforms.uFocusY.value = 0;
    anchor.add(new LineSegments(hairGeo, hair));

    const body = new Group();
    anchor.add(body);
    const geo = shellGeometry(i);
    const metal = new MeshStandardMaterial({
      color: '#3b4c68',
      metalness: 0.94,
      roughness: 0.22,
      envMap: env,
      envMapIntensity: 1.3,
      flatShading: true,
    });
    const inner = new MeshBasicMaterial({ color: TEAL.clone().multiplyScalar(0.3), side: BackSide, toneMapped: false });
    body.add(new Mesh(geo, metal));
    body.add(new Mesh(geo, inner));
    const coreMat = new MeshBasicMaterial({ color: TEAL.clone(), toneMapped: false });
    body.add(new Mesh(new IcosahedronGeometry(0.26, 1), coreMat));

    const glowMat = new SpriteMaterial({
      map: glowMap,
      color: TEAL.clone(),
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const glow = new Sprite(glowMat);
    anchor.add(glow);

    // Tilted orbit ring with two satellites.
    const orbit = new Group();
    orbit.rotation.set(1.15 + (i % 3) * 0.12, 0, (i % 2 ? -1 : 1) * 0.35);
    const orbitMat = new LineBasicMaterial({
      color: TEAL,
      transparent: true,
      opacity: 0.2,
      blending: AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const ring = new LineLoop(unitCircle, orbitMat);
    ring.scale.setScalar(1.32);
    orbit.add(ring);
    const sats = new Group();
    const satMat = new MeshBasicMaterial({ color: new Color('#cfe9ff'), toneMapped: false });
    for (let s = 0; s < 2; s++) {
      const sat = new Mesh(new OctahedronGeometry(s === 0 ? 0.045 : 0.03, 0), s === 0 ? satMat : coreMat);
      const a = s * Math.PI * 0.85;
      sat.position.set(Math.cos(a) * 1.32, 0, Math.sin(a) * 1.32);
      sats.add(sat);
    }
    orbit.add(sats);
    anchor.add(orbit);

    // Dust: a loose halo of tiny particles.
    const dustPts: number[] = [];
    for (let d = 0; d < dustCount; d++) {
      const a = rand() * Math.PI * 2;
      const r = 1.25 + rand() * 0.6;
      dustPts.push(Math.cos(a) * r, (rand() - 0.5) * 1.1, Math.sin(a) * r);
    }
    const dustGeo = new BufferGeometry();
    dustGeo.setAttribute('position', new Float32BufferAttribute(dustPts, 3));
    const dustMat = new PointsMaterial({
      color: TEAL,
      size: 0.05,
      map: dotMap,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      toneMapped: false,
    });
    const dust = new Points(dustGeo, dustMat);
    anchor.add(dust);

    items.push({ anchor, body, metal, inner, coreMat, glow, glowMat, orbit, orbitMat, sats, dust, dustMat, hair, spin: i * 0.7, e: 0 });
  }

  const shift = new Vector3();
  const spineAnchor: Vec3 = [WORLD.constellation[0], sampleCamera(FRAME_REF_T).look[1], WORLD.constellation[2]];
  let lastAspect = -1;
  let rtl = false;
  let lastRtl = false;
  const world = new Vector3();
  const ndc = new Vector3();

  function update(T: number, time: number, dt: number, camera: Camera, width: number, height: number) {
    const visible = T > VISIBLE_FROM && T < VISIBLE_TO;
    root.visible = visible;
    if (!visible) {
      for (const id of BUSINESS_SERVICE_IDS) {
        const h = hotspots.get(`svc-${id}`);
        if (h) h.visible = false;
      }
      return;
    }
    const aspect = width / Math.max(1, height);
    if (Math.abs(aspect - lastAspect) > 0.001 || rtl !== lastRtl) {
      framingShift(FRAME_REF_T, spineAnchor, aspect, pickFrame(aspect, FRAME_WIDE, FRAME_MEDIUM, FRAME_PORTRAIT), rtl, shift);
      root.position.copy(shift);
      lastAspect = aspect;
      lastRtl = rtl;
    }
    const narrow = aspect < 0.85;
    const focus = constellationFocusFloat(constellationProgressFromT(T));
    const arrive = smoothstep(4.85, 5.5, T);
    const yaw = stepYaw(dt);
    pivot.rotation.y = yaw;
    spineMat.uniforms.uFocusY.value = constellationItemPos(0)[1] - focus * WORLD.constellationSpacing;
    spineMat.uniforms.uLevel.value = arrive;

    const cam = camera as PerspectiveCamera;
    const tanHalf = Math.tan(((cam.fov ?? 45) * Math.PI) / 360);
    const showHotspots = T > HOTSPOT_FROM && T < HOTSPOT_TO;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const e = focusEmphasis(focus, i);
      it.e = e;
      // Narrow screens pull the zig-zag toward the spine so objects stay on screen.
      const [x] = constellationItemPos(i);
      it.anchor.position.x = narrow ? x * 0.5 : x;
      const stagger = smoothstep(0, 1, arrive * 1.6 - Math.abs(i - focus) * 0.12);
      const scale = (0.74 + 0.52 * e) * stagger;
      it.body.scale.setScalar(Math.max(0.0001, scale));
      it.spin += dt * (0.08 + 0.32 * e);
      it.body.rotation.set((focus - i) * 0.45, it.spin + yaw * 1.3, (focus - i) * 0.12);
      it.body.position.set(0.25 * e, 0, 0.45 * e);
      it.metal.envMapIntensity = 0.5 + 1.05 * e;
      it.metal.color.setRGB(0.16 + 0.09 * e, 0.21 + 0.1 * e, 0.3 + 0.12 * e);
      it.inner.color.copy(TEAL).multiplyScalar(0.06 + 0.5 * e);
      it.coreMat.color.copy(TEAL).multiplyScalar(0.35 + 1.25 * e);
      it.glowMat.opacity = (0.12 + 0.55 * e) * stagger;
      it.glow.scale.setScalar(1.4 + 2.6 * e);
      it.glow.position.copy(it.body.position);
      it.orbitMat.opacity = (0.08 + 0.32 * e) * stagger;
      it.orbit.scale.setScalar(0.85 + 0.25 * e);
      it.sats.rotation.y = time * (0.35 + 0.6 * e) + i;
      it.dust.rotation.y = -time * 0.06 + i;
      it.dustMat.opacity = (0.15 + 0.6 * e) * stagger;
      it.hair.uniforms.uLevel.value = (0.35 + 0.9 * e) * stagger;

      // Publish screen position for the DOM hotspot.
      const key = `svc-${BUSINESS_SERVICE_IDS[i]}`;
      let h = hotspots.get(key);
      if (!h) {
        h = { x: 0, y: 0, visible: false, emphasis: 0 };
        hotspots.set(key, h);
      }
      it.body.getWorldPosition(world);
      ndc.copy(world).project(camera);
      const inFront = ndc.z > -1 && ndc.z < 1;
      h.x = (ndc.x * 0.5 + 0.5) * width;
      h.y = (-ndc.y * 0.5 + 0.5) * height;
      h.emphasis = e;
      h.visible = showHotspots && inFront && stagger > 0.6 && Math.abs(ndc.x) < 0.98 && Math.abs(ndc.y) < 0.92;
      const dist = world.distanceTo(camera.position);
      constellationState.radiusPx[i] = ((OBJECT_RADIUS * scale) / (dist * tanHalf)) * (height / 2);
    }
  }

  return {
    root,
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
