import type { Bounds } from "./AssemblyTypes";
export type Point3 = readonly [number, number, number];
/** Open-interior slab intersection excludes tangential contact with a framing face. */
export function segmentBoxInterval(
  a: Point3,
  b: Point3,
  box: Bounds,
): readonly [number, number] | null {
  let near = 0,
    far = 1;
  const mins = [box.x, box.y, box.z],
    sizes = [box.width, box.height, box.depth];
  for (let axis = 0; axis < 3; axis++) {
    const delta = b[axis] - a[axis],
      lo = mins[axis] + 0.01,
      hi = mins[axis] + sizes[axis] - 0.01;
    if (Math.abs(delta) < 1e-9) {
      if (a[axis] < lo || a[axis] > hi) return null;
    } else {
      const t1 = (lo - a[axis]) / delta,
        t2 = (hi - a[axis]) / delta;
      near = Math.max(near, Math.min(t1, t2));
      far = Math.min(far, Math.max(t1, t2));
      if (near > far) return null;
    }
  }
  return [near, far];
}
export const segmentCrossesBox = (a: Point3, b: Point3, box: Bounds) =>
  segmentBoxInterval(a, b, box) !== null;
