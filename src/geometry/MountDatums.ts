import type { Project } from "../designer/DesignerTypes";
export function lagRowHeights(
  project: Project,
  plateTop: number,
): readonly [number, number] {
  return [
    plateTop - project.distances.lagTopRowInset.mm,
    plateTop - project.distances.lagBottomRowInset.mm,
  ];
}
export function resolveMountDatums(project: Project) {
  const d = project.distances,
    tvHeight = project.products.tv.height.mm;
  const tvTop = d.tvCenterHeight.mm + tvHeight / 2,
    tvBottom = tvTop - tvHeight;
  const upperTvHole = tvTop - d.tvTopToMountHole.mm;
  const railShift =
    project.mountRailOffsets.positions[project.selectedRailPosition];
  const hook = upperTvHole + d.railReferenceHoleBelowHook.mm + railShift,
    plateTop = hook - d.hookAbovePlateTop.mm,
    plateBottom = plateTop - d.mountHeight.mm;
  const railTop = hook + d.railAboveHook.mm,
    railBottom = hook - d.railBelowHook.mm;
  const lagRows = lagRowHeights(project, plateTop),
    lagLow = Math.min(...lagRows),
    lagHigh = Math.max(...lagRows);
  const blockingBottom =
    project.blockingPlacement === "follow-mount"
      ? (lagLow + lagHigh - d.blockingHeight.mm) / 2
      : d.blockingBottom.mm;
  return {
    tvTop,
    tvBottom,
    upperTvHole,
    railShift,
    railTop,
    railBottom,
    hook,
    tvTopToHook: tvTop - hook,
    tvBottomToHook: hook - tvBottom,
    plateTop,
    plateBottom,
    lagRows,
    lagLow,
    lagHigh,
    blockingBottom,
    blockingTop: blockingBottom + d.blockingHeight.mm,
    targetBlockingBottom: lagLow - d.blockingLagMargin.mm,
    targetBlockingTop: lagHigh + d.blockingLagMargin.mm,
    requiredBlockingHeight: lagHigh - lagLow + 2 * d.blockingLagMargin.mm,
  };
}
export type MountDatums = ReturnType<typeof resolveMountDatums>;
