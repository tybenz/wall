import type { Project, FieldId } from "../designer/DesignerTypes";
import { getPart, type Assembly, type Bounds } from "../geometry/AssemblyTypes";
export const constructionViews = [
  { id: "framing", label: "Framing elevation" },
  { id: "mount", label: "Mount section" },
  { id: "electrical", label: "Electrical section" },
  { id: "edge", label: "Panel edge" },
] as const;
export type ConstructionView = (typeof constructionViews)[number]["id"];
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
  panelColor = "#fffef8",
  boxColor = "#7c9aa0";
export function resolveConstructionSection(
  project: Project,
  assembly: Assembly,
  view: ConstructionView,
): ConstructionSection {
  const d = project.distances,
    c = assembly.construction;
  const panel = getPart(assembly, "featurePanel").bounds,
    mount = getPart(assembly, "mount").bounds;
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
  ) =>
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
  if (view === "framing") {
    c.studs.forEach((b, i) => rect(`stud-${i}`, "Stud", b, wood, true));
    c.blocking.forEach((b, i) =>
      rect(`block-${i}`, "Blocking", b, block, true),
    );
    c.boxes.forEach((b, i) =>
      rect(
        `box-${i}`,
        i ? "Lower rough opening" : "Upper rough opening",
        b,
        boxColor,
        true,
      ),
    );
    c.plates.forEach((b, i) =>
      rect(
        `plate-${i}`,
        i ? "Lower plates" : "Upper plates",
        b,
        boxColor,
        true,
        true,
      ),
    );
    rect(
      "mount",
      "Mount wall plate",
      { ...mount, depth: 6 },
      "#35423e",
      true,
      true,
    );
    rect("panel", "Panel perimeter", panel, "#677660", true, true);
    c.routes.forEach((route, i) =>
      lines.push({
        id: `route-${i}`,
        points: route.map((p) => [p[0], p[1]]),
        color: i ? "#527e8a" : "#b77b37",
      }),
    );
    c.lagPaths.forEach((lag, i) => {
      const [x, y] = lag.start;
      lines.push({
        id: `lag-${i}`,
        points: [
          [x - 12, y],
          [x + 12, y],
          [x, y],
          [x, y - 12],
          [x, y + 12],
        ],
        color: "#344c38",
      });
    });
    lines.push({
      id: "wall-outline",
      points: [[0, 0], ...assembly.wallProfile, [d.wallWidth.mm, 0], [0, 0]],
      color: "#86967b",
    });
    dist("powerRouteOffsetX", "Power route from wall center");
    dist("signalRouteOffsetX", "Low-voltage route from wall center");
    dist("studWidth", "Stud face width");
    dist("wallWidth", "Wall width");
    dist("blockingBottom", "Blocking bottom above floor");
    dist("blockingHeight", "Blocking height");
    dist("blockingWidth", "Blocking zone width");
    measure(
      "Upper plates center above floor",
      c.plates[0].y + c.plates[0].height / 2,
    );
    dist("lowerBoxHeight", "Lower plates center above floor");
    dist("upperBoxGap", "Bracket bottom → upper plates top");
    measure(
      "Upper plates center from left wall",
      c.plates[0].x + c.plates[0].width / 2,
    );
    measure(
      "Lower plates center from left wall",
      c.plates[1].x + c.plates[1].width / 2,
      "distance:electricalOffsetX",
    );
    project.studs.positions.forEach((x, i) =>
      measure(`Stud ${i + 1} center from left`, x, "studs"),
    );
    return {
      title: "Framing elevation",
      description:
        "Looking straight at the wall with finishes and console removed. Crosses mark proposed lag locations; outlines show plate, mount and panel limits.",
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
  const cutX =
    view === "mount"
      ? c.lagPaths[0].start[0]
      : view === "electrical"
        ? c.boxes[0].x + c.boxes[0].width / 2
        : c.supports[2].x + c.supports[2].width / 2;
  const crosses = (b: Bounds) => cutX >= b.x && cutX <= b.x + b.width;
  const bottom =
    view === "edge"
      ? panel.y - 80
      : Math.min(d.blockingBottom.mm, c.plates[0].y) - 80;
  const top =
    view === "edge"
      ? panel.y + panel.height + 80
      : Math.max(
          mount.y + mount.height,
          d.blockingBottom.mm + d.blockingHeight.mm,
        ) + 80;
  const add = (id: string, label: string, b: Bounds, color: string) => {
    if (!crosses(b)) return;
    const y = Math.max(bottom, b.y),
      end = Math.min(top, b.y + b.height);
    if (end > y) rect(id, label, { ...b, y, height: end - y }, color);
  };
  c.studs.forEach((b, i) => add(`stud-${i}`, "Stud", b, wood));
  c.blocking.forEach((b, i) => add(`block-${i}`, "Blocking", b, block));
  add("drywall", "Drywall", getPart(assembly, "drywall").bounds, wall);
  // Resolve the finish as separate strips where spacers or rough openings interrupt it.
  const cuts = [...c.supports, ...c.boxes]
    .filter(crosses)
    .map((b) => [Math.max(bottom, b.y), Math.min(top, b.y + b.height)] as const)
    .filter(([a, b]) => b > a)
    .sort((a, b) => a[0] - b[0]);
  let cursor = bottom;
  for (const [a, b] of [...cuts, [top, top] as const]) {
    if (a > cursor)
      add(
        `slat-${cursor}`,
        "Slatted finish",
        { ...getPart(assembly, "slats").bounds, y: cursor, height: a - cursor },
        "#ba9669",
      );
    cursor = Math.max(cursor, b);
  }
  c.supports.forEach((b, i) => add(`spacer-${i}`, "Spacer", b, spacer));
  // Panel is also interrupted by the actual upper rough opening.
  const holes = c.boxes.slice(0, 1).filter(crosses);
  let panelCursor = panel.y;
  for (const hole of [
    ...holes,
    { ...panel, y: panel.y + panel.height, height: 0 },
  ]) {
    if (hole.y > panelCursor)
      add(
        `panel-${panelCursor}`,
        "Flat panel",
        {
          ...panel,
          y: panelCursor,
          height: Math.min(hole.y, panel.y + panel.height) - panelCursor,
        },
        panelColor,
      );
    panelCursor = Math.max(panelCursor, hole.y + hole.height);
  }
  if (view !== "edge")
    add("mount", "Mount wall plate", { ...mount, depth: 6 }, "#35423e");
  c.boxes.forEach((b, i) => add(`box-${i}`, "Electrical box", b, boxColor));
  c.plates.forEach((b, i) => add(`plate-${i}`, "Plate", b, panelColor));
  c.lagPaths
    .filter((l) => Math.abs(l.start[0] - cutX) < 0.1)
    .forEach((l, i) =>
      lines.push({
        id: `lag-${i}`,
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
  measure("Spacer total depth (drywall → panel rear)", panel.z);
  measure("Flat panel thickness", panel.depth, "product:featurePanel:depth");
  if (view === "mount") {
    dist("blockingDepth", "Blocking depth");
    dist("lagEmbedment", "Proposed lag embedment");
    dist("lagRowSpacing", "Lag row spacing");
    measure(
      "Proposed path through layers + embedment",
      c.lagPaths[0].start[2] - c.lagPaths[0].end[2],
    );
  }
  if (view === "electrical") {
    dist("boxWidth", "Rough opening width");
    dist("boxHeight", "Rough opening height");
    dist("boxDepth", "Box depth behind drywall");
    dist("plateWidth", "Plate group width");
    dist("plateHeight", "Plate group height");
    dist("routeDepth", "Route plane behind drywall");
  }
  return {
    title:
      view === "mount"
        ? "Mount lag section"
        : view === "electrical"
          ? "Upper electrical section"
          : "Panel edge section",
    description:
      view === "mount"
        ? "Vertical cut through the left proposed lag column. Dashed paths run through panel, spacer and drywall into blocking; actual fastener geometry remains to be measured."
        : view === "electrical"
          ? "Vertical cut through the upper box center. The plate sits at the panel face; the box extends through the finish stack into the cavity."
          : "Vertical cut through the left perimeter spacer. The slatted finish is interrupted where the spacer bears directly on drywall.",
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
