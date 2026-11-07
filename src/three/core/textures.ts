// Procedural textures drawn on a 2D canvas at runtime — the world never downloads image or HDR files.
import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace, RepeatWrapping, SRGBColorSpace } from 'three';
import { mulberry32 } from '../../lib/random';

function canvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  return [c, ctx];
}

/** Tileable fractal value noise (grey, 0..255) — used for drifting ground fog. */
export function fogNoiseTexture(size = 256, seed = 11): CanvasTexture {
  const [c, ctx] = canvas(size);
  const img = ctx.createImageData(size, size);
  const rand = mulberry32(seed);
  const octaves = [
    { cells: 4, amp: 0.55 },
    { cells: 8, amp: 0.27 },
    { cells: 16, amp: 0.13 },
    { cells: 32, amp: 0.05 },
  ];
  const grids = octaves.map((o) => {
    const g = new Float32Array(o.cells * o.cells);
    for (let i = 0; i < g.length; i++) g[i] = rand();
    return g;
  });
  const fade = (t: number) => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0;
      octaves.forEach((o, k) => {
        const g = grids[k];
        const fx = (x / size) * o.cells;
        const fy = (y / size) * o.cells;
        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const tx = fade(fx - x0);
        const ty = fade(fy - y0);
        const at = (ix: number, iy: number) => g[((iy % o.cells) * o.cells + (ix % o.cells)) | 0];
        const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx;
        const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx;
        v += (a + (b - a) * ty) * o.amp;
      });
      const i = (y * size + x) * 4;
      const byte = Math.max(0, Math.min(255, Math.round(v * 255)));
      img.data[i] = byte;
      img.data[i + 1] = byte;
      img.data[i + 2] = byte;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new CanvasTexture(c);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.colorSpace = NoColorSpace;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Brushed-metal micro detail: fine vertical streaks. Used as roughness + bump map on the gateway so the
 * environment reflections break up like machined metal instead of plastic.
 */
export function brushedMetalTexture(size = 512, seed = 5): CanvasTexture {
  const [c, ctx] = canvas(size);
  const rand = mulberry32(seed);
  ctx.fillStyle = 'rgb(128,128,128)';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 2600; i++) {
    const x = rand() * size;
    const len = 20 + rand() * size * 0.8;
    const y = rand() * size;
    const shade = rand() > 0.5 ? 255 : 0;
    ctx.strokeStyle = `rgba(${shade},${shade},${shade},${0.025 + rand() * 0.06})`;
    ctx.lineWidth = 0.5 + rand() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * 2, y + len);
    ctx.stroke();
    // Wrap so the texture tiles vertically.
    if (y + len > size) {
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.lineTo(x, y - size + len);
      ctx.stroke();
    }
  }
  // A few soft blotches (handling marks / oxidation) for large-scale variation.
  for (let i = 0; i < 26; i++) {
    const r = 30 + rand() * 90;
    const x = rand() * size;
    const y = rand() * size;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const v = rand() > 0.5 ? 255 : 0;
    g.addColorStop(0, `rgba(${v},${v},${v},0.06)`);
    g.addColorStop(1, `rgba(${v},${v},${v},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const tex = new CanvasTexture(c);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.colorSpace = NoColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Soft radial sprite (white → transparent), sRGB, for glow cards. */
export function radialSprite(size = 128): CanvasTexture {
  const [c, ctx] = canvas(size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
