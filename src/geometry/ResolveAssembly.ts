import type { Project } from "../designer/DesignerTypes";
import type { Assembly, AssemblyPart, Bounds } from "./AssemblyTypes";

/** X from wall left, Y above floor, Z out from existing drywall front. */
export function resolveAssembly(project: Project): Assembly {
  const { distances: d, products: p } = project;
  const wallWidth = d.wallWidth.mm;
  const wallHeight = d.wallHeight.mm;
  const slatFront = p.slats.depth.mm;
  const panelRear = slatFront + d.panelRearGap.mm;
  const panelFront = panelRear + p.featurePanel.depth.mm;
  const tvRear = panelFront + d.tvRearGap.mm;
  const tvFront = tvRear + p.tv.depth.mm;
  const centeredX = (width: number) => (wallWidth - width) / 2;
  const tvBottom = d.tvCenterHeight.mm - p.tv.height.mm / 2;
  const part = (
    id: AssemblyPart["id"],
    label: string,
    bounds: Bounds,
  ): AssemblyPart => ({ id, label, bounds, provisional: true });
  const parts: AssemblyPart[] = [
    part("studZone", "Framing zone (unmeasured)", {
      x: 0,
      y: 0,
      z: -d.drywallThickness.mm - d.studDepth.mm,
      width: wallWidth,
      height: wallHeight,
      depth: d.studDepth.mm,
    }),
    part("drywall", "Existing drywall", {
      x: 0,
      y: 0,
      z: -d.drywallThickness.mm,
      width: wallWidth,
      height: wallHeight,
      depth: d.drywallThickness.mm,
    }),
    part("slats", "Fluted wall finish", {
      x: 0,
      y: 0,
      z: 0,
      width: wallWidth,
      height: wallHeight,
      depth: p.slats.depth.mm,
    }),
    part("featurePanel", "White feature panel", {
      x: centeredX(d.panelWidth.mm),
      y: d.tvCenterHeight.mm - d.panelHeight.mm / 2,
      z: panelRear,
      width: d.panelWidth.mm,
      height: d.panelHeight.mm,
      depth: p.featurePanel.depth.mm,
    }),
    part("tv", "TV envelope", {
      x: centeredX(p.tv.width.mm),
      y: tvBottom,
      z: tvRear,
      width: p.tv.width.mm,
      height: p.tv.height.mm,
      depth: p.tv.depth.mm,
    }),
    part("soundbar", "Soundbar (flat)", {
      x: centeredX(p.soundbar.width.mm),
      y: tvBottom - d.soundbarGap.mm - p.soundbar.height.mm,
      z: tvFront - p.soundbar.depth.mm,
      width: p.soundbar.width.mm,
      height: p.soundbar.height.mm,
      depth: p.soundbar.depth.mm,
    }),
    part("console", "Freestanding console", {
      x: centeredX(p.console.width.mm),
      y: 0,
      z: slatFront + d.consoleWallGap.mm,
      width: p.console.width.mm,
      height: p.console.height.mm,
      depth: p.console.depth.mm,
    }),
  ];
  const panels = Math.ceil(wallWidth / p.slats.width.mm);
  const cartons = Math.ceil(panels / 2);
  const findings: Assembly["findings"][number][] = [
    {
      code: "unresolved-mount",
      message:
        "Mount, spacer footprints, blocking and electrical geometry need measurements. No bolt or box coordinates are calculated.",
    },
    {
      code: "panel-gap-convention",
      message:
        "Panel projection currently means slat face → panel rear. TV rear gap is an envelope preference, not a mount specification.",
    },
    {
      code: "nominal-coverage",
      message:
        "Panel quantity uses nominal width; overlap, cut layout and waste are not included.",
    },
  ];
  if (wallHeight > p.slats.height.mm)
    findings.push({
      code: "short-slats",
      message: "Wall is taller than the selected panel stock.",
    });
  if (
    Math.max(d.panelWidth.mm, d.panelHeight.mm) > p.featurePanel.height.mm ||
    Math.min(d.panelWidth.mm, d.panelHeight.mm) > p.featurePanel.width.mm
  )
    findings.push({
      code: "panel-stock",
      message:
        "White panel cut does not fit the selected stock in either orientation.",
    });
  for (const item of parts.filter(
    (item) => !["studZone", "drywall", "slats"].includes(item.id),
  )) {
    const b = item.bounds;
    if (
      b.x < 0 ||
      b.x + b.width > wallWidth ||
      b.y < 0 ||
      b.y + b.height > wallHeight
    )
      findings.push({
        code: `outside-${item.id}`,
        message: `${item.label} extends outside the wall elevation.`,
      });
  }
  const panel = parts.find((item) => item.id === "featurePanel")!.bounds;
  const soundbar = parts.find((item) => item.id === "soundbar")!.bounds;
  const overlaps =
    panel.x < soundbar.x + soundbar.width &&
    soundbar.x < panel.x + panel.width &&
    panel.y < soundbar.y + soundbar.height &&
    soundbar.y < panel.y + panel.height &&
    panel.z < soundbar.z + soundbar.depth &&
    soundbar.z < panel.z + panel.depth;
  if (overlaps)
    findings.push({
      code: "soundbar-panel-overlap",
      message:
        "The provisional soundbar envelope intersects the white panel. Its cradle depth/alignment needs adjustment or verification.",
    });
  return {
    parts,
    depth: { slatFront, panelRear, panelFront, tvRear, tvFront },
    coverage: { panels, cartons, nominalWidth: cartons * 2 * p.slats.width.mm },
    findings,
  };
}
