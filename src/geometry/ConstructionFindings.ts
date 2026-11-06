import type { Project } from "../designer/DesignerTypes";
import {
  intersects,
  type Bounds,
  type Construction,
  type Finding,
} from "./AssemblyTypes";

type Point = readonly [number, number, number];
/** Segment/box slab test; endpoints touching a face are not a penetration. */
export function segmentCrossesBox(a: Point, b: Point, box: Bounds): boolean {
  let near = 0,
    far = 1;
  const mins = [box.x, box.y, box.z];
  const sizes = [box.width, box.height, box.depth];
  for (let axis = 0; axis < 3; axis++) {
    const delta = b[axis] - a[axis],
      lo = mins[axis] + 0.01,
      hi = mins[axis] + sizes[axis] - 0.01;
    if (Math.abs(delta) < 1e-9) {
      if (a[axis] < lo || a[axis] > hi) return false;
    } else {
      const t1 = (lo - a[axis]) / delta,
        t2 = (hi - a[axis]) / delta;
      near = Math.max(near, Math.min(t1, t2));
      far = Math.min(far, Math.max(t1, t2));
      if (near > far) return false;
    }
  }
  return near <= far;
}
export function constructionFindings(
  project: Project,
  c: Construction,
): Finding[] {
  const d = project.distances,
    result: Finding[] = [];
  const warn = (code: string, message: string) =>
    result.push({ code, message, severity: "warning" });
  if (d.blockingDepth.mm > d.studDepth.mm)
    warn(
      "blocking-depth",
      "Blocking extends beyond the back of the framing cavity.",
    );
  if (d.lagEmbedment.mm > d.blockingDepth.mm)
    warn("lag-depth", "Proposed lag embedment exceeds blocking depth.");
  if (d.boxDepth.mm > d.studDepth.mm)
    warn(
      "box-depth",
      "Electrical box backs extend beyond the modeled framing cavity.",
    );
  if (d.boxWidth.mm >= d.plateWidth.mm || d.boxHeight.mm >= d.plateHeight.mm)
    warn(
      "plate-coverage",
      "The plate group does not cover the proposed rough opening on all edges.",
    );
  if (c.boxes.some((box) => c.supports.some((s) => intersects(box, s))))
    warn(
      "box-spacer",
      "An electrical box / rough opening overlaps a panel spacer.",
    );
  if (d.routeDepth.mm > d.studDepth.mm || d.routeDepth.mm > d.boxDepth.mm)
    warn(
      "route-depth",
      "The cable route plane is behind the cavity or box backs; adjust route depth or box depth.",
    );
  c.routes.forEach((route, i) => {
    const name = i === 0 ? "Power" : "Low-voltage";
    if (route.some((p) => p[0] < 0 || p[0] > d.wallWidth.mm || p[1] < 0))
      warn(
        `route-outside-${i}`,
        `${name} route extends outside the modeled wall.`,
      );
    if (
      route
        .slice(1)
        .some((p, index) =>
          [...c.studs, ...c.blocking].some((b) =>
            segmentCrossesBox(route[index], p, b),
          ),
        )
    )
      warn(
        `route-framing-${i}`,
        `${name} route crosses framing or blocking. A passage through that member has not been planned.`,
      );
  });
  if (
    c.lagPaths.some(
      (lag) =>
        !c.supports
          .filter((s) => s.role === "mount")
          .some(
            (s) =>
              lag.start[0] >= s.x &&
              lag.start[0] <= s.x + s.width &&
              lag.start[1] >= s.y &&
              lag.start[1] <= s.y + s.height,
          ),
    )
  )
    warn("lag-misses-spacer", "A proposed lag row misses the mount spacers.");
  return result;
}
