import type { Project, FieldId } from "../designer/DesignerTypes";
import { getPart, type Assembly, type Bounds } from "../geometry/AssemblyTypes";
import type { ElectricalPartId } from "../electrical/ElectricalTypes";
export const constructionViews = [
  { id: "framing", label: "Framing elevation" },
  { id: "rails", label: "TV & rails" },
  { id: "mount", label: "Mount section" },
  { id: "electrical", label: "Electrical section" },
  { id: "edge", label: "Panel edge" },
] as const;
export type ConstructionView =
  (typeof constructionViews)[number]["id"] | "schedule";
export type SectionRect = Readonly<{
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  outline?: boolean;
}>;
export type SectionLine = Readonly<{
  id: string;
  label?: string;
  points: readonly (readonly [number, number])[];
  color: string;
  dashed?: boolean;
}>;
export type SectionMeasure = Readonly<{
  label: string;
  mm: number;
  field?: FieldId;
}>;
export type ConstructionSection = Readonly<{
  title: string;
  description: string;
  axis: string;
  cutX: number | null;
  rects: readonly SectionRect[];
  lines: readonly SectionLine[];
  measures: readonly SectionMeasure[];
  extent: Readonly<{
    left: number;
    right: number;
    bottom: number;
    top: number;
  }>;
}>;
const wood = "#c7ab83",
  block = "#b4956d",
  spacer = "#91a57e",
  wall = "#dddcd2",
  panelColor = "#fffef8";
