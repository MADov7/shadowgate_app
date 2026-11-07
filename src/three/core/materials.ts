// Shared shader materials for the world-core visuals. All emissive output is HDR (values > 1) so the bloom pass
// (threshold ≈ 0.9) picks up only lines, glows and bright particles — never the dark metal or the navy fog.
import { AdditiveBlending, Color, DoubleSide, ShaderMaterial, type IUniform } from 'three';

const OUTPUT = /* glsl */ `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`;

/** Progressive glowing line (see core/strips.ts — uv.x = draw parameter). */
export function createTraceMaterial(color: string, opts: { steady?: number; base?: number; head?: number } = {}): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(color) },
      uProgress: { value: 0 },
      uSteady: { value: opts.steady ?? 1.6 },
      uBase: { value: opts.base ?? 0.05 },
      uHead: { value: opts.head ?? 7 },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uProgress, uSteady, uBase, uHead, uTime, uOpacity;
      varying vec2 vUv;
      void main() {
        float u = vUv.x;
        float ay = (vUv.y - 0.5) * 2.0;
        float across = 1.0 - ay * ay;
        float drawn = step(u, uProgress);
        float done = smoothstep(0.96, 1.0, uProgress);
        float behind = uProgress - u;
        float hb = behind / 0.028;
        float head = exp(-hb * hb) * step(-0.004, behind) * (1.0 - done) * step(0.001, uProgress);
        // Calm breathing once the trace has settled.
        float breathe = 0.86 + 0.14 * sin(uTime * 1.1 - u * 7.0);
        float i = uBase + drawn * uSteady * mix(1.0, breathe, done) + head * uHead;
        gl_FragColor = vec4(uColor * i * across * uOpacity, 1.0);
        ${OUTPUT}
      }
    `,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
}

export type Uniforms = Record<string, IUniform>;

/**
 * Light behind the gate seen through the opening: a hot vertical core that widens as the leaves swing,
 * plus a soft fill. uLight 0..1, uFade fades it out as the camera reaches it.
 */
export function createGateGlowMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uLight: { value: 0 },
      uFade: { value: 1 },
      uTime: { value: 0 },
      uTeal: { value: new Color('#35F2C4') },
      uWhite: { value: new Color('#E9FFF8') },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uLight, uFade, uTime;
      uniform vec3 uTeal, uWhite;
      varying vec2 vUv;
      void main() {
        float x = vUv.x - 0.5;
        float y = vUv.y;
        float width = mix(0.012, 0.36, uLight);
        float core = exp(-x * x / (width * width));
        float fill = smoothstep(0.62, 0.0, abs(x)) * uLight;
        float vert = smoothstep(0.0, 0.08, y) * (1.0 - smoothstep(0.82, 1.0, y));
        float shimmer = 0.94 + 0.06 * sin(uTime * 2.3 + y * 18.0);
        float i = (core * mix(4.2, 3.2, uLight) + fill * 1.25) * vert * shimmer;
        vec3 col = mix(uTeal, uWhite, clamp(core * 0.75, 0.0, 1.0));
        gl_FragColor = vec4(col * i * uFade, 1.0);
        ${OUTPUT}
      }
    `,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
}

/** Large soft radial glow (backlight haze, halos). uIntensity is HDR. */
export function createHaloMaterial(color: string, intensity = 1): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(color) },
      uIntensity: { value: intensity },
      uStretch: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uIntensity, uStretch;
      varying vec2 vUv;
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        p.y /= uStretch;
        float d = length(p);
        float g = exp(-d * d * 3.2) * (1.0 - smoothstep(0.7, 1.0, d));
        gl_FragColor = vec4(uColor * g * uIntensity, 1.0);
        ${OUTPUT}
      }
    `,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
}

/** Full-screen additive wash (the threshold flash as the camera crosses the gate plane). */
export function createScreenFlashMaterial(color: string): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: { uColor: { value: new Color(color) }, uIntensity: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uIntensity;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv - 0.5;
        float v = 1.0 - smoothstep(0.1, 0.85, length(p));
        gl_FragColor = vec4(uColor * uIntensity * (0.45 + 0.55 * v), 1.0);
        ${OUTPUT}
      }
    `,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
}
