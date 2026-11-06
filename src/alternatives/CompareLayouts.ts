import type { Project, ProductId } from "../designer/DesignerTypes";
import {
  distanceDefinitions,
  type DistanceId,
} from "../designer/DistanceDefinitions";
import { formatInches } from "../shared/Units";
export type LayoutDifference = Readonly<{
  label: string;
  current: string;
  saved: string;
}>;
export function compareLayouts(
  current: Project,
  saved: Project,
  units: "in" | "mm",
): LayoutDifference[] {
  const fmt = (mm: number) =>
    units === "in" ? formatInches(mm) : `${Number(mm.toFixed(1))} mm`;
  const result: LayoutDifference[] = [];
  const add = (label: string, a: string, b: string) => {
    if (a !== b) result.push({ label, current: a, saved: b });
  };
  for (const id of Object.keys(distanceDefinitions) as DistanceId[]) {
    const a = current.distances[id],
      b = saved.distances[id];
    if (a.mm !== b.mm)
      result.push({
        label: distanceDefinitions[id].label,
        current: fmt(a.mm),
        saved: fmt(b.mm),
      });
    add(
      `${distanceDefinitions[id].label} confirmation`,
      a.confidence,
      b.confidence,
    );
  }
  for (const id of Object.keys(current.products) as ProductId[]) {
    const a = current.products[id],
      b = saved.products[id];
    for (const axis of ["width", "height", "depth"] as const)
      if (a[axis].mm !== b[axis].mm)
        result.push({
          label: `${a.name} ${axis}`,
          current: fmt(a[axis].mm),
          saved: fmt(b[axis].mm),
        });
    add(`${a.name} finish`, a.appearance.color, b.appearance.color);
  }
  add(
    "Stud centers from left",
    current.studs.positions.map(fmt).join(", ") || "none",
    saved.studs.positions.map(fmt).join(", ") || "none",
  );
  add(
    "Stud locations confirmed",
    String(current.studs.confirmed),
    String(saved.studs.confirmed),
  );
  add("Upper electrical placement", current.upperElectricalPlacement, saved.upperElectricalPlacement);
  add("Blocking placement", current.blockingPlacement, saved.blockingPlacement);
  add(
    "Selected rail shift",
    fmt(current.mountRailOffsets.positions[current.selectedRailPosition]),
    fmt(saved.mountRailOffsets.positions[saved.selectedRailPosition]),
  );
  for (const id of Object.keys(
    current.electricalMounting,
  ) as (keyof typeof current.electricalMounting)[])
    add(
      `${id} box mounting`,
      current.electricalMounting[id],
      saved.electricalMounting[id],
    );
  add(
    "Soundbar orientation",
    current.soundbarOrientation,
    saved.soundbarOrientation,
  );
  add(
    "Swivel per side",
    `${current.mountSwivelDegrees}°`,
    `${saved.mountSwivelDegrees}°`,
  );
  return result;
}
