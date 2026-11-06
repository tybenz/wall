import {
  electricalDimensions,
  type ElectricalPartId,
  type ElectricalDimensionId,
} from "../electrical/ElectricalTypes";
import type { DesignerController } from "../designer/DesignerController";
import type {
  Project,
  FieldId,
  DistanceId,
  ProductId,
  ProductAxis,
} from "../designer/DesignerTypes";
import { distanceDefinitions } from "../designer/DistanceDefinitions";
import { productFieldLabel } from "../designer/FieldCatalog";
import type { ViewController, ViewSnapshot } from "../viewer/ViewStore";
import { DistanceInput } from "./DistanceInput";
export type EditorProps = {
  project: Project;
  controller: DesignerController;
  view: ViewController;
  state: ViewSnapshot;
};
export function FieldEditor({
  field,
  project,
  controller,
  view,
  state,
}: EditorProps & { field: Exclude<FieldId, "studs" | "railPositions"> }) {
  const common = {
    field,
    view,
    units: state.units,
    editRequest: state.focusField === field ? state.focusRequest : 0,
  };
  if (field.startsWith("electrical:")) {
    const [, id, dimension] = field.split(":") as [
      "electrical",
      ElectricalPartId,
      ElectricalDimensionId,
    ];
    const value = project.electricalParts[id][dimension];
    return (
      <DistanceInput
        {...common}
        mode="fact"
        label={electricalDimensions[dimension]}
        mm={value.mm}
        note={value.evidence.note}
        confirmed={value.confidence === "confirmed"}
        onConfirm={(confirmed) =>
          controller.confirmElectricalDimension(id, dimension, confirmed)
        }
        onChange={(mm) => controller.setElectricalDimension(id, dimension, mm)}
      />
    );
  }
  if (field.startsWith("distance:")) {
    const id = field.slice(9) as DistanceId,
      def = distanceDefinitions[id],
      value = project.distances[id];
    return (
      <DistanceInput
        {...common}
        mode={def.kind === "measurement" ? "fact" : "layout"}
        label={def.label}
        mm={value.mm}
        note={value.note}
        confirmed={value.confidence === "confirmed"}
        onConfirm={
          def.kind === "measurement"
            ? (confirmed) => controller.confirmDistance(id, confirmed)
            : undefined
        }
        onChange={(mm) => controller.setDistance(id, mm)}
      />
    );
  }
  const [, id, axis] = field.split(":") as ["product", ProductId, ProductAxis];
  const value = project.products[id][axis];
  return (
    <DistanceInput
      {...common}
      mode="fact"
      label={productFieldLabel(id, axis)}
      mm={value.mm}
      note={value.evidence.note}
      source={
        value.evidence.kind === "manufacturer"
          ? "Published reference"
          : value.evidence.source === "user-entered"
            ? "User entered"
            : value.evidence.kind === "assumption"
              ? "Estimate"
              : "Supplied reference"
      }
      confirmed={value.confidence === "confirmed"}
      onConfirm={(confirmed) =>
        controller.confirmProductDimension(id, axis, confirmed)
      }
      onChange={(mm) => controller.setProductDimension(id, axis, mm)}
    />
  );
}
