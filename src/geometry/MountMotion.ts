import type { Assembly, Bounds, Finding } from "./AssemblyTypes";
import { getPart } from "./AssemblyTypes";
import type { Project } from "../designer/DesignerTypes";
import { profileHeightAt } from "./WallProfile";

export const mountPresets = [
  { id: "parked", label: "Parked" },
  { id: "extended", label: "Extended" },
  { id: "left", label: "Swivel left" },
  { id: "right", label: "Swivel right" },
] as const;
export type MountPreset = (typeof mountPresets)[number]["id"];
export type Point = readonly [number, number, number];
export type MountTransform = Readonly<{
  pivot: Point;
  extension: number;
  angle: number;
}>;
export type MountPreview = Readonly<{
  preset: MountPreset;
  transform: MountTransform;
  assembly: Assembly;
  links: readonly (readonly [Point, Point])[];
  hinges: readonly Point[];
  rearClearance: number;
  closestRearPoint: Point;
  consoleGap: number;
}>;
export function movePoint([x, y, z]: Point, pose: MountTransform): Point {
  const [px, , pz] = pose.pivot,
    c = Math.cos(pose.angle),
    s = Math.sin(pose.angle);
  return [
    px + c * (x - px) + s * (z - pz),
    y,
    pz + pose.extension - s * (x - px) + c * (z - pz),
  ];
}
export function boundsCorners(b: Bounds): Point[] {
  return [b.x, b.x + b.width].flatMap((x) =>
    [b.y, b.y + b.height].flatMap((y) =>
      [b.z, b.z + b.depth].map((z) => [x, y, z] as const),
    ),
  );
}
export function movedBounds(b: Bounds, pose: MountTransform): Bounds {
  const points = boundsCorners(b).map((p) => movePoint(p, pose));
  const x = Math.min(...points.map((p) => p[0])),
    y = b.y,
    z = Math.min(...points.map((p) => p[2]));
  return {
    x,
    y,
    z,
    width: Math.max(...points.map((p) => p[0])) - x,
    height: b.height,
    depth: Math.max(...points.map((p) => p[2])) - z,
  };
}
/** Separating-axis test: exact for a yawed rectangular part against fixed boxes. */
export function posedIntersects(
  moving: Bounds,
  fixed: Bounds,
  pose: MountTransform,
): boolean {
  if (
    moving.y >= fixed.y + fixed.height - 0.01 ||
    moving.y + moving.height <= fixed.y + 0.01
  )
    return false;
  const a = boundsCorners(moving).map((p) => movePoint(p, pose)),
    b = boundsCorners(fixed);
  for (const [dx, dz] of [
    [1, 0],
    [0, 1],
    [Math.cos(pose.angle), -Math.sin(pose.angle)],
    [Math.sin(pose.angle), Math.cos(pose.angle)],
  ]) {
    const pa = a.map((p) => p[0] * dx + p[2] * dz),
      pb = b.map((p) => p[0] * dx + p[2] * dz);
    if (
      Math.max(...pa) <= Math.min(...pb) + 0.01 ||
      Math.max(...pb) <= Math.min(...pa) + 0.01
    )
      return false;
  }
  return true;
}
export function resolveMountPreview(
  project: Project,
  base: Assembly,
  preset: MountPreset,
): MountPreview {
  const mount = getPart(base, "mount").bounds,
    tv = getPart(base, "tv").bounds;
  const transform: MountTransform = {
    pivot: [tv.x + tv.width / 2, 0, tv.z],
    extension: preset === "parked" ? 0 : project.distances.mountExtension.mm,
    angle:
      ((preset === "left" ? -1 : preset === "right" ? 1 : 0) *
        project.mountSwivelDegrees *
        Math.PI) /
      180,
  };
  const moving = [
    getPart(base, "tv").bounds,
    getPart(base, "soundbar").bounds,
    ...base.construction.cradle,
    ...base.construction.rails,
  ];
  const corners = moving.flatMap((b) =>
    boundsCorners(b).map((p) => movePoint(p, transform)),
  );
  const closestRearPoint = corners.reduce((best, p) =>
    p[2] < best[2] ? p : best,
  );
  const console = getPart(base, "console").bounds;
  const checks: Finding[] = [];
  if (preset !== "parked") {
    for (const id of [
      "featurePanel",
      "slats",
      "drywall",
      "console",
      "beam",
    ] as const) {
      if (
        moving.some((b) =>
          posedIntersects(b, getPart(base, id).bounds, transform),
        )
      )
        checks.push({
          code: `pose-collision-${id}`,
          severity: "warning",
          message: `Selected mount position intersects ${getPart(base, id).label.toLowerCase()}. Increase extension, reduce swivel or adjust the layout.`,
        });
    }
    if (
      corners.some(
        (p) =>
          p[0] < 0 ||
          p[0] > project.distances.wallWidth.mm ||
          p[1] < 0 ||
          p[1] > profileHeightAt(base.wallProfile, p[0]),
      )
    )
      checks.push({
        code: "pose-outside-wall",
        severity: "warning",
        message:
          "The moving assembly extends beyond the modeled wall boundary.",
      });
  }
  const start: Point = [
    mount.x + mount.width / 2,
    mount.y + mount.height / 2,
    mount.z + project.distances.mountPlateThickness.mm,
  ];
  const end = movePoint([transform.pivot[0], start[1], tv.z - 3], transform);
  // Four-arm diamond illustration. Length is inferred from the configured
  // preview reach, not measured hardware; it does not constrain swivel poses.
  const dx = end[0] - start[0],
    dz = end[2] - start[2];
  const reach = Math.hypot(dx, dz);
  const armLength = Math.max(
    30,
    (tv.z - 3 - start[2] + project.distances.mountExtension.mm) / 2 + 15,
  );
  const halfWidth = Math.sqrt(Math.max(0, armLength ** 2 - (reach / 2) ** 2));
  const nx = reach > 0 ? dz / reach : 1,
    nz = reach > 0 ? -dx / reach : 0;
  const midpoint: Point = [
    (start[0] + end[0]) / 2,
    start[1],
    (start[2] + end[2]) / 2,
  ];
  const left: Point = [
    midpoint[0] - nx * halfWidth,
    midpoint[1],
    midpoint[2] - nz * halfWidth,
  ];
  const right: Point = [
    midpoint[0] + nx * halfWidth,
    midpoint[1],
    midpoint[2] + nz * halfWidth,
  ];
  const movingIds = new Set(["tv", "soundbar", "cradle"]);
  return {
    preset,
    transform,
    links: [
      [start, left],
      [left, end],
      [start, right],
      [right, end],
    ],
    hinges: [start, left, right, end],
    rearClearance: closestRearPoint[2] - base.depth.panelFront,
    closestRearPoint,
    consoleGap:
      Math.min(...moving.map((b) => b.y)) - console.y - console.height,
    assembly: {
      ...base,
      parts: base.parts.map((part) =>
        movingIds.has(part.id)
          ? { ...part, bounds: movedBounds(part.bounds, transform) }
          : part,
      ),
      findings: [
        ...base.findings.filter(
          (f) =>
            preset === "parked" ||
            ![
              "soundbar-panel-overlap",
              "cradle-panel-overlap",
              "soundbar-console-overlap",
              "outside-tv",
              "outside-soundbar",
              "outside-cradle",
            ].includes(f.code),
        ),
        ...checks,
      ],
    },
  };
}
