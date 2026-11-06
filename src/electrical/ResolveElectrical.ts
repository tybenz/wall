import type { Project } from "../designer/DesignerTypes";
import type { Bounds } from "../geometry/AssemblyTypes";
import { electricalParts, type ElectricalPartId } from "./ElectricalTypes";
export type ElectricalDevice = Readonly<{
  id: ElectricalPartId;
  label: string;
  location: "upper" | "lower";
  kind: "power" | "signal";
  body: Bounds;
  plate: Bounds;
  opening: Bounds;
  reach: Bounds | null;
}>;
export function resolveElectrical(
  project: Project,
  panel: Bounds,
  mount: Bounds,
): readonly ElectricalDevice[] {
  const d = project.distances,
    center = mount.x + mount.width / 2;
  return electricalParts.map((part) => {
    const specs = project.electricalParts[part.id];
    const upper = part.location === "upper";
    const power = project.electricalParts.upperPower,
      signal = project.electricalParts.upperSignal;
    const pairWidth =
      power.plateWidth.mm + d.electricalPlateGap.mm + signal.plateWidth.mm;
    const columnCenter = center - pairWidth / 2 +
      (part.kind === "power"
        ? power.plateWidth.mm / 2
        : power.plateWidth.mm + d.electricalPlateGap.mm + signal.plateWidth.mm / 2);
    const x = columnCenter - specs.plateWidth.mm / 2;
    const y = upper
      ? project.upperElectricalPlacement === "above"
        ? mount.y + mount.height + d.upperBoxGap.mm
        : mount.y - d.upperBoxGap.mm - specs.plateHeight.mm
      : d.lowerBoxHeight.mm - specs.plateHeight.mm / 2;
    const face = upper
      ? panel.z + panel.depth
      : project.products.slats.depth.mm;
    const plate = {
      x,
      y,
      z: face,
      width: specs.plateWidth.mm,
      height: specs.plateHeight.mm,
      depth: specs.plateDepth.mm,
    };
    const cx = x + plate.width / 2,
      cy = y + plate.height / 2;
    const bodyFront =
      project.electricalMounting[part.id] === "drywall" ? 0 : face;
    const body = {
      x: cx - specs.bodyWidth.mm / 2,
      y: cy - specs.bodyHeight.mm / 2,
      z: bodyFront - specs.bodyDepth.mm,
      width: specs.bodyWidth.mm,
      height: specs.bodyHeight.mm,
      depth: specs.bodyDepth.mm,
    };
    const opening = {
      x: cx - specs.openingWidth.mm / 2,
      y: cy - specs.openingHeight.mm / 2,
      z: -d.drywallThickness.mm,
      width: specs.openingWidth.mm,
      height: specs.openingHeight.mm,
      depth: d.drywallThickness.mm + face,
    };
    const reach =
      face > bodyFront + 0.01
        ? { ...opening, z: bodyFront, depth: face - bodyFront }
        : null;
    return { ...part, body, plate, opening, reach };
  });
}
export function electricalRoutes(
  project: Project,
  devices: readonly ElectricalDevice[],
) {
  // Fixed schematic vertical runs. Lateral routing and framing passages are
  // installation decisions, outside this height/visibility planner.
  return (["power", "signal"] as const).map((kind) => {
    const lower = devices.find((p) => p.location === "lower" && p.kind === kind)!.body;
    const upper = devices.find((p) => p.location === "upper" && p.kind === kind)!.body;
    const x = upper.x + upper.width / 2;
    const z = upper.z + upper.depth / 2;
    return [
      [x, lower.y + lower.height / 2, z],
      [x, upper.y + upper.height / 2, z],
    ] as const;
  });
}
