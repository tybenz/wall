import type { Bounds } from "./AssemblyTypes";

/** Illustrative twin-arm cradle attached to the TV-side mount rails. */
export function resolveCradle(
  bar: Bounds,
  tv: Bounds,
  mount: Bounds,
  thickness: number,
) {
  const back = Math.min(tv.z - thickness, bar.z - thickness);
  const front = bar.z + bar.depth + thickness;
  const bottom = bar.y - thickness;
  const armWidth = Math.min(32, bar.width / 8);
  const top = Math.max(tv.y + Math.min(100, tv.height / 4), bottom + thickness);
  const centers = [0.25, 0.75].map(
    (fraction) => mount.x + mount.width * fraction,
  );
  const members: Bounds[] = centers.flatMap((x) => [
    {
      x: x - armWidth / 2,
      y: bottom,
      z: back,
      width: armWidth,
      height: top - bottom,
      depth: thickness,
    },
    {
      x: x - armWidth / 2,
      y: bottom,
      z: back,
      width: armWidth,
      height: thickness,
      depth: front - back,
    },
    {
      x: x - armWidth / 2,
      y: bottom,
      z: front - thickness,
      width: armWidth,
      height: Math.min(12, bar.height / 3) + thickness,
      depth: thickness,
    },
  ]);
  const bounds: Bounds = {
    x: centers[0] - armWidth / 2,
    y: bottom,
    z: back,
    width: centers[1] - centers[0] + armWidth,
    height: top - bottom,
    depth: front - back,
  };
  return { members, bounds };
}