export function resolveConstructionSection(
  project: Project,
  assembly: Assembly,
  view: Exclude<ConstructionView, "schedule">,
  electricalPart: ElectricalPartId = "upperPower",
): ConstructionSection {
  const d = project.distances,
    c = assembly.construction,
    m = c.datums;
  const panel = getPart(assembly, "featurePanel").bounds,
    mount = getPart(assembly, "mount").bounds,
    tv = getPart(assembly, "tv").bounds;
  const rects: SectionRect[] = [],
    lines: SectionLine[] = [],
    measures: SectionMeasure[] = [];
  const measure = (label: string, mm: number, field?: FieldId) =>
    measures.push({ label, mm, field });
  const dist = (id: keyof Project["distances"], label: string) =>
    measure(label, d[id].mm, `distance:${id}`);
  const rect = (
    id: string,
    label: string,
    b: Bounds,
    color: string,
    elevation = false,
    outline = false,
  ) => {
    if (b.width > 0 && b.height > 0 && b.depth >= 0)
      rects.push({
        id,
        label,
        x: elevation ? b.x : b.z,
        y: b.y,
        width: elevation ? b.width : b.depth,
        height: b.height,
        color,
        outline,
      });
  };
  const cross = (
    id: string,
    x: number,
    y: number,
    color: string,
    label: string,
  ) =>
    lines.push({
      id,
      label,
      color,
      points: [
        [x - 10, y],
        [x + 10, y],
        [x, y],
        [x, y - 10],
        [x, y + 10],
      ],
    });
  if (view === "rails") {
    c.rails.forEach((b, i) =>
      rect(`rail-${i}`, "TV-side rail", b, "#525d58", true),
    );
    rect("tv-outline", "TV silhouette", tv, "#85967b", true, true);
    const x = d.wallWidth.mm / 2;
    lines.push({
      id: "hook-line",
      label: "Hook contact line",
      points: [
        [x - d.tvMountHoleSpacingX.mm / 2 - 35, m.hook],
        [x + d.tvMountHoleSpacingX.mm / 2 + 35, m.hook],
      ],
      color: "#b77b37",
      dashed: true,
    });
    [-0.5, 0.5].forEach((side, i) =>
      [m.upperTvHole, m.upperTvHole - d.tvMountHoleSpacingY.mm].forEach(
        (y, j) =>
          cross(
            `tv-bolt-${i}-${j}`,
            x + side * d.tvMountHoleSpacingX.mm,
            y,
            "#3c6e70",
            "TV mounting-hole center",
          ),
      ),
    );
    measure("TV top above floor", m.tvTop, "distance:tvCenterHeight");
    measure(
      "Upper TV mounting hole",
      m.upperTvHole,
      "distance:tvTopToMountHole",
    );
    measure("Selected rail shift", m.railShift, "railPositions");
    measure("Hook contact line above floor", m.hook, "railPositions");
    measure("Hook below TV top · derived", m.tvTopToHook, "railPositions");
    measure(
      "Hook above TV bottom · derived",
      m.tvBottomToHook,
      "railPositions",
    );
    measure("Rail top above floor", m.railTop, "distance:railAboveHook");
    measure("Rail bottom above floor", m.railBottom, "distance:railBelowHook");
    measure("TV bottom above floor", m.tvBottom, "distance:tvCenterHeight");
    return {
      title: "TV & rail position",
      description:
        "The TV is an outline. Its mounting-hole centers stay fixed while the chosen rail setting shifts the rails and hook contact line. Rail ends outside the outline would be visible from the front. Rail profile width/thickness remains illustrative.",
      axis: "Front view · vertical = height above floor",
      cutX: null,
      rects,
      lines,
      measures,
      extent: {
        left: Math.min(tv.x, ...c.rails.map((b) => b.x)) - 80,
        right:
          Math.max(tv.x + tv.width, ...c.rails.map((b) => b.x + b.width)) + 80,
        bottom: Math.min(m.tvBottom, m.railBottom) - 80,
        top: Math.max(m.tvTop, m.railTop) + 80,
      },
    };
  }
  if (view === "framing") {
    c.studs.forEach((b, i) => rect(`stud-${i}`, "Stud", b, wood, true));
    c.blocking.forEach((b, i) =>
      rect(`block-${i}`, "Blocking", b, block, true),
    );
    c.electrical.forEach((p) => {
      const color = p.kind === "power" ? "#ae916d" : "#7c9aa0";
      rect(`opening-${p.id}`, `${p.label} opening`, p.opening, color, true);
      rect(`plate-${p.id}`, `${p.label} plate`, p.plate, color, true, true);
    });
    rect(
      "mount",
      "Wall plate",
      { ...mount, depth: d.mountPlateThickness.mm },
      "#35423e",
      true,
      true,
    );
    rect("panel", "Panel perimeter", panel, "#677660", true, true);
    c.routes.forEach((route, i) =>
      lines.push({
        id: `route-${i}`,
        label: i ? "Low-voltage route" : "Power route",
        points: route.map((p) => [p[0], p[1]]),
        color: i ? "#527e8a" : "#b77b37",
      }),
    );
    c.lagPaths.forEach((lag, i) =>
      cross(
        `lag-${i}`,
        lag.start[0],
        lag.start[1],
        "#344c38",
        "Proposed wall-plate lag",
      ),
    );
    c.routeCrossings.forEach((hit, i) =>
      cross(
        `crossing-${i}`,
        hit.center[0],
        hit.center[1],
        "#bb674f",
        `Unresolved ${hit.kind} passage through ${hit.memberLabel}`,
      ),
    );
    lines.push({
      id: "wall-outline",
      label: "Vaulted wall boundary",
      points: [[0, 0], ...assembly.wallProfile, [d.wallWidth.mm, 0], [0, 0]],
      color: "#86967b",
    });
    measure("Hook contact line above floor", m.hook, "railPositions");
    measure(
      "Wall plate top above floor",
      m.plateTop,
      "distance:hookAbovePlateTop",
    );
    measure("Upper lag row above floor", m.lagHigh, "distance:lagTopRowInset");
    measure(
      "Lower lag row above floor",
      m.lagLow,
      "distance:lagBottomRowInset",
    );
    measure(
      "Blocking bottom above floor",
      m.blockingBottom,
      project.blockingPlacement === "follow-mount"
        ? "distance:blockingHeight"
        : "distance:blockingBottom",
    );
    measure("Blocking top above floor", m.blockingTop);
    dist("blockingHeight", "Blocking height");
    dist("blockingWidth", "Blocking coverage zone width");
    c.electrical.forEach((p) =>
      measure(
        `${p.label} plate center above floor`,
        p.plate.y + p.plate.height / 2,
      ),
    );
    project.studs.positions.forEach((x, i) =>
      measure(`Stud ${i + 1} center from left`, x, "studs"),
    );
    return {
      title: "Framing elevation",
      description:
        "Finishes and console removed. Lag crosses use the measured wall-plate hole pattern; red crosses mark unresolved cable passages. Blocking fills complete selected stud bays.",
      axis: "Horizontal = distance from left wall · vertical = height above floor",
      cutX: null,
      rects,
      lines,
      measures,
      extent: {
        left: 0,
        right: d.wallWidth.mm,
        bottom: 0,
        top: Math.max(...assembly.wallProfile.map((p) => p[1])),
      },
    };
  }
  const device = c.electrical.find((p) => p.id === electricalPart)!;
  const cutX =
    view === "mount"
      ? c.lagPaths[0].start[0]
      : view === "electrical"
        ? device.body.x + device.body.width / 2
        : c.supports[2].x + c.supports[2].width / 2;
  const crosses = (b: Bounds) => cutX >= b.x && cutX <= b.x + b.width;
  const bottom =
    view === "edge"
      ? Math.max(panel.y - 80, panel.y + panel.height - 280)
      : view === "electrical"
        ? Math.min(device.plate.y, device.body.y) - 80
        : Math.min(m.blockingBottom, ...m.lagRows) - 80;
  const top =
    view === "edge"
      ? panel.y + panel.height + 80
      : view === "electrical"
        ? Math.max(
            device.plate.y + device.plate.height,
            device.body.y + device.body.height,
            ...(device.location === "upper" ? [mount.y + mount.height] : []),
          ) + 80
        : Math.max(m.hook, m.plateTop, m.blockingTop, ...m.lagRows) + 80;
  const add = (
    id: string,
    label: string,
    b: Bounds,
    color: string,
    outline = false,
  ) => {
    if (!crosses(b)) return;
    const y = Math.max(bottom, b.y),
      end = Math.min(top, b.y + b.height);
    if (end > y)
      rect(id, label, { ...b, y, height: end - y }, color, false, outline);
  };
  const cut = (
    id: string,
    label: string,
    b: Bounds,
    color: string,
    holes: readonly Bounds[],
  ) => {
    const lo = Math.max(bottom, b.y),
      hi = Math.min(top, b.y + b.height);
    if (hi <= lo) return;
    const intervals = holes
      .filter(crosses)
      .map((h) => [Math.max(lo, h.y), Math.min(hi, h.y + h.height)] as const)
      .filter(([a, z]) => z > a)
      .sort((a, z) => a[0] - z[0]);
    let cursor = lo;
    for (const [a, z] of [...intervals, [hi, hi] as const]) {
      if (a > cursor)
        add(
          `${id}-${cursor}`,
          label,
          { ...b, y: cursor, height: a - cursor },
          color,
        );
      cursor = Math.max(cursor, z);
    }
  };
  c.studs.forEach((b, i) => add(`stud-${i}`, "Stud", b, wood));
  c.blocking.forEach((b, i) => add(`block-${i}`, "Blocking", b, block));
  cut(
    "drywall",
    "Drywall",
    getPart(assembly, "drywall").bounds,
    wall,
    c.openings,
  );
  cut("slats", "Slatted finish", getPart(assembly, "slats").bounds, "#ba9669", [
    ...c.supports,
    ...c.openings,
  ]);
  c.supports.forEach((b, i) => add(`spacer-${i}`, "Spacer", b, spacer));
  cut(
    "panel",
    "Flat panel",
    panel,
    panelColor,
    c.electrical.filter((p) => p.location === "upper").map((p) => p.opening),
  );
  if (view !== "edge")
    add(
      "mount",
      "Mount wall plate",
      { ...mount, depth: d.mountPlateThickness.mm },
      "#35423e",
    );
  c.electrical.forEach((p) => {
    add(
      `body-${p.id}`,
      `${p.label} body`,
      p.body,
      p.kind === "power" ? "#ae916d" : "#7c9aa0",
    );
    if (p.reach)
      add(
        `reach-${p.id}`,
        "Reserved access / connection path",
        p.reach,
        "#81937a",
        true,
      );
    add(`plate-${p.id}`, `${p.label} plate`, p.plate, panelColor);
  });
  c.lagPaths
    .filter((l) => Math.abs(l.start[0] - cutX) < 0.1)
    .forEach((l, i) =>
      lines.push({
        id: `lag-${i}`,
        label: "Proposed lag path",
        points: [
          [l.start[2], l.start[1]],
          [l.end[2], l.end[1]],
        ],
        color: "#334c38",
        dashed: true,
      }),
    );
  const cavityBack = -d.drywallThickness.mm - d.studDepth.mm;
  lines.push({
    id: "cavity-back",
    label: "Back of modeled cavity",
    points: [
      [cavityBack, bottom],
      [cavityBack, top],
    ],
    color: "#9da396",
    dashed: true,
  });
  dist("drywallThickness", "Drywall thickness");
  measure(
    "Slatted finish thickness",
    project.products.slats.depth.mm,
    "product:slats:depth",
  );
  dist("panelRearGap", "Slat face → panel rear");
  measure("Spacer total depth", panel.z);
  measure("Flat panel thickness", panel.depth, "product:featurePanel:depth");
  if (view === "mount") {
    measure("Hook contact line above floor", m.hook, "railPositions");
    measure(
      "Wall plate top above floor",
      m.plateTop,
      "distance:hookAbovePlateTop",
    );
    measure("Upper lag row above floor", m.lagHigh, "distance:lagTopRowInset");
    measure(
      "Lower lag row above floor",
      m.lagLow,
      "distance:lagBottomRowInset",
    );
    measure(
      "Blocking bottom above floor",
      m.blockingBottom,
      project.blockingPlacement === "follow-mount"
        ? "distance:blockingHeight"
        : "distance:blockingBottom",
    );
    measure("Blocking top above floor", m.blockingTop);
    dist("blockingDepth", "Blocking depth");
    dist("lagEmbedment", "Proposed lag embedment");
  }
  if (view === "electrical") {
    const spec = project.electricalParts[device.id];
    (
      [
        "bodyWidth",
        "bodyHeight",
        "bodyDepth",
        "openingWidth",
        "openingHeight",
        "plateWidth",
        "plateHeight",
        "plateDepth",
      ] as const
    ).forEach((id) =>
      measure(
        id.startsWith("body")
          ? `Box ${id.slice(4).toLowerCase()}`
          : id.startsWith("opening")
            ? `Required opening ${id.slice(7).toLowerCase()}`
            : `Plate ${id.slice(5).toLowerCase()}`,
        spec[id].mm,
        `electrical:${device.id}:${id}`,
      ),
    );
    measure("Box front from drywall", device.body.z + device.body.depth);
    measure("Box-to-plate reach · unresolved", device.reach?.depth ?? 0);
    dist("routeDepth", "Proposed route behind drywall back");
  }
  return {
    title:
      view === "mount"
        ? "Mount lag section"
        : view === "electrical"
          ? `${device.label} section`
          : "Panel upper edge section",
    description:
      view === "mount"
        ? "Vertical cut through a lag column. Hook and plate heights follow the selected TV rail setting; blocking follows the rows unless its floor height is set manually."
        : view === "electrical"
          ? "Actual-size box body and plate are separate. The dashed access path reserves reach through the finish stack; extension / connection hardware is not supplied by this drawing."
          : "Close-up through the left perimeter spacer near the panel top. The spacer bears on drywall; the slatted finish stops around it.",
    axis: "Horizontal = depth (room to the right) · vertical = height above floor",
    cutX,
    rects,
    lines,
    measures,
    extent: {
      left:
        Math.min(
          cavityBack,
          ...rects.map((r) => r.x),
          ...lines.flatMap((l) => l.points.map((p) => p[0])),
        ) - 20,
      right:
        Math.max(
          panel.z + panel.depth + 25,
          ...rects.map((r) => r.x + r.width),
          ...lines.flatMap((l) => l.points.map((p) => p[0])),
        ) + 20,
      bottom,
      top,
    },
  };
}
