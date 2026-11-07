// Scene F — the final gate opening toward a calm teal horizon (behind the individuals + contact sections).
// The chamfered frame echoes the brand mark; its two leaves carry the halves of the S path and swing open with T,
// letting soft light through. Calm, hopeful and low-contrast so the contact form stays readable on top.
import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  EdgesGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  Points,
  ShaderMaterial,
  type Texture,
} from 'three';
import { COLORS } from '../../brand/brand';
import { smoothstep } from '../../lib/choreo';
import type { Quality } from '../../lib/capabilities';
import { mulberry32 } from '../../lib/random';
import { WORLD } from '../worldLayout';
import { chamferFramePoints, disposeObject, polygonShape } from './geometry';
import { FOG_FADE, TEAL, dotTexture, sceneShader } from './shaders';

const VISIBLE_FROM = 8.3;
const W = 5.6;
const H = 6.8;
const C = 1.55;
const TH = 0.5;
const DEPTH = 0.8;

function skyMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: {
      uTeal: { value: TEAL.clone() },
      uOpen: { value: 0 },
      uTime: { value: 0 },
      uHorizon: { value: 0.2 },
      uLevel: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTeal;
      uniform float uOpen;
      uniform float uTime;
      uniform float uHorizon;
      uniform float uLevel;
      varying vec2 vUv;
      void main() {
        float y = vUv.y - uHorizon;
        vec2 c = vec2((vUv.x - 0.5) * 2.6, y);
        // Sky: deep navy above, warming to a soft teal toward the horizon line.
        vec3 navy = vec3(0.012, 0.02, 0.04);
        vec3 col = navy;
        float above = smoothstep(0.0, 0.42, y);
        col = mix(uTeal * 0.26, navy, pow(above, 0.7));
        // Below the horizon: a darker, reflective band.
        float below = smoothstep(0.0, -0.35, y);
        col = mix(col, uTeal * 0.08 + navy, below);
        // Horizon line + soft sun glow.
        float l1 = y / 0.006;
        float l2 = y / 0.04;
        float line = exp(-l1 * l1) * 0.9 + exp(-l2 * l2) * 0.35;
        float sun = exp(-dot(c, c) / 0.05) * 0.75 + exp(-dot(c, c) / 0.4) * 0.3;
        float bands = (0.5 + 0.5 * sin(vUv.y * 140.0 + uTime * 0.12)) * smoothstep(0.02, 0.3, y) * (1.0 - smoothstep(0.3, 0.6, y)) * 0.025;
        float level = 0.45 + 0.55 * uOpen;
        col += uTeal * (line + sun + bands) * level;
        col *= (0.55 + 0.45 * level) * uLevel;
        gl_FragColor = vec4(max(col, navy * 0.6), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    depthWrite: false,
    fog: false,
  });
}

