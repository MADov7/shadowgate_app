// OWNER: world-core agent — SIMULATED threat arcs on the globe, synchronized with useRadar.
// Locally generated demo data only (see src/state/radar.ts) — illustrative regions, never attribution.
//  - subscribes with useRadar.subscribe (no React re-render per event); a fixed pool of arc meshes is reused
//  - the most recent ~20 visible (filtered) events: lifted great-circle arcs, animated head + fading tail,
//    a faint persistent trace afterwards; impact pulse rings at the demo network (teal home marker)
//  - the selected event's arc is highlighted and the globe turns it toward the camera (via globeState.focus)
//  - filters hide arcs immediately; everything lives in the globe's rotating group; visible T ≈ 0.9–2.8
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  RingGeometry,
  ShaderMaterial,
  Vector3,
} from 'three';
import { THREAT_CATEGORIES, useRadar, type ThreatCategory, type ThreatEvent } from '../state/radar';
import { scrollState } from '../state/scroll';
import { smoothstep } from '../lib/choreo';
import { HOME_REGION, REGIONS, latLonToVec3, regionById } from '../lib/geo';
import { mulberry32, pick } from '../lib/random';
import { COLORS } from '../brand/brand';
import { WORLD } from './worldLayout';
import { writeArc } from './core/arcMath';
import { globeState } from './core/globeState';
import { QA_RADAR_DEMO } from './core/qa';

const MAX_ARCS = 20;
const POOL = MAX_ARCS + 2;
const SEG = 72;
const RAD = 6;
const FLIGHT = 1.7;
const TAIL = 0.3;
const MAX_FRESH = 6;
const PULSES = 8;
const R = WORLD.globeRadius;

const CATEGORY_HEX: Record<ThreatCategory, string> = {
  phishing: COLORS.phishing,
  login: COLORS.login,
  scanning: COLORS.scanning,
  traffic: COLORS.traffic,
};

const arcVertex = /* glsl */ `
  uniform float uWidth;
  attribute vec3 aOffset;
  attribute float aU;
  varying float vU;
  varying float vFog;
  uniform float uFogDensity;
  void main() {
    vU = aU;
    float taper = 0.45 + 0.55 * sin(3.14159265 * aU);
    vec4 mv = modelViewMatrix * vec4(position + aOffset * uWidth * taper, 1.0);
    float fd = uFogDensity * mv.z;
    vFog = exp(-fd * fd);
    gl_Position = projectionMatrix * mv;
  }
`;
const arcFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uHead, uResidual, uOpacity, uSelected, uTime;
  varying float vU;
  varying float vFog;
  void main() {
    float behind = uHead - vU;
    float drawn = step(0.0, behind);
    float tail = exp(-max(behind, 0.0) / ${TAIL.toFixed(2)});
    float head = exp(-behind * behind / 0.0008) * step(-0.012, behind) * step(uHead, 1.04);
    float i = drawn * max(tail * 1.5, uResidual) + head * 4.0;
    // Selected: data pulses keep travelling along the arc.
    float ph = fract(vU - uTime * 0.42);
    i += uSelected * drawn * (exp(-((ph - 0.5) / 0.035) * ((ph - 0.5) / 0.035)) * 2.4);
    float ends = smoothstep(0.0, 0.02, vU) * smoothstep(1.0, 0.985, vU);
    gl_FragColor = vec4(uColor * i * ends * uOpacity * vFog, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

interface Slot {
  mesh: Mesh;
  mat: ShaderMaterial;
  geo: BufferGeometry;
  eventId: string | null;
  category: ThreatCategory;
  from: string;
  start: number;
  appear: number;
  animate: boolean;
  launched: boolean;
  impacted: boolean;
  rank: number;
  selected: boolean;
  mid: Vector3;
}

interface Pulse {
  mesh: Mesh;
  mat: MeshBasicMaterial;
  start: number;
}

interface SourceMarker {
  mesh: Mesh;
  mat: MeshBasicMaterial;
  flash: number;
  color: Color;
}

const Z = new Vector3(0, 0, 1);
const TEAL = new Color(COLORS.teal);
const MARKER = new Color('#9FB6D6');

function orientToSurface(mesh: Mesh, lat: number, lon: number, lift: number) {
  const [x, y, z] = latLonToVec3(lat, lon, 1);
  const n = new Vector3(x, y, z);
  mesh.position.copy(n).multiplyScalar(R * lift);
  mesh.quaternion.copy(new Quaternion().setFromUnitVectors(Z, n));
}

function buildArcGeometry(): BufferGeometry {
  const verts = (SEG + 1) * RAD;
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(verts * 3), 3));
  g.setAttribute('aOffset', new BufferAttribute(new Float32Array(verts * 3), 3));
  const u = new Float32Array(verts);
  for (let i = 0; i <= SEG; i++) for (let k = 0; k < RAD; k++) u[i * RAD + k] = i / SEG;
  g.setAttribute('aU', new BufferAttribute(u, 1));
  const idx = new Uint16Array(SEG * RAD * 6);
  let n = 0;
  for (let i = 0; i < SEG; i++) {
    for (let k = 0; k < RAD; k++) {
      const a = i * RAD + k;
      const b = i * RAD + ((k + 1) % RAD);
      const c = a + RAD;
      const d = b + RAD;
      idx[n++] = a;
      idx[n++] = c;
      idx[n++] = b;
      idx[n++] = b;
      idx[n++] = c;
      idx[n++] = d;
    }
  }
  g.setIndex(new BufferAttribute(idx, 1));
  return g;
}

