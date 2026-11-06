import type { Project } from "../designer/DesignerTypes";
import { getPart, type Assembly, type Bounds } from "../geometry/AssemblyTypes";
export function resolveConstructionSchedule(
  project: Project,
  assembly: Assembly,
) {
  const c = assembly.construction,
    panel = getPart(assembly, "featurePanel").bounds;
  const pieces = [
    ...c.blocking.map((b, i) => ({
      id: `B${i + 1}`,
      label: `Blocking bay ${i + 1}`,
      bounds: b,
      note: "Clear span between the entered stud faces; no cutting allowance included.",
    })),
    ...c.supports.map((b, i) => ({
      id: `S${i + 1}`,
      label: b.role === "mount" ? "Mount spacer" : "Perimeter spacer",
      bounds: b,
      note: "Required depth to panel rear; stock / lamination method remains to be selected.",
    })),
    {
      id: "P1",
      label: "Flat panel",
      bounds: panel,
      note: "Cut size; stock orientation / fit is checked separately.",
    },
  ];
  const contains = (b: Bounds, x: number, y: number) =>
    x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;
  const lags = c.lagPaths.map((lag, i) => {
    const [x, y] = lag.start,
      blockIndex = c.blocking.findIndex(
        (b) =>
          contains(b, x, y) && lag.end[2] >= b.z && lag.end[2] <= b.z + b.depth,
      );
    const supportIndex = c.supports.findIndex(
      (b) => b.role === "mount" && contains(b, x, y),
    );
    const block = blockIndex < 0 ? null : c.blocking[blockIndex];
    return {
      id: `L${i + 1}`,
      wallX: x,
      floorY: y,
      panelX: x - panel.x,
      panelY: y - panel.y,
      blockingId: block ? `B${blockIndex + 1}` : null,
      blockingX: block ? x - block.x : null,
      blockingY: block ? y - block.y : null,
      spacerId: supportIndex < 0 ? null : `S${supportIndex + 1}`,
      pathLength: lag.start[2] - lag.end[2],
    };
  });
  const openings = c.electrical.flatMap((p) =>
    [
      "Drywall",
      "Slatted finish",
      ...(p.location === "upper" ? ["Flat panel"] : []),
    ].map((layer) => ({
      id: `${p.id}-${layer}`,
      label: p.label,
      layer,
      x: p.opening.x - (layer === "Flat panel" ? panel.x : 0),
      y: p.opening.y - (layer === "Flat panel" ? panel.y : 0),
      width: p.opening.width,
      height: p.opening.height,
      datum:
        layer === "Flat panel"
          ? "Panel lower-left"
          : "Wall left / finished floor",
    })),
  );
  const spacerCutouts = c.supports.map((b, i) => ({
    id: `slat-spacer-${i + 1}`,
    label: `Spacer S${i + 1}`,
    layer: "Slatted finish",
    x: b.x,
    y: b.y,
    width: b.width,
    height: b.height,
    datum: "Wall left / finished floor",
  }));
  return {
    datums: c.datums,
    pieces,
    lags,
    openings: [...openings, ...spacerCutouts],
    passages: c.routeCrossings,
    blockingPlacement: project.blockingPlacement,
  };
}
export type ConstructionSchedule = ReturnType<
  typeof resolveConstructionSchedule
