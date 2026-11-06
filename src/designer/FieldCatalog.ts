import {
  electricalParts,
  electricalDimensions,
  type ElectricalPartId,
  type ElectricalDimensionId,
} from "../electrical/ElectricalTypes";
import {
  distanceDefinitions,
  type DistanceId,
  type EditorGroup,
} from "./DistanceDefinitions";
import type { FieldId, ProductId, ProductAxis, Project } from "./DesignerTypes";
export type VerificationBucket =
  "Site measurements" | "Part & material dimensions" | "Hardware details";
export const productGroups: Record<ProductId, EditorGroup> = {
  tv: "tv",
  slats: "slats",
  featurePanel: "panel",
  soundbar: "soundbar",
  console: "console",
};
export const productAxes = ["width", "height", "depth"] as const;
export function productFieldLabel(
  product: ProductId,
  axis: ProductAxis,
): string {
  if (product === "featurePanel")
    return axis === "depth" ? "Panel material thickness" : `Stock ${axis}`;
  if (product === "slats")
    return axis === "depth"
      ? "Panel thickness"
      : axis === "height"
        ? "Panel stock length"
        : "Panel stock width";
  return `${axis[0].toUpperCase()}${axis.slice(1)}`;
}
export function fieldGroup(field: FieldId): EditorGroup {
  if (field === "studs") return "wall";
  if (field === "railPositions") return "tv";
  if (field.startsWith("electrical:")) return "electrical";
  if (field.startsWith("distance:"))
    return distanceDefinitions[field.slice(9) as DistanceId].group;
  return productGroups[field.split(":")[1] as ProductId];
}
export function fieldIsFact(field: FieldId): boolean {
  return (
    !field.startsWith("distance:") ||
    distanceDefinitions[field.slice(9) as DistanceId].kind === "measurement"
  );
}
export function fieldVerified(project: Project, field: FieldId): boolean {
  if (field === "studs") return project.studs.confirmed;
  if (field === "railPositions") return project.mountRailOffsets.confirmed;
  if (field.startsWith("electrical:")) {
    const [, id, dimension] = field.split(":") as [
      "electrical",
      ElectricalPartId,
      ElectricalDimensionId,
    ];
    return project.electricalParts[id][dimension].confidence === "confirmed";
  }
  if (field.startsWith("distance:"))
    return (
      project.distances[field.slice(9) as DistanceId].confidence === "confirmed"
    );
  const [, id, axis] = field.split(":") as ["product", ProductId, ProductAxis];
  return project.products[id][axis].confidence === "confirmed";
}
export type VerificationItem = Readonly<{
  field: FieldId;
  group: EditorGroup;
  label: string;
  bucket: VerificationBucket;
  note: string;
}>;
export function verificationItems(project: Project): VerificationItem[] {
  const items: VerificationItem[] = [];
  for (const id of Object.keys(distanceDefinitions) as DistanceId[]) {
    const def = distanceDefinitions[id];
    const field = `distance:${id}` as const;
    if (def.kind !== "measurement" || fieldVerified(project, field)) continue;
    const bucket: VerificationBucket =
      def.group === "tv" || id === "cradleThickness"
        ? "Hardware details"
        : def.section === "Site measurements"
          ? "Site measurements"
          : "Part & material dimensions";
    items.push({
      field,
      group: def.group,
      label: def.label,
      bucket,
      note: project.distances[id].note,
    });
  }
  for (const id of Object.keys(project.products) as ProductId[])
    for (const axis of productAxes) {
      const field = `product:${id}:${axis}` as const;
      if (!fieldVerified(project, field))
        items.push({
          field,
          group: productGroups[id],
          label: `${project.products[id].name}: ${productFieldLabel(id, axis)}`,
          bucket: "Part & material dimensions",
          note: project.products[id][axis].evidence.note,
        });
    }
  for (const part of electricalParts.filter((p) => p.location === "upper"))
    for (const dimension of Object.keys(
      electricalDimensions,
    ) as ElectricalDimensionId[]) {
      if (dimension !== "plateWidth" && dimension !== "plateHeight") continue;
      const field = `electrical:${part.id}:${dimension}` as const;
      if (!fieldVerified(project, field))
        items.push({
          field,
          group: "electrical",
          label: `${part.label}: ${electricalDimensions[dimension]}`,
          bucket: "Hardware details",
          note: project.electricalParts[part.id][dimension].evidence.note,
        });
    }
  if (!project.mountRailOffsets.confirmed)
    items.push({
      field: "railPositions",
      group: "tv",
      label: "Available rail mounting shifts",
      bucket: "Hardware details",
      note: "Verify the available rail shifts relative to the reference mounting setting; positive raises the rails relative to TV.",
    });
  if (!project.studs.confirmed)
    items.unshift({
      field: "studs",
      group: "wall",
      label: "Stud locations",
      bucket: "Site measurements",
      note: "Confirm centers measured from the left wall edge.",
    });
  return items;
}