// Scratch buffers for arc construction (reused; no per-event allocation beyond geo.ts helpers).
const centers = new Float32Array((SEG + 1) * 3);
const radial = new Float32Array((SEG + 1) * 3);

function fillArc(slot: Slot, e: ThreatEvent): boolean {
  const from = regionById(e.from);
  const to = regionById(e.to) ?? HOME_REGION;
  if (!from || from.id === to.id) return false;
  const mid = writeArc(from, to, R, SEG, centers, radial);
  slot.mid.set(mid[0], mid[1], mid[2]);
  const pos = slot.geo.getAttribute('position') as BufferAttribute;
  const off = slot.geo.getAttribute('aOffset') as BufferAttribute;
  const P = pos.array as Float32Array;
  const O = off.array as Float32Array;
  for (let i = 0; i <= SEG; i++) {
    const i0 = Math.max(0, i - 1);
    const i1 = Math.min(SEG, i + 1);
    let tx = centers[i1 * 3] - centers[i0 * 3];
    let ty = centers[i1 * 3 + 1] - centers[i0 * 3 + 1];
    let tz = centers[i1 * 3 + 2] - centers[i0 * 3 + 2];
    const tl = Math.hypot(tx, ty, tz) || 1;
    tx /= tl;
    ty /= tl;
    tz /= tl;
    // Normal = radial made orthogonal to the tangent; binormal = tangent × normal.
    let nx = radial[i * 3];
    let ny = radial[i * 3 + 1];
    let nz = radial[i * 3 + 2];
    const dp = nx * tx + ny * ty + nz * tz;
    nx -= tx * dp;
    ny -= ty * dp;
    nz -= tz * dp;
    const nl = Math.hypot(nx, ny, nz) || 1;
    nx /= nl;
    ny /= nl;
    nz /= nl;
    const bx = ty * nz - tz * ny;
    const by = tz * nx - tx * nz;
    const bz = tx * ny - ty * nx;
    for (let k = 0; k < RAD; k++) {
      const a = (k / RAD) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const v = (i * RAD + k) * 3;
      P[v] = centers[i * 3];
      P[v + 1] = centers[i * 3 + 1];
      P[v + 2] = centers[i * 3 + 2];
      O[v] = nx * ca + bx * sa;
      O[v + 1] = ny * ca + by * sa;
      O[v + 2] = nz * ca + bz * sa;
    }
  }
  pos.needsUpdate = true;
  off.needsUpdate = true;
  slot.geo.computeBoundingSphere();
  slot.mat.uniforms.uColor.value.set(CATEGORY_HEX[e.category]);
  slot.category = e.category;
  slot.from = e.from;
  return true;
}

