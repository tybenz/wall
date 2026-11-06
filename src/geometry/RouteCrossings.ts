import type { Bounds } from "./AssemblyTypes";
import { segmentBoxInterval, type Point3 } from "./SegmentIntersections";
export type RouteCrossing = Readonly<{
  kind: "power" | "signal";
  memberId: string;
  memberLabel: string;
  entry: Point3;
  exit: Point3;
  center: Point3;
}>;
export function resolveRouteCrossings(
  routes: readonly (readonly Point3[])[],
  studs: readonly Bounds[],
  blocking: readonly Bounds[],
): readonly RouteCrossing[] {
  const members = [
    ...studs.map((b, i) => ({
      b,
      id: `stud-${i + 1}`,
      label: `Stud ${i + 1}`,
    })),
    ...blocking.map((b, i) => ({
      b,
      id: `blocking-${i + 1}`,
      label: `Blocking ${i + 1}`,
    })),
  ];
  const result: RouteCrossing[] = [];
  routes.forEach((route, index) =>
    route.slice(1).forEach((b, segment) => {
      const a = route[segment],
        at = (t: number) =>
          [
            a[0] + (b[0] - a[0]) * t,
            a[1] + (b[1] - a[1]) * t,
            a[2] + (b[2] - a[2]) * t,
          ] as const;
      for (const member of members) {
        const hit = segmentBoxInterval(a, b, member.b);
        if (hit)
          result.push({
            kind: index === 0 ? "power" : "signal",
            memberId: member.id,
            memberLabel: member.label,
            entry: at(hit[0]),
            exit: at(hit[1]),
            center: at((hit[0] + hit[1]) / 2),
          });
      }
    }),
  );
  return result;
}
