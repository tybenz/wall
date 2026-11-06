import { resolveWallProfile, profileCutHeight } from "./WallProfile";
import type { Project } from "../designer/DesignerTypes";
import { intersects, type Construction, type Finding } from "./AssemblyTypes";
export { segmentCrossesBox } from "./SegmentIntersections";
export function constructionFindings(
  project: Project,
  c: Construction,
): Finding[] {
  const d = project.distances,
    result: Finding[] = [];
  const profile = resolveWallProfile(project);
  const warn = (code: string, message: string) =>
    result.push({ code, message, severity: "warning" });
  if (d.blockingDepth.mm > d.studDepth.mm)
    warn(
      "blocking-depth",
      "Blocking extends beyond the back of the framing cavity.",
    );
  if (d.lagEmbedment.mm > d.blockingDepth.mm)
    warn("lag-depth", "Proposed lag embedment exceeds blocking depth.");
  if (d.lagTopRowInset.mm >= d.lagBottomRowInset.mm)
    warn(
      "lag-row-order",
      "The upper lag row must be closer to the plate top than the lower row.",
    );
  if (d.blockingHeight.mm < c.datums.requiredBlockingHeight)
    warn(
      "blocking-margin",
      "Chosen blocking height does not provide the desired planning margin above and below the lag rows.",
    );
  if (
    c.datums.railTop > c.datums.tvTop + 0.01 ||
    c.datums.railBottom < c.datums.tvBottom - 0.01
  )
    warn(
      "rails-visible",
      "The selected rail position extends beyond the TV silhouette. Choose another rail position or verify rail dimensions.",
    );
  if (d.tvMountHoleSpacingX.mm > project.products.tv.width.mm)
    warn(
      "tv-hole-width",
      "TV mounting-hole spacing exceeds the housing width.",
    );
  if (
    c.blocking.some(
      (b) =>
        b.y < 0 ||
        b.y + b.height > profileCutHeight(profile, b.x, b.x + b.width),
    )
  )
    warn(
      "blocking-outside",
      "The proposed blocking extends outside the wall elevation.",
    );
  if (
    c.datums.upperTvHole > c.datums.tvTop ||
    c.datums.upperTvHole - d.tvMountHoleSpacingY.mm < c.datums.tvBottom
  )
    warn(
      "tv-holes-outside",
      "TV mounting-hole coordinates extend outside its housing.",
    );
  if (
    c.datums.upperTvHole > c.datums.railTop ||
    c.datums.upperTvHole - d.tvMountHoleSpacingY.mm < c.datums.railBottom
  )
    warn(
      "rail-bolt-fit",
      "The selected rail position does not span both rows of TV mounting holes.",
    );
  for (const device of c.electrical) {
    const { body, opening, plate } = device;
    const panelLeft = (d.wallWidth.mm - d.panelWidth.mm) / 2,
      panelBottom = d.tvCenterHeight.mm - d.panelHeight.mm / 2;
    if (
      device.location === "upper" &&
      (opening.x < panelLeft ||
        opening.y < panelBottom ||
        opening.x + opening.width > panelLeft + d.panelWidth.mm ||
        opening.y + opening.height > panelBottom + d.panelHeight.mm)
    )
      warn(
        `panel-opening-${device.id}`,
        `${device.label} required opening extends outside the flat panel.`,
      );
    if (
      opening.x < 0 ||
      opening.y < 0 ||
      opening.x + opening.width > d.wallWidth.mm ||
      opening.y + opening.height >
        profileCutHeight(
          profile,
          Math.max(0, opening.x),
          Math.min(d.wallWidth.mm, opening.x + opening.width),
        )
    )
      warn(
        `electrical-opening-${device.id}`,
        `${device.label} required opening extends outside the wall.`,
      );
    const framing = [...c.studs, ...c.blocking];
    if (
      !framing.some((b) => intersects(body, b)) &&
      framing.some((b) =>
        intersects(
          { ...opening, z: opening.z - 1, depth: opening.depth + 1 },
          b,
        ),
      )
    )
      warn(
        `opening-framing-${device.id}`,
        `${device.label} rough opening crosses a framing face.`,
      );
    if (body.z < -d.drywallThickness.mm - d.studDepth.mm - 0.01)
      warn(
        `box-depth-${device.id}`,
        `${device.label} box extends beyond the modeled cavity back.`,
      );
    if (body.z >= -d.drywallThickness.mm)
      warn(
        `box-cavity-${device.id}`,
        `${device.label} box does not reach the modeled cavity from its selected mounting plane.`,
      );
    if (opening.width >= plate.width || opening.height >= plate.height)
      warn(
        `plate-coverage-${device.id}`,
        `${device.label} plate does not cover the required opening on all edges.`,
      );
    if (body.width > opening.width || body.height > opening.height)
      warn(
        `box-opening-${device.id}`,
        `${device.label} box body is larger than its specified rough opening.`,
      );
    if (c.supports.some((s) => intersects(opening, s)))
      warn(
        `box-spacer-${device.id}`,
        `${device.label} opening overlaps a panel spacer.`,
      );
    if (device.reach)
      result.push({
        code: `electrical-reach-${device.id}`,
        severity: "info",
        message: `${device.label}: the gap between box front and plate is a reserved access path. Extension / connection hardware is not yet specified.`,
      });
  }
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
    warn(
      "lag-misses-spacer",
      "A proposed lag path misses its mount spacer; spacer layout and measured hole pattern are independent.",
    );
  return result;
}
