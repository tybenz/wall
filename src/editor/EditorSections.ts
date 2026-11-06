import {
  distanceDefinitions,
  type DistanceId,
  type EditorGroup,
} from "../designer/DistanceDefinitions";
import type { FieldId, ProductId } from "../designer/DesignerTypes";
import { productGroups, productAxes } from "../designer/FieldCatalog";
const sectionOrder: Record<
  Exclude<EditorGroup, "verification">,
  readonly string[]
> = {
  wall: [
    "Site measurements",
    "Blocking plan",
    "Material dimensions",
    "Preview",
  ],
  slats: ["Layout", "Material dimensions", "Calculated"],
  panel: ["Layout", "Material dimensions", "Calculated"],
  tv: [
    "Layout",
    "Physical dimensions",
    "Attachment plan",
    "Position previews",
    "Calculated",
  ],
  soundbar: ["Layout", "Physical dimensions", "Calculated"],
  console: ["Layout", "Physical dimensions", "Calculated"],
  electrical: [
    "Layout",
    "Physical dimensions",
    "Route plan",
    "Calculated checks",
  ],
};
export function editorSections(
  group: Exclude<EditorGroup, "verification">,
): readonly { label: string; fields: readonly FieldId[] }[] {
  return sectionOrder[group].map((label) => ({
    label,
    fields: [
      ...Object.entries(distanceDefinitions)
        .filter(([, def]) => def.group === group && def.section === label)
        .map(([id]) => `distance:${id as DistanceId}` as const),
      ...(label === "Site measurements" && group === "wall"
        ? ["studs" as const]
        : []),
      ...Object.entries(productGroups)
        .filter(
          ([, category]) =>
            category === group &&
            (label === "Physical dimensions" ||
              label === "Material dimensions"),
        )
        .flatMap(([id]) =>
          productAxes.map(
            (axis) => `product:${id as ProductId}:${axis}` as const,
          ),
        ),
    ],
  }));
}
