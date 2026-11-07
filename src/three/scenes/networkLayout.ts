// Pure layout + storytelling maths for the Defense Network (Scene C). No three.js imports, so it is unit-tested.
import type { Vec3 } from '../worldLayout';

/** The four company assets, in LAYER_ORDER (layer 5 "ongoing review" is the dome over everything). */
export const NETWORK_NODES = ['website', 'email', 'cloud', 'accounts'] as const;
export type NetworkNode = (typeof NETWORK_NODES)[number];

/** Platform/scene dimensions (local units, centred on WORLD.network). */
export const NET = {
  platformRadius: 7.1,
  platformTop: 0.2,
  /** Node form centre height above the platform top. */
  nodeLift: 1.05,
  shellRadius: 1.28,
  domeRadius: 7.6,
  /** Packets start this far outside each node (horizontally) and this high. */
  packetReach: 6.4,
  packetHeight: 3.6,
} as const;

/** Square arrangement seen from the elevated camera: website front-left → email back-left → cloud back-right → accounts front-right. */
const DIRS: readonly [number, number][] = [
  [-Math.SQRT1_2, Math.SQRT1_2],
  [-Math.SQRT1_2, -Math.SQRT1_2],
  [Math.SQRT1_2, -Math.SQRT1_2],
  [Math.SQRT1_2, Math.SQRT1_2],
];

/** Local position of node i (pedestal base) on a ring of `radius`. */
export function networkNodePos(i: number, radius: number): Vec3 {
  const [dx, dz] = DIRS[i % DIRS.length];
  return [dx * radius, NET.platformTop, dz * radius];
}

/** Horizontal outward unit direction for node i. */
export function networkNodeDir(i: number): [number, number] {
  return DIRS[i % DIRS.length];
}

/**
 * First parameter t ∈ [0, 1] along from→to where the segment enters the sphere (c, r).
 * Returns 1 if the segment never enters it, 0 if it starts inside.
 */
export function sphereEntryT(from: Vec3, to: Vec3, c: Vec3, r: number): number {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const fx = from[0] - c[0];
  const fy = from[1] - c[1];
  const fz = from[2] - c[2];
  const A = dx * dx + dy * dy + dz * dz;
  const B = 2 * (fx * dx + fy * dy + fz * dz);
  const C = fx * fx + fy * fy + fz * fz - r * r;
  if (C <= 0) return 0;
  if (A === 0) return 1;
  const disc = B * B - 4 * A * C;
  if (disc < 0) return 1;
  const t = (-B - Math.sqrt(disc)) / (2 * A);
  return t >= 0 && t <= 1 ? t : 1;
}

export interface PacketPath {
  node: number;
  from: Vec3;
  to: Vec3;
  /** Path parameter where the node's own shell stops the packet. */
  tShell: number;
  /** Path parameter where the network dome stops the packet. */
  tDome: number;
  /** 0..1 cycle phase offset. */
  phase: number;
}

/** Symbolic threat packet paths: `perNode` packets fly toward each node from slightly different angles. */
export function buildPacketPaths(radius: number, perNode = 2): PacketPath[] {
  const paths: PacketPath[] = [];
  const domeCentre: Vec3 = [0, NET.platformTop, 0];
  for (let i = 0; i < NETWORK_NODES.length; i++) {
    const base = networkNodePos(i, radius);
    const [dx, dz] = networkNodeDir(i);
    const to: Vec3 = [base[0], base[1] + NET.nodeLift, base[2]];
    for (let k = 0; k < perNode; k++) {
      // Fan the approach angle a little either side of the outward direction.
      const fan = (k - (perNode - 1) / 2) * 0.55;
      const cos = Math.cos(fan);
      const sin = Math.sin(fan);
      const ox = dx * cos - dz * sin;
      const oz = dx * sin + dz * cos;
      const from: Vec3 = [
        to[0] + ox * NET.packetReach,
        to[1] + NET.packetHeight - k * 0.9,
        to[2] + oz * NET.packetReach,
      ];
      const len = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
      paths.push({
        node: i,
        from,
        to,
        tShell: Math.max(0, 1 - NET.shellRadius / len),
        tDome: sphereEntryT(from, to, domeCentre, NET.domeRadius),
        phase: (i * 0.27 + k * 0.5) % 1,
      });
    }
  }
  return paths;
}

export interface PacketState {
  /** Path parameter of the packet (clamped to the stop point). */
  s: number;
  /** True while the packet is in flight. */
  flying: boolean;
  /** Seconds since impact at a shield (−1 if none this cycle). */
  impactAge: number;
}

export const PACKET_PERIOD = 3.8;
const TRAVEL = 0.62;

/**
 * Where a packet is at `time`. Pure: `stopAt` is the path parameter of the active shield (1 = unprotected,
 * the packet simply reaches the node and fades — storytelling only).
 */
export function packetAt(time: number, phase: number, stopAt: number, out: PacketState): PacketState {
  const u = (((time / PACKET_PERIOD + phase) % 1) + 1) % 1;
  const s = u / TRAVEL;
  if (s < stopAt) {
    out.s = s;
    out.flying = true;
    out.impactAge = -1;
  } else {
    out.s = stopAt;
    out.flying = false;
    out.impactAge = stopAt < 1 ? (s - stopAt) * TRAVEL * PACKET_PERIOD : -1;
  }
  return out;
}