// ---------- Dev-only QA demo (?radarDemo=1): local sample events when the store is empty ----------
function createDemo() {
  const rand = mulberry32(2026);
  const origins = REGIONS.filter((r) => r.id !== 'gulf');
  let seq = 1_000_000;
  const make = (): ThreatEvent => {
    const category = pick(rand, THREAT_CATEGORIES);
    seq += 1;
    return {
      id: `qa-${seq}`,
      seq,
      t: Date.now(),
      category,
      severity: 'medium',
      from: pick(rand, origins).id,
      to: HOME_REGION.id,
      outcome: 'blocked',
      variant: 0,
    };
  };
  const events: ThreatEvent[] = [];
  for (let i = 0; i < 14; i++) events.unshift(make());
  return { events, selectedId: events[3].id as string | null, make };
}

export function ThreatArcs() {
  const group = useRef<Group>(null);

  const assets = useMemo(() => {
    const slots: Slot[] = [];
    for (let i = 0; i < POOL; i++) {
      const geo = buildArcGeometry();
      const mat = new ShaderMaterial({
        vertexShader: arcVertex,
        fragmentShader: arcFragment,
        uniforms: {
          uColor: { value: new Color(COLORS.teal) },
          uHead: { value: 0 },
          uResidual: { value: 0.2 },
          uOpacity: { value: 0 },
          uSelected: { value: 0 },
          uTime: { value: 0 },
          uWidth: { value: 0.012 },
          uFogDensity: { value: 0.03 },
        },
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });
      const mesh = new Mesh(geo, mat);
      mesh.visible = false;
      mesh.frustumCulled = false;
      mesh.renderOrder = 5;
      slots.push({
        mesh,
        mat,
        geo,
        eventId: null,
        category: 'scanning',
        from: '',
        start: 0,
        appear: 0,
        animate: false,
        launched: false,
        impacted: false,
        rank: 0,
        selected: false,
        mid: new Vector3(),
      });
    }

    const basic = (color: string, opacity = 1) =>
      new MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });

    const ringGeo = new RingGeometry(0.92, 1, 64);
    const pulses: Pulse[] = [];
    for (let i = 0; i < PULSES; i++) {
      const mat = basic(COLORS.teal, 0);
      const mesh = new Mesh(ringGeo, mat);
      mesh.visible = false;
      mesh.renderOrder = 6;
      orientToSurface(mesh, HOME_REGION.lat, HOME_REGION.lon, 1.004);
      pulses.push({ mesh, mat, start: -10 });
    }

    // Home marker: the illustrative demo network (teal = protected).
    const homeRingGeo = new RingGeometry(0.1, 0.13, 48);
    const homeDotGeo = new CircleGeometry(0.045, 24);
    const homeHaloGeo = new RingGeometry(0.17, 0.26, 48);
    const homeRingMat = basic(COLORS.teal);
    homeRingMat.color.multiplyScalar(2.2);
    const homeDotMat = basic(COLORS.tealSoft);
    homeDotMat.color.multiplyScalar(2.6);
    const homeHaloMat = basic(COLORS.teal, 0.35);
    const homeRing = new Mesh(homeRingGeo, homeRingMat);
    const homeDot = new Mesh(homeDotGeo, homeDotMat);
    const homeHalo = new Mesh(homeHaloGeo, homeHaloMat);
    for (const m of [homeRing, homeDot, homeHalo]) {
      orientToSurface(m, HOME_REGION.lat, HOME_REGION.lon, 1.005);
      m.renderOrder = 6;
    }

    // Illustrative region markers (faint), flashing in the category colour when an arc launches.
    const srcGeo = new CircleGeometry(0.032, 16);
    const sources = new Map<string, SourceMarker>();
    for (const r of REGIONS) {
      const mat = basic('#9FB6D6', 0.5);
      const mesh = new Mesh(srcGeo, mat);
      orientToSurface(mesh, r.lat, r.lon, 1.004);
      mesh.renderOrder = 6;
      sources.set(r.id, { mesh, mat, flash: -10, color: new Color('#9FB6D6') });
    }

    return {
      slots,
      pulses,
      ringGeo,
      home: { homeRing, homeDot, homeHalo, geos: [homeRingGeo, homeDotGeo, homeHaloGeo], mats: [homeRingMat, homeDotMat, homeHaloMat] },
      srcGeo,
      sources,
    };
  }, []);

  const sync = useRef<() => void>(() => {});
  const lastSeq = useRef(-1);
  const pulseCursor = useRef(0);

  useEffect(() => {
    const { slots } = assets;
    const demo = QA_RADAR_DEMO && useRadar.getState().events.length === 0 ? createDemo() : null;

    const read = () => {
      const s = useRadar.getState();
      if (demo && s.events.length === 0) return { events: demo.events, filters: s.filters, selectedId: demo.selectedId };
      return { events: s.events, filters: s.filters, selectedId: s.selectedId };
    };

    const run = () => {
      const src = read();
      const now = performance.now() / 1000;
      const visible = src.events.filter((e) => src.filters[e.category]);
      const list = visible.slice(0, MAX_ARCS);
      if (src.selectedId && !list.some((e) => e.id === src.selectedId)) {
        const sel = visible.find((e) => e.id === src.selectedId);
        if (sel) list.push(sel);
      }
      const wanted = new Set(list.map((e) => e.id));
      for (const slot of slots) {
        if (slot.eventId && !wanted.has(slot.eventId)) {
          slot.eventId = null;
          slot.mesh.visible = false;
        }
      }
      // Fresh events (never seen before) animate in chronological order. On the very first sync (pre-seeded
      // history) only the newest few launch; the rest appear as faint traces.
      const firstSync = lastSeq.current < 0;
      const fresh = list
        .filter((e) => e.seq > lastSeq.current)
        .slice(0, firstSync ? 3 : MAX_FRESH)
        .reverse();
      const freshIndex = new Map(fresh.map((e, i) => [e.id, i]));
      list.forEach((e, rank) => {
        let slot = slots.find((s) => s.eventId === e.id);
        if (!slot) {
          slot = slots.find((s) => s.eventId === null);
          if (!slot || !fillArc(slot, e)) return;
          slot.eventId = e.id;
          const fi = freshIndex.get(e.id);
          slot.animate = fi !== undefined;
          slot.start = now + (fi ?? 0) * 0.24;
          slot.appear = now;
          slot.launched = !slot.animate;
          slot.impacted = !slot.animate;
          slot.mesh.visible = true;
        }
        slot.rank = rank;
        slot.selected = e.id === src.selectedId;
      });
      for (const e of src.events) if (e.seq > lastSeq.current) lastSeq.current = e.seq;
      const sel = slots.find((s) => s.selected && s.eventId);
      globeState.focus = sel ? sel.mid : null;
    };
    sync.current = run;
    run();

    const unsub = useRadar.subscribe((state, prev) => {
      if (state.events !== prev.events || state.filters !== prev.filters || state.selectedId !== prev.selectedId) run();
    });
    let timer = 0;
    if (demo) {
      timer = window.setInterval(() => {
        if (useRadar.getState().events.length > 0) return;
        demo.events.unshift(demo.make());
        demo.events.length = Math.min(demo.events.length, 160);
        run();
      }, 1100);
    }
    return () => {
      unsub();
      window.clearInterval(timer);
      globeState.focus = null;
    };
  }, [assets]);

  useEffect(
    () => () => {
      for (const s of assets.slots) {
        s.geo.dispose();
        s.mat.dispose();
      }
      assets.pulses.forEach((p) => p.mat.dispose());
      assets.ringGeo.dispose();
      assets.home.geos.forEach((g) => g.dispose());
      assets.home.mats.forEach((m) => m.dispose());
      assets.srcGeo.dispose();
      assets.sources.forEach((s) => s.mat.dispose());
    },
    [assets],
  );

  useFrame((state) => {
    const T = scrollState.T;
    const fade = smoothstep(0.85, 1.12, T) * (1 - smoothstep(2.5, 2.82, T));
    const g = group.current;
    if (!g) return;
    g.visible = fade > 0.001;
    if (!g.visible) return;
    g.rotation.set(globeState.tilt, globeState.rotY, 0, 'XYZ');

    const now = performance.now() / 1000;
    const time = state.clock.elapsedTime;
    const fogDensity = (state.scene.fog as { density?: number } | null)?.density ?? 0.03;

    for (const s of assets.slots) {
      if (!s.eventId) continue;
      const u = s.mat.uniforms;
      let head = 99;
      if (s.animate) {
        head = Math.max(0, (now - s.start) / FLIGHT) * (1 + TAIL * 3);
        if (!s.launched && now >= s.start) {
          s.launched = true;
          const src = assets.sources.get(s.from);
          if (src) {
            src.flash = now;
            src.color.set(CATEGORY_HEX[s.category]);
          }
        }
        if (!s.impacted && head >= 1) {
          s.impacted = true;
          const p = assets.pulses[pulseCursor.current++ % PULSES];
          p.start = now;
          p.mat.color.set(CATEGORY_HEX[s.category]).lerp(TEAL, 0.35);
        }
      }
      const recency = 1 - s.rank / MAX_ARCS;
      u.uHead.value = head;
      u.uResidual.value = s.selected ? 1.25 : 0.05 + 0.2 * recency * recency;
      u.uSelected.value = s.selected ? 1 : 0;
      u.uWidth.value = s.selected ? 0.026 : 0.011;
      u.uTime.value = time;
      u.uFogDensity.value = fogDensity;
      u.uOpacity.value = fade * Math.min(1, (now - s.appear) / 0.35);
    }

    for (const p of assets.pulses) {
      const age = now - p.start;
      const on = age >= 0 && age < 1.3;
      p.mesh.visible = on;
      if (!on) continue;
      const k = age / 1.3;
      p.mesh.scale.setScalar(0.08 + 0.5 * k);
      p.mat.opacity = Math.pow(1 - k, 1.6) * 1.6 * fade;
    }

    const breathe = 0.75 + 0.25 * Math.sin(time * 2.2);
    assets.home.mats[0].opacity = fade;
    assets.home.mats[1].opacity = fade;
    assets.home.mats[2].opacity = fade * 0.35 * breathe;
    assets.home.homeHalo.scale.setScalar(0.9 + 0.15 * breathe);
    assets.sources.forEach((src) => {
      const a = Math.max(0, 1 - (now - src.flash) / 0.9);
      src.mat.color.copy(MARKER).lerp(src.color, a).multiplyScalar(1 + a * 1.6);
      src.mat.opacity = fade * (0.4 + 0.6 * a);
      src.mesh.scale.setScalar(1 + a * 0.9);
    });
  });

  return (
    <group ref={group} position={WORLD.core} visible={false}>
      {assets.slots.map((s, i) => (
        <primitive key={`arc-${i}`} object={s.mesh} />
      ))}
      {assets.pulses.map((p, i) => (
        <primitive key={`pulse-${i}`} object={p.mesh} />
      ))}
      <primitive object={assets.home.homeHalo} />
      <primitive object={assets.home.homeRing} />
      <primitive object={assets.home.homeDot} />
      {[...assets.sources.values()].map((s, i) => (
        <primitive key={`src-${i}`} object={s.mesh} />
      ))}
    </group>
  );
}
