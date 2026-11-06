import type { Project } from "../designer/DesignerTypes";
import { getPart, type Assembly } from "../geometry/AssemblyTypes";

/** Front elevation coverage by the parked TV housing, for each mount side. */
export function electricalPlacementOptions(project: Project, assembly: Assembly) {
  const tv = getPart(assembly, "tv").bounds;
  const mount = getPart(assembly, "mount").bounds;
  const gap = project.distances.upperBoxGap.mm;
  const plates = assembly.construction.electrical.filter((p) => p.location === "upper");
  return (["below", "above"] as const).map((side) => {
    const positions = plates.map(({ plate, label }) => {
      const bottom = side === "below"
        ? mount.y - gap - plate.height
        : mount.y + mount.height + gap;
      const top = bottom + plate.height;
      const clearance = Math.min(
        bottom - tv.y,
        tv.y + tv.height - top,
        plate.x - tv.x,
        tv.x + tv.width - plate.x - plate.width,
      );
      return { label, bottom, top, clearance };
    });
    return { side, positions, hidden: positions.every((p) => p.clearance >= 0) };
  });
}
