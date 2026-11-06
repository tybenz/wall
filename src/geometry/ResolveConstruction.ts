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
    .sort((a, b) => a - b)
    .map((x) => ({
      x: Math.max(0, x - d.studWidth.mm / 2),
      y: 0,
      z,
      width:
        Math.min(width, x + d.studWidth.mm / 2) -
        Math.max(0, x - d.studWidth.mm / 2),
      height: profileCutHeight(
        profile,
        Math.max(0, x - d.studWidth.mm / 2),
        Math.min(width, x + d.studWidth.mm / 2),
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
        z: -d.drywallThickness.mm - d.blockingDepth.mm,
        width: right - left,
        height: d.blockingHeight.mm,
        depth: d.blockingDepth.mm,
      });
  }
  const supportFrame = resolvePanelSupports(project, panel, mount);
  const mountCenter = mount.x + mount.width / 2;
  // Plates and cavity envelopes are distinct. Cutouts follow the box footprint.
  const upper = {
    x: mountCenter - d.plateWidth.mm / 2,
    y: mount.y - d.upperBoxGap.mm - d.plateHeight.mm,
    z: panel.z + panel.depth,
    width: d.plateWidth.mm,
    height: d.plateHeight.mm,
    depth: 3,
  };
  const lower = {
    ...upper,
    z: project.products.slats.depth.mm,
    x: mountCenter + d.electricalOffsetX.mm - d.plateWidth.mm / 2,
    y: d.lowerBoxHeight.mm - d.plateHeight.mm / 2,
  };
  const plates = [upper, lower];
  const boxes = plates.map((plate) => ({
    x: plate.x + (plate.width - d.boxWidth.mm) / 2,
    y: plate.y + (plate.height - d.boxHeight.mm) / 2,
    z: -d.drywallThickness.mm - d.boxDepth.mm,
    width: d.boxWidth.mm,
    height: d.boxHeight.mm,
    depth: d.drywallThickness.mm + d.boxDepth.mm + plate.z,
  }));
  const routeZ = -d.drywallThickness.mm - d.routeDepth.mm;
  const routes = [d.powerRouteOffsetX.mm, d.signalRouteOffsetX.mm].map(
    (offset, i) => {
      const routeX = width / 2 + offset;
      const socketOffset = (i === 0 ? -1 : 1) * Math.min(32, d.boxWidth.mm / 4);
      const bottomX = lower.x + lower.width / 2 + socketOffset;
      const topX = upper.x + upper.width / 2 + socketOffset;
      return [
        [bottomX, lower.y + lower.height / 2, routeZ],
        [routeX, lower.y + lower.height + 80, routeZ],
        [routeX, upper.y - 80, routeZ],
        [topX, upper.y + upper.height / 2, routeZ],
      ] as const;
    },
  );
  return {
    studs,
    blocking,
    ...supportFrame,
    boxes,
    plates,
    routes,
    cradle: [],
  };
}