function groundMaterial(): ShaderMaterial {
  return sceneShader({
    fog: false,
    uniforms: { uTeal: { value: TEAL.clone() }, uOpen: { value: 0 }, uLevel: { value: 1 }, uNear: { value: -112 }, uFar: { value: -150 } },
    vertexShader: /* glsl */ `
      varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTeal;
      uniform float uOpen;
      uniform float uLevel;
      uniform float uNear;
      uniform float uFar;
      varying vec3 vW;
      float grid(vec2 p, float s) {
        vec2 g = abs(fract(p / s - 0.5) - 0.5) * s;
        vec2 l = 1.0 - smoothstep(vec2(0.0), fwidth(p) * 1.2, g);
        return max(l.x, l.y);
      }
      void main() {
        float depth = clamp((vW.z - uNear) / (uFar - uNear), 0.0, 1.0);
        float lines = grid(vW.xz, 2.0) * (1.0 - depth) * 0.16;
        float cx = vW.x / (6.0 + depth * 30.0);
        float centre = exp(-cx * cx);
        float reflection = pow(depth, 2.2) * centre * 0.55;
        vec3 col = vec3(0.01, 0.016, 0.028) + uTeal * (lines + reflection) * (0.4 + 0.6 * uOpen) * uLevel;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

/** Soft additive light: `along` 0 → 1 runs from the light source outward (brightest near the source). */
function shaftMaterial(alongExpr: string): ShaderMaterial {
  return sceneShader({
    additive: true,
    side: DoubleSide,
    uniforms: { uColor: { value: TEAL.clone() }, uOpacity: { value: 0 } },
    vertexShader: /* glsl */ `
      #include <fog_pars_vertex>
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float along = ${alongExpr};
        float x = abs(vUv.x - 0.5) * 2.0;
        float a = (1.0 - smoothstep(0.25, 1.0, x)) * pow(1.0 - clamp(along, 0.0, 1.0), 1.6) * uOpacity;
        gl_FragColor = vec4(uColor * a, 1.0);
        ${FOG_FADE}
      }
    `,
  });
}

export interface HorizonScene {
  root: Group;
  light: PointLight;
  update: (T: number, time: number, dt: number) => void;
  dispose: () => void;
}

export function createHorizonScene(env: Texture, quality: Quality): HorizonScene {
  const root = new Group();
  root.name = 'sg-horizon';
  const gate = new Group();
  gate.position.set(...WORLD.horizonGate);
  root.add(gate);

  const metal = new MeshStandardMaterial({ color: '#2e3d56', metalness: 0.9, roughness: 0.3, envMap: env, envMapIntensity: 1.2, flatShading: true });
  const leafMetal = new MeshStandardMaterial({ color: '#3f5170', metalness: 0.88, roughness: 0.28, envMap: env, envMapIntensity: 1.2, flatShading: true });

  // Chamfered frame (single extruded outline, open at the bottom).
  const { outer, inner } = chamferFramePoints(W, H, C, TH, 0);
  const outline = [...outer, ...[...inner].reverse()];
  const frameGeo = new ExtrudeGeometry(polygonShape(outline), {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 1,
  });
  frameGeo.translate(0, 0, -DEPTH / 2);
  gate.add(new Mesh(frameGeo, metal));
  const edgeMat = new LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.35, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
  gate.add(new LineSegments(new EdgesGeometry(frameGeo, 25), edgeMat));
  // Thin inner light line tracing the opening.
  const traceMat = new MeshBasicMaterial({ color: TEAL.clone().multiplyScalar(0.8), toneMapped: false });
  for (let i = 0; i < inner.length - 1; i++) {
    const [x1, y1] = inner[i];
    const [x2, y2] = inner[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    const bar = new Mesh(new BoxGeometry(len + 0.03, 0.03, 0.03), traceMat);
    bar.position.set((x1 + x2) / 2, (y1 + y2) / 2, DEPTH / 2 + 0.045);
    bar.rotation.z = Math.atan2(y2 - y1, x2 - x1);
    gate.add(bar);
  }

  // Leaves on hinges; each carries half of the S path.
  const m = 0.05;
  const gap = 0.03;
  const hinge = inner[0][0] + m;
  const top = inner[2][1] - m;
  const leafPts: [number, number][] = [
    [0, m],
    [-gap - hinge, m],
    [-gap - hinge, top],
    [inner[2][0] + m * 0.4 - hinge, top],
    [0, inner[1][1] - m * 0.4],
  ];
  const leafOpts = { depth: 0.12, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 };
  const leafGeo = new ExtrudeGeometry(polygonShape(leafPts), leafOpts);
  leafGeo.translate(0, 0, -0.06);
  // Mirrored outline (ExtrudeGeometry normalises the winding, so normals stay correct).
  const leafGeoR = new ExtrudeGeometry(polygonShape(leafPts.map(([x, y]) => [-x, y] as [number, number])), leafOpts);
  leafGeoR.translate(0, 0, -0.06);
  const pivotL = new Group();
  pivotL.position.set(hinge, 0, 0);
  const pivotR = new Group();
  pivotR.position.set(-hinge, 0, 0);
  gate.add(pivotL, pivotR);
  const leafL = new Mesh(leafGeo, leafMetal);
  const leafR = new Mesh(leafGeoR, leafMetal);
  pivotL.add(leafL);
  pivotR.add(leafR);
  const sMat = new MeshBasicMaterial({ color: TEAL.clone(), toneMapped: false });
  const k = 0.135;
  const sx = (x: number) => (x - 32) * k;
  const sy = (y: number) => 1.2 + (46.5 - y) * k;
  const thick = 0.15;
  const bars: [number, number, number, number][] = [
    [41, 22.5, 24.5, 22.5],
    [24.5, 22.5, 24.5, 34.5],
    [24.5, 34.5, 39.5, 34.5],
    [39.5, 34.5, 39.5, 46.5],
    [39.5, 46.5, 23, 46.5],
  ];
  for (const [x1, y1, x2, y2] of bars) {
    const ax = sx(x1);
    const bx = sx(x2);
    const ay = sy(y1);
    const by = sy(y2);
    const pieces: [number, number, number, number][] =
      ay === by
        ? [
            [Math.min(ax, bx) - thick / 2, ay, -gap, ay],
            [gap, ay, Math.max(ax, bx) + thick / 2, ay],
          ]
        : [[ax, Math.min(ay, by) - thick / 2, bx, Math.max(ay, by) + thick / 2]];
    for (const [px1, py1, px2, py2] of pieces) {
      const horizontal = py1 === py2;
      const len = horizontal ? Math.abs(px2 - px1) : Math.abs(py2 - py1);
      const geo = new BoxGeometry(horizontal ? len : thick, horizontal ? thick : len, 0.06);
      const cx = (px1 + px2) / 2;
      const left = cx < 0;
      const bar = new Mesh(geo, sMat);
      bar.position.set(cx - (left ? hinge : -hinge), (py1 + py2) / 2, 0.11);
      (left ? pivotL : pivotR).add(bar);
    }
  }
  // Seam light between the closed leaves.
  const seamMat = new MeshBasicMaterial({ color: TEAL.clone(), transparent: true, opacity: 1, blending: AdditiveBlending, depthWrite: false, toneMapped: false });
  const seam = new Mesh(new PlaneGeometry(0.09, top - m), seamMat);
  seam.position.set(0, (top + m) / 2, 0.08);
  gate.add(seam);

  // Light shaft through the opening.
  const shaftMat = shaftMaterial('1.0 - vUv.y');
  const shaft = new Mesh(new PlaneGeometry(W * 1.15, 22), shaftMat);
  shaft.rotation.x = -Math.PI / 2;
  shaft.position.set(0, 0.03, 11 - 0.3);
  gate.add(shaft);
  const veilMat = shaftMaterial('vUv.y');
  const veil = new Mesh(new PlaneGeometry(W - TH * 2, H - TH), veilMat);
  veil.position.set(0, (H - TH) / 2, -0.6);
  gate.add(veil);

  // Horizon backdrop + ground.
  const sky = skyMaterial();
  const skyMesh = new Mesh(new PlaneGeometry(220, 90), sky);
  skyMesh.position.set(WORLD.horizon[0], WORLD.horizon[1] + 26, WORLD.horizon[2] - 20);
  skyMesh.renderOrder = -10;
  root.add(skyMesh);
  const groundMat = groundMaterial();
  groundMat.uniforms.uNear.value = WORLD.horizonGate[2] + 6;
  groundMat.uniforms.uFar.value = WORLD.horizon[2] - 20;
  const ground = new Mesh(new PlaneGeometry(160, 60), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.01, (WORLD.horizonGate[2] + WORLD.horizon[2] - 20) / 2 + 2);
  root.add(ground);

  // Sparse drifting particles between the gate and the horizon.
  const rand = mulberry32(31);
  const count = quality === 'low' ? 70 : 150;
  const base: number[] = [];
  for (let i = 0; i < count; i++) {
    base.push((rand() - 0.5) * 30, 0.3 + rand() * 8, WORLD.horizonGate[2] + 6 - rand() * 40);
  }
  const dustGeo = new BufferGeometry();
  const dustPos = new Float32Array(base);
  dustGeo.setAttribute('position', new Float32BufferAttribute(dustPos, 3));
  const dustMat = new ShaderMaterial({
    uniforms: { uMap: { value: dotTexture() }, uTeal: { value: TEAL.clone() }, uOpacity: { value: 0 }, uScale: { value: 1000 } },
    vertexShader: /* glsl */ `
      uniform float uScale;
      varying float vFade;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vFade = clamp((-mv.z - 1.0) / 6.0, 0.0, 1.0) * (1.0 - clamp((-mv.z - 30.0) / 15.0, 0.0, 1.0));
        gl_PointSize = 0.06 * uScale / -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec3 uTeal;
      uniform float uOpacity;
      varying float vFade;
      void main() {
        float a = texture2D(uMap, gl_PointCoord).a * vFade * uOpacity;
        gl_FragColor = vec4(uTeal * a, 1.0);
      }
    `,
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const dust = new Points(dustGeo, dustMat);
  dust.frustumCulled = false;
  root.add(dust);

  const light = new PointLight(COLORS.teal, 0, 26, 2);
  light.position.set(WORLD.horizonGate[0], WORLD.horizonGate[1] + 3.2, WORLD.horizonGate[2] - 2.5);

  function update(T: number, time: number) {
    const visible = T > VISIBLE_FROM;
    root.visible = visible;
    if (!visible) {
      light.intensity = 0;
      return;
    }
    const open = smoothstep(9.32, 9.95, T);
    const eased = open * open * (3 - 2 * open);
    const angle = eased * 1.32;
    pivotL.rotation.y = angle;
    pivotR.rotation.y = -angle;
    seamMat.opacity = (1 - smoothstep(0, 0.25, open)) * 0.9;
    // Keep the horizon a faint promise behind the Build scene; it brightens as the camera arrives at the gate.
    const level = 0.08 + 0.92 * smoothstep(8.95, 9.35, T);
    sky.uniforms.uLevel.value = level;
    groundMat.uniforms.uLevel.value = level;
    sky.uniforms.uOpen.value = open;
    sky.uniforms.uTime.value = time;
    groundMat.uniforms.uOpen.value = open;
    shaftMat.uniforms.uOpacity.value = 0.12 + 0.35 * open;
    veilMat.uniforms.uOpacity.value = 0.05 + 0.12 * open;
    edgeMat.opacity = 0.18 + 0.25 * smoothstep(9.0, 9.4, T);
    sMat.color.copy(TEAL).multiplyScalar(0.7 + 0.5 * (1 - open));
    light.intensity = 6 + 30 * open;
    // Particles drift slowly upward and toward the viewer, wrapping inside their volume.
    const zFar = WORLD.horizonGate[2] + 6 - 40;
    for (let i = 0; i < count; i++) {
      dustPos[i * 3 + 1] = 0.3 + ((base[i * 3 + 1] - 0.3 + time * 0.12) % 8.5);
      dustPos[i * 3 + 2] = zFar + ((base[i * 3 + 2] - zFar + time * 0.35) % 40);
    }
    dustGeo.attributes.position.needsUpdate = true;
    dustMat.uniforms.uOpacity.value = 0.35 + 0.5 * open;
  }

  return {
    root,
    light,
    update: (T, time) => update(T, time),
    dispose: () => disposeObject(root),
  };
}
