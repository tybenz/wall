import { resolveMountDatums } from "./MountDatums";
import { constructionFindings } from "./ConstructionFindings";
import { resolveCradle } from "./ResolveCradle";
import { resolveWallProfile, profileCutHeight } from "./WallProfile";
import type { Project } from "../designer/DesignerTypes";
import { resolveConstruction } from "./ResolveConstruction";
import {
  intersects,
  type Assembly,
  type AssemblyPart,
  type Bounds,
} from "./AssemblyTypes";
export function resolveAssembly(project: Project): Assembly {
  const { distances: d, products: p } = project;
  const w = d.wallWidth.mm,
    h = Math.max(d.wallHeight.mm, d.wallLeftHeight.mm, d.wallRightHeight.mm),
    cx = w / 2,
    cy = d.tvCenterHeight.mm;
  const wallProfile = resolveWallProfile(project);
  const slatFront = p.slats.depth.mm,
    panelRear = slatFront + d.panelRearGap.mm,
    panelFront = panelRear + p.featurePanel.depth.mm;
  const tvRear = panelFront + d.tvRearGap.mm,
    tvFront = tvRear + p.tv.depth.mm;
  const tvBottom = cy - p.tv.height.mm / 2;
  const part = (
    id: AssemblyPart["id"],
    label: string,
    bounds: Bounds,
  ): AssemblyPart => ({ id, label, bounds, provisional: true });
  const panel = {
    x: cx - d.panelWidth.mm / 2,
    y: cy - d.panelHeight.mm / 2,
    z: panelRear,
    width: d.panelWidth.mm,
    height: d.panelHeight.mm,
    depth: p.featurePanel.depth.mm,
  };
  const datums = resolveMountDatums(project);
  const mount = {
    x: cx - d.mountWidth.mm / 2,
    y: datums.plateBottom,
    z: panelFront,
    width: d.mountWidth.mm,
    height: d.mountHeight.mm,
    depth: Math.max(5, tvRear - panelFront),
  };
  const construction = resolveConstruction(project, panel, mount);
  const vertical = project.soundbarOrientation === "vertical";
  const barHeight = vertical ? p.soundbar.depth.mm : p.soundbar.height.mm;
  const barDepth = vertical ? p.soundbar.height.mm : p.soundbar.depth.mm;
  const parts: AssemblyPart[] = [
    part("beam", "Faux ceiling beam", {
      x: wallProfile[1][0],
      y: wallProfile[2][1],
      z: 0,
      width: wallProfile[3][0] - wallProfile[2][0],
      height: wallProfile[1][1] - wallProfile[2][1],
      depth: d.beamProjection.mm,
    }),
    part("studZone", "Framing zone", {
      x: 0,
      y: 0,
      z: -d.drywallThickness.mm - d.studDepth.mm,
      width: w,
      height: h,
      depth: d.studDepth.mm,
    }),
    {
      ...part("drywall", "Existing drywall", {
        x: 0,
        y: 0,
        z: -d.drywallThickness.mm,
        width: w,
        height: h,
        depth: d.drywallThickness.mm,
      }),
      topProfile: wallProfile,
      openings: construction.openings,
    },
    {
      ...part("slats", "Fluted wall finish", {
        x: 0,
        y: 0,
        z: 0,
        width: w,
        height: h,
        depth: p.slats.depth.mm,
      }),
      topProfile: wallProfile,
      openings: [...construction.supports, ...construction.openings],
    },
    {
      ...part("featurePanel", "White feature panel", panel),
      openings: construction.electrical
        .filter((p) => p.location === "upper")
        .map((p) => p.opening),
    },
    part("tv", "TV envelope", {
      x: cx - p.tv.width.mm / 2,
      y: tvBottom,
      z: tvRear,
      width: p.tv.width.mm,
      height: p.tv.height.mm,
      depth: p.tv.depth.mm,
    }),
    part("soundbar", "Soundbar", {
      x: cx - p.soundbar.width.mm / 2,
      y: tvBottom - d.soundbarGap.mm - barHeight,
      z: tvFront + d.soundbarOffsetZ.mm - barDepth,
      width: p.soundbar.width.mm,
      height: barHeight,
      depth: barDepth,
    }),
    part("console", "Freestanding console", {
      x: w / 2 - p.console.width.mm / 2,
      y: 0,
      z: slatFront + d.consoleWallGap.mm,
      width: p.console.width.mm,
      height: p.console.height.mm,
      depth: p.console.depth.mm,
    }),
    part("mount", "Mount envelope", mount),
  ];
  const cradle = resolveCradle(
    parts.find((part) => part.id === "soundbar")!.bounds,
    parts.find((part) => part.id === "tv")!.bounds,
    mount,
    d.cradleThickness.mm,
  );
  parts.push(part("cradle", "Soundbar cradle", cradle.bounds));
  const resolvedConstruction = { ...construction, cradle: cradle.members };
  const panels = Math.ceil(w / p.slats.width.mm),
    cartons = Math.ceil(panels / 2);
  const findings: Assembly["findings"][number][] = [
    {
      code: "unresolved-mount",
      severity: "info",
      message:
        "Framing, mount, supports, boxes and cable routes are schematic placeholders. No bolt schedule or structural approval is implied.",
    },
    {
      code: "nominal-coverage",
      severity: "info",
      message: `${panels} panels needed by nominal width; ${cartons} cartons supply ${cartons * 2}. Overlap and waste are excluded.`,
    },
  ];
  const warn = (code: string, message: string) =>
    findings.push({ code, message, severity: "warning" });
  if (
    d.beamWidth.mm >= w ||
    Math.abs(d.beamOffsetX.mm) + d.beamWidth.mm / 2 >= w / 2
  )
    warn(
      "beam-outside",
      "Beam position or width exceeds the wall; preview is constrained to the wall edges.",
    );
  if (d.beamDrop.mm >= d.wallHeight.mm)
    warn(
      "beam-drop",
      "Beam side height reaches the floor; verify the ceiling and beam dimensions.",
    );
  if (h > p.slats.height.mm)
    warn("short-slats", "Wall height exceeds the selected panel stock.");
  if (
    Math.max(panel.width, panel.height) > p.featurePanel.height.mm ||
    Math.min(panel.width, panel.height) > p.featurePanel.width.mm
  )
    warn(
      "panel-stock",
      "White panel cut does not fit the stock in either orientation.",
    );
  for (const item of parts.filter(
    (item) => !["beam", "studZone", "drywall", "slats"].includes(item.id),
  )) {
    const b = item.bounds;
    if (
      b.x < 0 ||
      b.y < 0 ||
      b.x + b.width > w ||
      b.y + b.height >
        profileCutHeight(
          wallProfile,
          Math.max(0, b.x),
          Math.min(w, b.x + b.width),
        )
    )
      warn(
        `outside-${item.id}`,
        `${item.label} extends outside the wall elevation.`,
      );
  }
  const bar = parts.find((part) => part.id === "soundbar")!.bounds;
  if (cradle.members.some((member) => intersects(panel, member)))
    warn(
      "cradle-panel-overlap",
      "The illustrative cradle intersects the flat panel; adjust forward offset or TV rear gap.",
    );
  if (intersects(panel, bar))
    warn(
      "soundbar-panel-overlap",
      "Soundbar envelope intersects the white panel. Adjust forward offset or gap after verifying the cradle.",
    );
  if (intersects(parts.find((part) => part.id === "console")!.bounds, bar))
    warn(
      "soundbar-console-overlap",
      "Soundbar envelope intersects the console.",
    );
  if (
    construction.supports.some(
      (b) =>
        b.x < panel.x ||
        b.y < panel.y ||
        b.x + b.width > panel.x + panel.width ||
        b.y + b.height > panel.y + panel.height,
    )
  )
    warn(
      "spacer-outside-panel",
      "A spacer extends beyond the flat panel; adjust panel size, offsets, spacer spacing or inset.",
    );
  if (d.supportSpacing.mm < d.supportWidth.mm)
    warn(
      "spacer-overlap",
      "Mount spacers overlap; their center spacing is smaller than their face width.",
    );
  const containsPoint = (b: Bounds, x: number, y: number, z: number) =>
    x >= b.x &&
    x <= b.x + b.width &&
    y >= b.y &&
    y <= b.y + b.height &&
    z >= b.z &&
    z <= b.z + b.depth;
  if (
    construction.lagPaths.some(
      ({ start: [x, y], end: [, , z] }) =>
        !construction.blocking.some((b) => containsPoint(b, x, y, z)),
    )
  )
    warn(
      "lag-misses-blocking",
      "A schematic mount lag path misses the blocking behind drywall; adjust blocking position or extent.",
    );
  if (
    construction.lagPaths.some(
      ({ start: [x, y] }) =>
        x < mount.x - 0.01 ||
        x > mount.x + mount.width + 0.01 ||
        y < mount.y - 0.01 ||
        y > mount.y + mount.height + 0.01,
    )
  )
    warn(
      "lag-outside-mount",
      "The mount plate envelope does not span the proposed lag paths. Verify the actual plate and hole locations.",
    );
  if (
    construction.boxes.some(
      (box) =>
        construction.studs.some((stud) => intersects(box, stud)) ||
        construction.blocking.some((board) => intersects(box, board)),
    )
  )
    warn(
      "electrical-framing",
      "A proposed electrical box intersects framing or blocking. Move it to a clear bay.",
    );
  if (
    construction.boxes.some(
      (box) =>
        box.x < 0 ||
        box.x + box.width > w ||
        box.y < 0 ||
        box.y + box.height >
          profileCutHeight(
            wallProfile,
            Math.max(0, box.x),
            Math.min(w, box.x + box.width),
          ),
    )
  )
    warn(
      "electrical-outside",
      "A proposed electrical box extends outside the wall.",
    );
  if (project.studs.positions.some((x) => x > w))
    warn(
      "stud-outside",
      "Some entered stud positions lie beyond the wall width and are not drawn.",
    );
  if (!project.studs.confirmed)
    findings.push({
      code: "unmeasured-studs",
      severity: "info",
      message:
        "Stud positions are provisional. Enter measured offsets from the left wall edge in Wall & framing.",
    });
  findings.push(...constructionFindings(project, resolvedConstruction));
  return {
    parts,
    wallProfile,
    construction: resolvedConstruction,
    depth: { slatFront, panelRear, panelFront, tvRear, tvFront },
    coverage: { panels, cartons, nominalWidth: cartons * 2 * p.slats.width.mm },
    findings,
  };
}
