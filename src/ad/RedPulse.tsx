// Hook beat: a red threat pulse (comet + trail) racing toward the sealed gateway, then a red impact glow.
// Red is used here only as the semantic "threat" colour.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  Group,
  PointLight,
  QuadraticBezierCurve3,
  Sprite,
  SpriteMaterial,
  Vector3,
} from 'three';
import { COLORS } from '../brand/brand';
import { adState } from './adState';

const TRAIL = 34;

function glowTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,140,150,0.95)');
  g.addColorStop(0.45, 'rgba(255,77,94,0.35)');
  g.addColorStop(1, 'rgba(255,77,94,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

export function RedPulse() {
  const group = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  const curve = useMemo(
    () => new QuadraticBezierCurve3(new Vector3(-11, 8.5, 7), new Vector3(-6.5, 0.6, 7.5), new Vector3(0, 2.55, 0.35)),
    [],
  );
  const { sprites, texture } = useMemo(() => {
    const texture = glowTexture();
    const color = new Color(COLORS.threat);
    const sprites = Array.from({ length: TRAIL }, (_, i) => {
      const mat = new SpriteMaterial({
        map: texture,
        color,
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: Math.pow(1 - i / TRAIL, 1.6) * (i === 0 ? 1 : 0.7),
      });
      const s = new Sprite(mat);
      const scale = (i === 0 ? 0.62 : 0.42) * (1 - i / (TRAIL * 1.1));
      s.scale.setScalar(scale);
      return s;
    });
    return { sprites, texture };
  }, []);
  const tmp = useMemo(() => new Vector3(), []);
  useEffect(
    () => () => {
      texture.dispose();
      sprites.forEach((s) => s.material.dispose());
    },
    [texture, sprites],
  );

  useFrame(() => {
    const { pulse, impact } = adState.world;
    const g = group.current;
    if (!g) return;
    const active = pulse > 0 && pulse < 1;
    sprites.forEach((s, i) => {
      const u = pulse - i * 0.0075;
      s.visible = active && u > 0;
      if (s.visible) {
        curve.getPoint(Math.min(1, u * u * (1.6 - 0.6 * u)), tmp);
        s.position.copy(tmp);
      }
    });
    if (light.current) {
      const head = sprites[0];
      light.current.position.copy(active ? head.position : curve.v2);
      light.current.intensity = active ? 6 : impact * 26;
      light.current.distance = active ? 6 : 9;
    }
  });

  return (
    <group ref={group}>
      {sprites.map((s, i) => (
        <primitive key={i} object={s} />
      ))}
      <pointLight ref={light} color={COLORS.threat} intensity={0} distance={8} decay={1.6} />
    </group>
  );
}
