// OWNER: world-core agent — fog, floor grid, lights, procedural environment, ground fog, dust and stars.
// Everything is procedural (no textures or HDRs are downloaded). Brightness is kept low and calm so DOM copy
// over the canvas stays readable; only the gate light and its pools reach bloom levels.
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  FogExp2,
  Group,
  PlaneGeometry,
  ShaderMaterial,
  type Texture,
} from 'three';
import { useExperience } from '../state/experience';
import { scrollState } from '../state/scroll';
import { lerp, smoothstep } from '../lib/choreo';
import { mulberry32 } from '../lib/random';
import { COLORS } from '../brand/brand';
import { fogNoiseTexture } from './core/textures';
import { gateLight } from './core/entry';

const OUTPUT = /* glsl */ `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`;

/** Fog density by T: denser at the gate (moody), a touch clearer around the globe, enough to hide far scenes. */
function fogDensityAt(T: number, entry: number): number {
  const welcome = 1 - entry;
  const base = T < 1 ? lerp(0.042, 0.036, smoothstep(0, 1, T)) : 0.036;
  return base + welcome * 0.006;
}

// ---------- Grid floor ----------
const floorVertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const floorFragment = /* glsl */ `
  uniform vec3 uBase, uLine, uTeal, uFogColor;
  uniform float uFogDensity, uLight, uTime;
  varying vec3 vWorld;
  float grid(vec2 p, float scale, float width) {
    vec2 g = p / scale;
    vec2 d = fwidth(g);
    vec2 a = abs(fract(g - 0.5) - 0.5) / max(d, vec2(1e-4));
    float l = min(a.x, a.y);
    // Fade lines out where they would alias (sub-pixel spacing).
    float alias = 1.0 - smoothstep(0.15, 0.5, max(d.x, d.y));
    return (1.0 - min(l / width, 1.0)) * alias;
  }
  void main() {
    vec2 p = vWorld.xz;
    float dist = length(cameraPosition - vWorld);
    float minor = grid(p, 1.0, 0.9);
    float major = grid(p, 5.0, 1.25);
    float near = exp(-dist * 0.075);
    float lines = (minor * 0.28 + major * 0.75) * near;
    vec3 col = uBase + uLine * lines;

    // Pool of light pouring out of the gate opening onto the floor (fans out toward the viewer).
    float zf = max(vWorld.z, 0.0);
    float halfW = 1.9 + zf * 0.4;
    float pool = smoothstep(halfW + 1.6, halfW - 0.6, abs(vWorld.x)) * smoothstep(-1.0, 0.4, vWorld.z) * exp(-zf * 0.2);
    float glowNearGate = exp(-length(vec2(vWorld.x * 0.55, vWorld.z - 0.5)) * 0.55);
    float light = uLight;
    col += uTeal * (pool * light * 0.55 + glowNearGate * 0.06 * (0.4 + light));
    col += uTeal * lines * pool * light * 2.2;

    float fd = uFogDensity * dist;
    float fog = 1.0 - exp(-fd * fd);
    col = mix(col, uFogColor, fog);
    gl_FragColor = vec4(col, 1.0);
    ${OUTPUT}
  }
`;

// ---------- Ground fog layers ----------
const fogVertex = /* glsl */ `
  varying vec3 vWorld;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const fogFragment = /* glsl */ `
  uniform sampler2D uNoise;
  uniform float uTime, uOpacity, uLight, uFogDensity, uScale;
  uniform vec2 uDrift;
  uniform vec3 uColor, uLightColor;
  varying vec3 vWorld;
  varying vec2 vUv;
  void main() {
    vec2 p = vWorld.xz * uScale;
    float n = texture2D(uNoise, p + uDrift * uTime).r;
    float n2 = texture2D(uNoise, p * 2.1 - uDrift.yx * uTime * 1.4 + 0.37).r;
    float d = smoothstep(0.32, 0.86, n * 0.68 + n2 * 0.32);
    vec2 e = abs(vUv - 0.5) * 2.0;
    float edge = (1.0 - smoothstep(0.45, 1.0, e.x)) * (1.0 - smoothstep(0.45, 1.0, e.y));
    float dist = length(cameraPosition - vWorld);
    float camFade = smoothstep(1.2, 7.0, dist);
    float fd = uFogDensity * dist;
    float fog = exp(-fd * fd);
    float g = exp(-length(vec2(vWorld.x * 0.6, vWorld.z - 0.6)) * 0.3) * uLight;
    vec3 col = uColor + uLightColor * g * 1.7;
    float a = d * edge * camFade * uOpacity * fog;
    gl_FragColor = vec4(col * a, 1.0);
    ${OUTPUT}
  }
