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
  const supports = [0.18, 0.82].map((fraction) => ({
    x: panel.x + panel.width * fraction - 44.45,
    y: panel.y + panel.height * 0.12,
    z: 0,
    width: 88.9,
    height: panel.height * 0.76,
    depth: panel.z,
  }));
  const boxX = width / 2 + d.electricalOffsetX.mm;
  const boxes = [d.upperBoxHeight.mm, d.lowerBoxHeight.mm].map((y) => ({
    x: boxX - 75,
    y: y - 65,
    z: -70,
    width: 150,
    height: 130,
    depth: 80,
  }));
  const lower = boxes[1],
    upper = boxes[0];
  const routes = ([-32, 32] as const).map(
    (offset) =>
      [
        [boxX + offset, lower.y + lower.height / 2, -45],
        [boxX + offset, lower.y + lower.height + 80, -45],
        [boxX + offset, upper.y - 80, -45],
        [boxX + offset, upper.y + upper.height / 2, -45],
      ] as const,
  );
  return { studs, blocking, supports, boxes, routes };
}
