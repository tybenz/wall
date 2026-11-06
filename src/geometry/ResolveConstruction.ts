import { resolvePanelSupports } from "./ResolvePanelSupports";
import { resolveWallProfile, profileCutHeight } from "./WallProfile";
import type { Project } from "../designer/DesignerTypes";
import type { Bounds, Construction } from "./AssemblyTypes";
export function resolveConstruction(
  project: Project,
  panel: Bounds,
  mount: Bounds,
): Construction {
  const { distances: d } = project;
  const width = d.wallWidth.mm;
  const profile = resolveWallProfile(project);
  const z = -d.drywallThickness.mm - d.studDepth.mm;
  const studs = project.studs.positions
    .filter((x) => x >= 0 && x <= width)
    .map((x) => ({
      x: Math.max(0, x - 19.05),
      y: 0,
      z,
      width: Math.min(width, x + 19.05) - Math.max(0, x - 19.05),
      height: profileCutHeight(
        profile,
        Math.max(0, x - 19.05),
        Math.min(width, x + 19.05),
      ),
      depth: d.studDepth.mm,
    }));
  const blocking: Bounds[] = [];
  const start = mount.x + mount.width / 2 - d.blockingWidth.mm / 2,
    end = start + d.blockingWidth.mm;
  for (let i = 0; i < studs.length - 1; i++) {
    const left = Math.max(start, studs[i].x + studs[i].width),
      right = Math.min(end, studs[i + 1].x);
    if (right > left)
      blocking.push({
        x: left,
        y: d.blockingBottom.mm,
        z,
        width: right - left,
        height: d.blockingHeight.mm,
        depth: d.studDepth.mm,
      });
  }
  const supportFrame = resolvePanelSupports(project, panel, mount);
  const mountCenter = mount.x + mount.width / 2;
  // Bounds describe the visible plate envelope, so gap is measured edge-to-edge.
  const upper = {
    x: mountCenter - 75,
    y: mount.y - d.upperBoxGap.mm - 130,
    z: -70,
    width: 150,
    height: 130,
    depth: panel.z + panel.depth + 70,
  };
  const lower = {
    ...upper,
    depth: project.products.slats.depth.mm + 70,
    x: mountCenter + d.electricalOffsetX.mm - 75,
    y: d.lowerBoxHeight.mm - 65,
  };
  const boxes = [upper, lower];
  const routes = ([-32, 32] as const).map(
    (offset) =>
      [
        [lower.x + 75 + offset, lower.y + lower.height / 2, -45],
        [lower.x + 75 + offset, lower.y + lower.height + 80, -45],
        [upper.x + 75 + offset, upper.y - 80, -45],
        [upper.x + 75 + offset, upper.y + upper.height / 2, -45],
      ] as const,
  );
  return { studs, blocking, ...supportFrame, boxes, routes, cradle: [] };
}
