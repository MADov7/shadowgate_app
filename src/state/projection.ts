// Screen-space positions of 3D objects, written by the 3D scene every frame and read by DOM overlays
// (e.g. accessible hotspot buttons positioned over the service constellation objects).
export interface Hotspot {
  /** CSS pixels from the viewport's left/top edge. */
  x: number;
  y: number;
  /** False when behind the camera, off-screen or faded out. */
  visible: boolean;
  /** 0..1 emphasis (1 = focused object). */
  emphasis: number;
}

export const hotspots = new Map<string, Hotspot>();