`;

// ---------- Dust motes & stars ----------
const dustVertex = /* glsl */ `
  uniform float uTime, uScale, uFogDensity, uMaxSize;
  attribute vec3 aSeed;
  varying float vB;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.11 + aSeed.x * 40.0) * 0.6;
    p.y += sin(uTime * 0.08 + aSeed.y * 30.0) * 0.4 + mod(uTime * 0.03 * (0.4 + aSeed.z), 1.5);
    p.z += cos(uTime * 0.09 + aSeed.z * 50.0) * 0.6;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = -mv.z;
    float tw = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed.x) + aSeed.y * 20.0);
    float fd = uFogDensity * dist;
    vB = tw * exp(-fd * fd) * smoothstep(0.6, 3.0, dist) * (aSeed.z > 0.95 ? 2.2 : 0.55);
    gl_PointSize = clamp((0.03 + aSeed.y * 0.03) * uScale / max(dist, 0.1), 0.0, uMaxSize);
  }
`;
const starVertex = /* glsl */ `
  uniform float uTime, uPixel;
  attribute vec3 aSeed;
  varying float vB;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    vB = (0.12 + aSeed.x * 0.22) * (0.7 + 0.3 * sin(uTime * (0.3 + aSeed.y) + aSeed.z * 30.0));
    gl_PointSize = (1.0 + aSeed.z * 1.4) * uPixel;
  }
`;
const moteFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vB;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = 1.0 - smoothstep(0.0, 0.5, d);
    gl_FragColor = vec4(uColor * a * a * vB, 1.0);
    ${OUTPUT}
  }
`;

const DUST_COUNT = { high: 2600, medium: 1600, low: 700 } as const;

function buildDust(count: number): BufferGeometry {
  const rand = mulberry32(99);
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (rand() * 2 - 1) * (4 + rand() * 12);
    pos[i * 3 + 1] = 0.2 + Math.pow(rand(), 1.4) * 9;
    pos[i * 3 + 2] = 16 - rand() * 180;
    seed[i * 3] = rand();
    seed[i * 3 + 1] = rand();
    seed[i * 3 + 2] = rand();
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new BufferAttribute(seed, 3));
  return g;
}

function buildStars(count: number): BufferGeometry {
  const rand = mulberry32(4242);
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Upper dome, biased toward the horizon ahead (−Z).
    const u = 0.05 + Math.pow(rand(), 0.8) * 0.9;
    const th = rand() * Math.PI * 2;
    const r = 150;
    const c = Math.sqrt(1 - u * u);
    pos[i * 3] = Math.cos(th) * c * r;
    pos[i * 3 + 1] = u * r * 0.6;
    pos[i * 3 + 2] = Math.sin(th) * c * r;
    seed[i * 3] = rand();
    seed[i * 3 + 1] = rand();
    seed[i * 3 + 2] = rand();
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new BufferAttribute(seed, 3));
  return g;
}

const FOG_LAYERS = [
  { y: 0.14, opacity: 0.3, scale: 0.03, drift: [0.004, 0.0016] as [number, number] },
  { y: 0.6, opacity: 0.18, scale: 0.022, drift: [-0.003, 0.002] as [number, number] },
  { y: 1.35, opacity: 0.09, scale: 0.017, drift: [0.0022, -0.0012] as [number, number] },
];

