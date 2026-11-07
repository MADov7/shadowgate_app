// Small shader toolkit for the later scenes: fog-aware ShaderMaterials, a shared soft glow sprite texture and
// reusable GLSL snippets. Additive materials fade to black in fog (instead of adding the fog colour).
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  NormalBlending,
  ShaderMaterial,
  SRGBColorSpace,
  UniformsLib,
  UniformsUtils,
  type IUniform,
  type Side,
  type Texture,
} from 'three';
import { COLORS } from '../../brand/brand';

export const TEAL = new Color(COLORS.teal);
export const THREAT = new Color(COLORS.threat);

/** Additive-safe fog: darkens with distance instead of mixing toward the fog colour. Uses gl_FragColor. */
export const FOG_FADE = /* glsl */ `
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float sgFog = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
  #else
    float sgFog = smoothstep( fogNear, fogFar, vFogDepth );
  #endif
  gl_FragColor.rgb *= ( 1.0 - sgFog );
#endif
`;

interface SceneShaderOptions {
  uniforms: Record<string, IUniform>;
  vertexShader: string;
  fragmentShader: string;
  additive?: boolean;
  transparent?: boolean;
  depthWrite?: boolean;
  depthTest?: boolean;
  side?: Side;
  fog?: boolean;
  toneMapped?: boolean;
}

/**
 * ShaderMaterial with fog uniforms merged in. Vertex shaders must declare `vec4 mvPosition` and end with
 * `#include <fog_vertex>`; fragment shaders include `<fog_pars_fragment>` and finish with FOG_FADE (additive)
 * or `<fog_fragment>`.
 */
export function sceneShader(o: SceneShaderOptions): ShaderMaterial {
  const fog = o.fog ?? true;
  const additive = o.additive ?? false;
  const material = new ShaderMaterial({
    uniforms: fog ? { ...UniformsUtils.clone(UniformsLib.fog), ...o.uniforms } : o.uniforms,
    vertexShader: o.vertexShader,
    fragmentShader: o.fragmentShader,
    transparent: o.transparent ?? additive,
    blending: additive ? AdditiveBlending : NormalBlending,
    depthWrite: o.depthWrite ?? !additive,
    depthTest: o.depthTest ?? true,
    fog,
    toneMapped: o.toneMapped ?? !additive,
  });
  if (o.side !== undefined) material.side = o.side;
  return material;
}

let glowTex: Texture | null = null;
/** Soft radial glow (white → transparent) for additive sprites. */
export function glowTexture(): Texture {
  if (glowTex) return glowTex;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.18, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.14)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  glowTex = new CanvasTexture(canvas);
  glowTex.colorSpace = SRGBColorSpace;
  return glowTex;
}

let dotTex: Texture | null = null;
/** Small crisp round point for particle sprites. */
export function dotTexture(): Texture {
  if (dotTex) return dotTex;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.8)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  dotTex = new CanvasTexture(canvas);
  dotTex.colorSpace = SRGBColorSpace;
  return dotTex;
}

/**
 * Wire / fresnel shells that "grow" from the bottom up as uReveal goes 0 → 1, with a bright scan front.
 * `aspectY` normalises local y into 0..1 (bottom → top): h = (y - uMinY) / (uMaxY - uMinY).
 */
export function revealWireMaterial(minY: number, maxY: number, color: Color = TEAL): ShaderMaterial {
  return sceneShader({
    additive: true,
    uniforms: {
      uColor: { value: color.clone() },
      uReveal: { value: 0 },
      uOpacity: { value: 1 },
      uBoost: { value: 0 },
      uMinY: { value: minY },
      uMaxY: { value: maxY },
    },
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      varying float vH;
      uniform float uMinY;
      uniform float uMaxY;
      void main() {
        vH = (position.y - uMinY) / (uMaxY - uMinY);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform vec3 uColor;
      uniform float uReveal;
      uniform float uOpacity;
      uniform float uBoost;
      varying float vH;
      void main() {
        float front = uReveal * 1.12 - 0.04;
        float shown = 1.0 - smoothstep(front - 0.08, front, vH);
        float ed = (vH - front) / 0.035;
        float edge = exp(-ed * ed) * step(0.001, uReveal) * (1.0 - smoothstep(0.92, 1.0, uReveal));
        float a = (shown * (0.55 + uBoost) + edge * 1.6) * uOpacity;
        gl_FragColor = vec4(uColor * a, 1.0);
        ${FOG_FADE}
      }
    `,
  });
}

/** Additive fresnel skin (silhouette glow) with the same bottom-up reveal and an optional horizontal scan band. */
export function fresnelShellMaterial(minY: number, maxY: number, color: Color = TEAL): ShaderMaterial {
  return sceneShader({
    additive: true,
    uniforms: {
      uColor: { value: color.clone() },
      uReveal: { value: 0 },
      uOpacity: { value: 1 },
      uPower: { value: 2.4 },
      uScan: { value: -10 },
      uScanAmt: { value: 0 },
      uMinY: { value: minY },
      uMaxY: { value: maxY },
    },
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      varying vec3 vN;
      varying vec3 vV;
      varying float vH;
      varying float vY;
      uniform float uMinY;
      uniform float uMaxY;
      void main() {
        vH = (position.y - uMinY) / (uMaxY - uMinY);
        vY = position.y;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform vec3 uColor;
      uniform float uReveal;
      uniform float uOpacity;
      uniform float uPower;
      uniform float uScan;
      uniform float uScanAmt;
      varying vec3 vN;
      varying vec3 vV;
      varying float vH;
      varying float vY;
      void main() {
        float f = pow(clamp(1.0 - abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), uPower);
        float front = uReveal * 1.12 - 0.04;
        float shown = 1.0 - smoothstep(front - 0.1, front, vH);
        float bd = (vY - uScan) / 0.12;
        float band = exp(-bd * bd) * uScanAmt;
        float a = (f * 0.9 + 0.035 + band * (0.25 + f)) * shown * uOpacity;
        gl_FragColor = vec4(uColor * a, 1.0);
        ${FOG_FADE}
      }
    `,
  });
}