>;
export function scheduleTextRows(
  schedule: ConstructionSchedule,
  fmt: (v: number) => string,
): string[] {
  return [
    "Mount and blocking floor heights",
    ...(
      [
        ["TV top", schedule.datums.tvTop],
        ["Upper TV hole", schedule.datums.upperTvHole],
        ["Hook contact", schedule.datums.hook],
        ["Wall plate top", schedule.datums.plateTop],
        ["Upper lag", schedule.datums.lagHigh],
        ["Lower lag", schedule.datums.lagLow],
        ["Blocking top", schedule.datums.blockingTop],
        ["Blocking bottom", schedule.datums.blockingBottom],
      ] as const
    ).map(([name, value]) => `${name}: ${fmt(value)}`),
    "Cut dimensions: width x height x required depth",
    ...schedule.pieces.map(
      (p) =>
        `${p.id} ${p.label}: ${fmt(p.bounds.width)} x ${fmt(p.bounds.height)} x ${fmt(p.bounds.depth)}. ${p.note}`,
    ),
    "Proposed wall-plate lags: coordinates, not a drill-bit or fastener specification",
    ...schedule.lags.map(
      (l) =>
        `${l.id}: wall X ${fmt(l.wallX)}, floor Y ${fmt(l.floorY)}; panel X/Y ${fmt(l.panelX)} / ${fmt(l.panelY)}; ${l.blockingId ? `${l.blockingId} local X/Y ${fmt(l.blockingX!)} / ${fmt(l.blockingY!)}` : "MISSES BLOCKING"}; ${l.spacerId ?? "MISSES SPACER"}; proposed path ${fmt(l.pathLength)}.`,
    ),
    "Opening / spacer-clearance rectangles: X/Y from named lower-left datum",
    ...schedule.openings.map(
      (o) =>
        `${o.layer}, ${o.label}: X/Y ${fmt(o.x)} / ${fmt(o.y)}; ${fmt(o.width)} x ${fmt(o.height)}; datum: ${o.datum}.`,
    ),
    "Electrical runs are assumed vertical beside a stud; lateral routing and passages are outside this plan.",
    ...(schedule.passages.length
      ? schedule.passages.map(
          (p, i) =>
            `R${i + 1}: ${p.kind} crosses ${p.memberLabel}; wall X ${fmt(p.center[0])}, floor Y ${fmt(p.center[1])}, depth Z ${fmt(p.center[2])}.`,
        )
      : []),
  ];
}
export function exportConstructionScheduleCsv(
  project: Project,
  assembly: Assembly,
  units: "in" | "mm",
): string {
  const schedule = resolveConstructionSchedule(project, assembly),
    n = (v: number) => Number((units === "in" ? v / 25.4 : v).toFixed(3));
  const rows: (string | number)[][] = [
    ["Units", units],
    [
      "Section",
      "Item",
      "X",
      "Y",
      "Width",
      "Height",
      "Depth / path",
      "Datum / note",
    ],
    ...schedule.pieces.map((p) => [
      "Cut",
      `${p.id} ${p.label}`,
      n(p.bounds.x),
      n(p.bounds.y),
      n(p.bounds.width),
      n(p.bounds.height),
      n(p.bounds.depth),
      p.note,
    ]),
    ...schedule.lags.map((l) => [
      "Lag",
      l.id,
      n(l.wallX),
      n(l.floorY),
      "",
      "",
      n(l.pathLength),
      `Wall left / floor; panel ${n(l.panelX)}, ${n(l.panelY)}; blocking ${l.blockingId ?? "MISSED"}; spacer ${l.spacerId ?? "MISSED"}. Hole diameter / fastener unspecified.`,
    ]),
    ...schedule.openings.map((o) => [
      "Opening",
      `${o.layer}: ${o.label}`,
      n(o.x),
      n(o.y),
      n(o.width),
      n(o.height),
      "",
      o.datum,
    ]),
    ...schedule.passages.map((p, i) => [
      "Unresolved passage",
      `R${i + 1} ${p.kind}: ${p.memberLabel}`,
      n(p.center[0]),
      n(p.center[1]),
      "",
      "",
      n(p.center[2]),
      "Unresolved route crossing; no drilling specification.",
    ]),
  ];
  const cell = (value: string | number) => {
    const plain =
      typeof value === "string" && /^[=+@\-\t\r]/.test(value)
        ? `'${value}`
        : String(value);
    return `"${plain.replace(/"/g, '""')}"`;
  };
  return rows.map((row) => row.map(cell).join(",")).join("\r\n");
}
