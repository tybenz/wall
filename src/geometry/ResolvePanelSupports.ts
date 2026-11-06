import { lagRowHeights } from "./MountDatums";
import type { Project } from "../designer/DesignerTypes";
import type { Bounds, LagPath, Spacer } from "./AssemblyTypes";

export function resolvePanelSupports(
  project: Project,
  panel: Bounds,
  mount: Bounds,
) {
  const d = project.distances;
  const inset = Math.min(
    d.supportInset.mm,
    Math.min(panel.width, panel.height) / 4,
  );
  const face = Math.min(
    d.supportWidth.mm,
    (Math.min(panel.width, panel.height) - 2 * inset) / 3,
  );
  const left = panel.x + inset,
    right = panel.x + panel.width - inset;
  const bottom = panel.y + inset,
    top = panel.y + panel.height - inset;
  const verticalBottom = bottom + face,
    verticalHeight = top - bottom - 2 * face;
  const spacer = (
    x: number,
    y: number,
    width: number,
    height: number,
    role: Spacer["role"],
  ): Spacer => ({ x, y, z: 0, width, height, depth: panel.z, role });
  const perimeter = [
    spacer(left, bottom, right - left, face, "perimeter"),
    spacer(left, top - face, right - left, face, "perimeter"),
    spacer(left, verticalBottom, face, verticalHeight, "perimeter"),
    spacer(right - face, verticalBottom, face, verticalHeight, "perimeter"),
  ];
  const center = mount.x + mount.width / 2;
  const centers = [
    center - d.supportSpacing.mm / 2,
    center + d.supportSpacing.mm / 2,
  ];
  const inner = centers.map((x) =>
    spacer(x - face / 2, verticalBottom, face, verticalHeight, "mount"),
  );
  const lagCenters = [
    center + d.lagPatternOffsetX.mm - d.lagColumnSpacing.mm / 2,
    center + d.lagPatternOffsetX.mm + d.lagColumnSpacing.mm / 2,
  ];
  const lagPaths: LagPath[] = lagCenters.flatMap((x) =>
    lagRowHeights(project, mount.y + mount.height).map((y) => ({
      start: [x, y, mount.z + d.mountPlateThickness.mm] as const,
      end: [x, y, -d.drywallThickness.mm - d.lagEmbedment.mm] as const,
    })),
  );
  return { supports: [...perimeter, ...inner], lagPaths };
}
