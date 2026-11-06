import {
  resolveElectrical,
  electricalRoutes,
} from "../electrical/ResolveElectrical";
import { resolveMountDatums } from "./MountDatums";
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
  const datums = resolveMountDatums(project);
  const blocking: Bounds[] = [];
  const start = mount.x + mount.width / 2 - d.blockingWidth.mm / 2,
    end = start + d.blockingWidth.mm;
  for (let i = 0; i < studs.length - 1; i++) {
    const left = studs[i].x + studs[i].width,
      right = studs[i + 1].x;
    if (right > left && left < end && right > start)
      blocking.push({
        x: left,
        y: datums.blockingBottom,
        z: -d.drywallThickness.mm - d.blockingDepth.mm,
        width: right - left,
        height: d.blockingHeight.mm,
        depth: d.blockingDepth.mm,
      });
  }
  const supportFrame = resolvePanelSupports(project, panel, mount);
  const electrical = resolveElectrical(project, panel, mount);
  const rails = [-0.5, 0.5].map((side) => ({
    x: width / 2 + side * d.tvMountHoleSpacingX.mm - 10,
    y: datums.railBottom,
    z: mount.z + mount.depth - 5,
    width: 20,
    height: d.railAboveHook.mm + d.railBelowHook.mm,
    depth: 5,
  }));
  const routes = electricalRoutes(project, electrical);
  return {
    routeCrossings: [],
    studs,
    blocking,
    ...supportFrame,
    datums,
    rails,
    electrical,
    boxes: electrical.map((p) => p.body),
    plates: electrical.map((p) => p.plate),
    openings: electrical.map((p) => p.opening),
    routes,
    cradle: [],
  };
}
