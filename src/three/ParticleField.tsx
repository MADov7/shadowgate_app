// OWNER: world-core agent — data particles: gate stream → data core → globe morph.
// One GPU point cloud (custom ShaderMaterial, additive, size attenuation, soft round points). Every particle carries
// three morph targets; the vertex shader blends them as a pure function of (entry, T), so scrolling back reverses
// the reorganisation exactly. No per-frame CPU work besides a handful of uniforms.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  FogExp2,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three';
import { useExperience } from '../state/experience';
import { scrollState } from '../state/scroll';
import { range } from '../lib/choreo';
import { COLORS } from '../brand/brand';
import { WORLD } from './worldLayout';
import { PARTICLE_COUNTS, buildParticleTargets } from './core/particleTargets';
import { flyPhase } from './core/entry';
import { globeState } from './core/globeState';

const vertexShader = /* glsl */ `
  uniform float uTime, uFly, uMorph, uDisperse, uScale, uFogDensity, uMaxSize, uStreamFrac;
  uniform vec3 uCore;
  uniform mat3 uGlobeMat;
  uniform vec3 uTeal, uSoft, uWhite, uDeep;
  attribute vec3 aStream;
  attribute vec3 aCoreP;
  attribute vec4 aRand;
  attribute vec2 aBright;
  varying vec3 vColor;
  varying float vSharp;

  const float PI = 3.14159265;
  mat2 rot2(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

  void main() {
    float seed = aRand.z;
    float kind = aRand.w;

    // (a) data stream: lanes drifting toward −Z, funnelling through the opening around z = 0.
    float life = fract(aStream.z + uTime * (0.010 + seed * 0.014));
    float z = mix(10.5, -15.0, life);
    float funnel = exp(-z * z / 12.0);
    vec2 xy = aStream.xy;
    xy.x *= mix(1.0, 0.34, funnel);
    xy.y = mix(xy.y, 2.6 + (xy.y - 2.6) * 0.42, funnel);
    xy += vec2(sin(uTime * 0.27 + seed * 23.0), cos(uTime * 0.21 + seed * 17.0)) * 0.24;
    vec3 pStream = vec3(xy, z);
    float streamA = smoothstep(0.0, 0.12, life) * (1.0 - smoothstep(0.8, 1.0, life)) * step(seed, uStreamFrac);

    // (b) data core: differential rotation + breathing.
    vec3 c = aCoreP;
    c.xz = rot2(uTime * (0.06 + 0.05 * sin(c.y * 1.1 + seed))) * c.xz;
    c *= 1.0 + 0.02 * sin(uTime * 0.8 + seed * 6.2831);
    vec3 pCore = uCore + c;

    // (c) globe (local → rotated world).
    vec3 g = uGlobeMat * position;
    vec3 pGlobe = uCore + g;

    // Entrance: stream → core, staggered, swirling in like a vortex.
    float kE = clamp((uFly - aRand.x * 0.42) / 0.58, 0.0, 1.0);
    kE = kE * kE * (3.0 - 2.0 * kE);
    vec3 p = mix(pStream, pCore, kE);
    vec3 rel = p - uCore;
    rel.xz = rot2(sin(PI * kE) * (1.4 + seed * 1.6)) * rel.xz;
    p = uCore + rel;

    // Core → globe: staggered north → south, lifted and sheared mid-flight so it reads as reorganising.
    float kG = clamp((uMorph - aRand.x * 0.45) / 0.55, 0.0, 1.0);
    kG = kG * kG * (3.0 - 2.0 * kG);
    vec3 q = mix(p, pGlobe, kG);
    vec3 nrm = normalize(q - uCore + vec3(1e-4));
    float mid = sin(PI * kG);
    q += nrm * mid * (0.25 + aRand.y * 0.75);
    q += normalize(cross(nrm, vec3(0.0, 1.0, 0.0)) + vec3(1e-4)) * mid * (seed - 0.5) * 1.1;

    // Disperse toward the network travel.
    float kD = clamp((uDisperse - aRand.x * 0.35) / 0.65, 0.0, 1.0);
    q += nrm * kD * kD * (3.0 + aRand.y * 8.0) + vec3(0.0, kD * 1.4, -kD * 2.0);

    vec4 mv = modelViewMatrix * vec4(q, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = -mv.z;

    // Brightness — selective: most particles are quiet, a few sparkle (bloom).
    float bStream = 0.42 * streamA * (seed > 0.965 ? 2.4 : 1.0);
    float b = mix(mix(bStream, aBright.y, kE), aBright.x, kG);
    vec3 toCam = normalize(cameraPosition - uCore);
    float face = mix(dot(normalize(c), toCam), dot(normalize(g), toCam), kG);
    b *= mix(1.0, mix(0.2, 1.0, smoothstep(-0.3, 0.5, face)), kE);
    b *= 1.0 + mid * 0.7;
    b *= 1.0 - smoothstep(0.2, 1.0, kD);
    float fd = uFogDensity * dist;
    b *= exp(-fd * fd);
    b *= smoothstep(0.5, 2.6, dist) * mix(smoothstep(2.0, 6.5, dist), 1.0, kE);

    vec3 colStream = mix(uDeep, uTeal, 0.35 + seed * 0.65);
    vec3 colCore = mix(uTeal, uSoft, clamp(aRand.y - 0.6, 0.0, 1.0));
    vec3 colGlobe = kind < 0.5 ? mix(uTeal, uSoft, seed * 0.55) : (kind < 1.5 ? mix(uDeep, uTeal, 0.4) : uTeal);
    vec3 col = mix(mix(colStream, colCore, kE), colGlobe, kG);
    col = mix(col, uWhite, smoothstep(1.4, 2.4, b) * 0.6);
    vColor = col * b;

    float sStream = 0.04 * aRand.y * (seed > 0.93 ? 1.7 : 1.0);
    float sCore = 0.04 * aRand.y;
    float sGlobe = kind < 0.5 ? 0.046 : (kind < 1.5 ? 0.034 : 0.026);
    float size = mix(mix(sStream, sCore, kE), sGlobe, kG);
    gl_PointSize = clamp(size * uScale / max(dist, 0.1), 0.0, uMaxSize);
    vSharp = kG * 0.8;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vSharp;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float soft = 1.0 - smoothstep(0.0, 0.5, d);
    soft *= soft;
    float crisp = 1.0 - smoothstep(0.26, 0.5, d);
    float a = mix(soft, crisp, vSharp);
    gl_FragColor = vec4(vColor * a, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function buildGeometry(count: number): BufferGeometry {
  const t = buildParticleTargets(count, { coreRadius: WORLD.coreRadius, globeRadius: WORLD.globeRadius });
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(t.globe, 3));
  g.setAttribute('aCoreP', new BufferAttribute(t.core, 3));
  g.setAttribute('aStream', new BufferAttribute(t.stream, 3));
  g.setAttribute('aRand', new BufferAttribute(t.rand, 4));
  g.setAttribute('aBright', new BufferAttribute(t.bright, 2));
  return g;
}

export function ParticleField() {
  const quality = useExperience((s) => s.quality);
  const count = PARTICLE_COUNTS[quality];
  const geometry = useMemo(() => buildGeometry(count), [count]);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uFly: { value: 0 },
          uMorph: { value: 0 },
          uDisperse: { value: 0 },
          uScale: { value: 800 },
          uMaxSize: { value: 40 },
          uFogDensity: { value: 0.03 },
          uStreamFrac: { value: 0.3 },
          uCore: { value: new Vector3(...WORLD.core) },
          uGlobeMat: { value: globeState.matrix },
          uTeal: { value: new Color(COLORS.teal) },
          uSoft: { value: new Color(COLORS.tealSoft) },
          uWhite: { value: new Color(COLORS.white) },
          uDeep: { value: new Color('#0E5C5A') },
        },
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );
  const points = useRef<Points>(null);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const T = scrollState.T;
    const u = material.uniforms;
    const visible = T < 3.3;
    if (points.current) points.current.visible = visible;
    if (!visible) return;
    const cam = state.camera as { fov?: number };
    const fov = ((cam.fov ?? 45) * Math.PI) / 180;
    const dpr = state.viewport.dpr;
    u.uTime.value = state.clock.elapsedTime;
    u.uFly.value = flyPhase(scrollState.entry);
    u.uMorph.value = range(0.35, 1.15, T);
    u.uDisperse.value = range(2.6, 3.2, T);
    u.uScale.value = (state.size.height * dpr) / (2 * Math.tan(fov / 2));
    u.uMaxSize.value = 42 * dpr;
    u.uStreamFrac.value = Math.min(1, 2300 / count);
    const fog = state.scene.fog;
    if (fog instanceof FogExp2) u.uFogDensity.value = fog.density;
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} renderOrder={3} />;
}