export function Atmosphere() {
  const quality = useExperience((s) => s.quality);
  const scene = useThree((s) => s.scene);
  const fog = useMemo(() => new FogExp2(COLORS.navy, 0.04), []);
  const stars = useRef<Group>(null);

  useEffect(() => {
    scene.fog = fog;
    return () => {
      if (scene.fog === fog) scene.fog = null;
    };
  }, [scene, fog]);

  const assets = useMemo(() => {
    const noise: Texture = fogNoiseTexture();
    const floorGeo = new PlaneGeometry(170, 230);
    floorGeo.rotateX(-Math.PI / 2);
    floorGeo.translate(0, 0, -78);
    const floorMat = new ShaderMaterial({
      vertexShader: floorVertex,
      fragmentShader: floorFragment,
      uniforms: {
        uBase: { value: new Color('#090E1A') },
        uLine: { value: new Color('#1F7E73') },
        uTeal: { value: new Color(COLORS.teal) },
        uFogColor: { value: fog.color },
        uFogDensity: { value: 0.04 },
        uLight: { value: 0 },
        uTime: { value: 0 },
      },
    });
    const fogGeo = new PlaneGeometry(64, 84);
    fogGeo.rotateX(-Math.PI / 2);
    fogGeo.translate(0, 0, -18);
    const fogMats = FOG_LAYERS.map(
      (l) =>
        new ShaderMaterial({
          vertexShader: fogVertex,
          fragmentShader: fogFragment,
          uniforms: {
            uNoise: { value: noise },
            uTime: { value: 0 },
            uOpacity: { value: l.opacity },
            uLight: { value: 0 },
            uFogDensity: { value: 0.04 },
            uScale: { value: l.scale },
            uDrift: { value: l.drift },
            uColor: { value: new Color('#16304A') },
            uLightColor: { value: new Color(COLORS.teal) },
          },
          blending: AdditiveBlending,
          transparent: true,
          depthWrite: false,
        }),
    );
    const moteMat = (color: string, vertexShader: string, extra: Record<string, { value: number }>) =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader: moteFragment,
        uniforms: { uColor: { value: new Color(color) }, uTime: { value: 0 }, ...extra },
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
      });
    const dustMat = moteMat('#9FE9D8', dustVertex, { uScale: { value: 800 }, uFogDensity: { value: 0.04 }, uMaxSize: { value: 24 } });
    const starMat = moteMat('#BFD3EA', starVertex, { uPixel: { value: 1 } });
    starMat.fog = false;
    return { noise, floorGeo, floorMat, fogGeo, fogMats, dustMat, starMat, starGeo: buildStars(700) };
  }, [fog]);

  const dustGeo = useMemo(() => buildDust(DUST_COUNT[quality]), [quality]);
  useEffect(() => () => dustGeo.dispose(), [dustGeo]);
  useEffect(
    () => () => {
      assets.noise.dispose();
      assets.floorGeo.dispose();
      assets.floorMat.dispose();
      assets.fogGeo.dispose();
      assets.fogMats.forEach((m) => m.dispose());
      assets.dustMat.dispose();
      assets.starMat.dispose();
      assets.starGeo.dispose();
    },
    [assets],
  );

  useFrame((state) => {
    const T = scrollState.T;
    const e = scrollState.entry;
    const time = state.clock.elapsedTime;
    const density = fogDensityAt(T, e);
    fog.density = density;
    const light = gateLight(e) * (1 - smoothstep(0.7, 1, e)) + 0.08;
    const dpr = state.viewport.dpr;
    const cam = state.camera as { fov?: number };
    const scale = (state.size.height * dpr) / (2 * Math.tan((((cam.fov ?? 45) * Math.PI) / 180) / 2));

    const fu = assets.floorMat.uniforms;
    fu.uFogDensity.value = density;
    fu.uLight.value = light;
    fu.uTime.value = time;
    for (const m of assets.fogMats) {
      m.uniforms.uTime.value = time;
      m.uniforms.uLight.value = light;
      m.uniforms.uFogDensity.value = density;
    }
    const du = assets.dustMat.uniforms;
    du.uTime.value = time;
    du.uScale.value = scale;
    du.uFogDensity.value = density;
    du.uMaxSize.value = 20 * dpr;
    assets.starMat.uniforms.uTime.value = time;
    assets.starMat.uniforms.uPixel.value = dpr;
    // The star dome follows the camera so it always sits at infinity.
    if (stars.current) stars.current.position.copy(state.camera.position);
  });

  return (
    <>
      {/* Procedural studio environment for the metal: soft key above, teal strips at the sides, cool fill. */}
      <Environment resolution={256} frames={1} environmentIntensity={0.9}>
        <color attach="background" args={['#03050a']} />
        <Lightformer form="rect" intensity={1.8} color="#dbe7ff" position={[0, 9, 1]} rotation-x={Math.PI / 2} scale={[16, 5, 1]} />
        <Lightformer form="rect" intensity={3.4} color={COLORS.teal} position={[-10, 3, -1]} rotation-y={Math.PI / 2} scale={[1.4, 10, 1]} />
        <Lightformer form="rect" intensity={3.4} color={COLORS.teal} position={[10, 3, -1]} rotation-y={-Math.PI / 2} scale={[1.4, 10, 1]} />
        <Lightformer form="rect" intensity={0.7} color="#9db3d8" position={[0, 2.5, 12]} rotation-y={Math.PI} scale={[12, 3, 1]} />
        {/* Broad soft panel behind/above the viewer → the gradient sheen across the gate's front faces. */}
        <Lightformer form="rect" intensity={0.55} color="#b8c8e6" position={[0, 7, 13]} rotation={[0.45, Math.PI, 0]} scale={[26, 7, 1]} />
        <Lightformer form="ring" intensity={2.2} color={COLORS.tealSoft} position={[0, 3, -12]} scale={5} />
        <Lightformer form="rect" intensity={1.2} color="#35F2C4" position={[0, -3, 4]} rotation-x={-Math.PI / 2} scale={[10, 1.2, 1]} />
      </Environment>

      <ambientLight color="#3a5070" intensity={0.22} />
      <hemisphereLight color="#2a3f5f" groundColor="#020306" intensity={0.35} />
      <directionalLight color="#cfe1ff" position={[-6, 10, 9]} intensity={0.55} />

      <mesh geometry={assets.floorGeo} material={assets.floorMat} renderOrder={-1} />
      {assets.fogMats.map((m, i) => (
        <mesh key={i} geometry={assets.fogGeo} material={m} position={[0, FOG_LAYERS[i].y, 0]} renderOrder={4} />
      ))}
      <points geometry={dustGeo} material={assets.dustMat} frustumCulled={false} renderOrder={3} />
      <group ref={stars}>
        <points geometry={assets.starGeo} material={assets.starMat} frustumCulled={false} renderOrder={-2} />
      </group>
    </>
  );
}
