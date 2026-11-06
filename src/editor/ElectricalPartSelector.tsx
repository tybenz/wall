import {
  electricalParts,
  type ElectricalPartId,
} from "../electrical/ElectricalTypes";
import type { EditorProps } from "./FieldEditor";
export function ElectricalPartSelector({
  state,
  view,
}: Pick<EditorProps, "state" | "view">) {
  return (
    <label className="select-field">
      Electrical component
      <select
        value={state.electricalPart}
        onChange={(e) =>
          view.setElectricalPart(e.target.value as ElectricalPartId)
        }
      >
        {electricalParts.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      <small>
        Each component has independent box-body, plate and required-opening
        dimensions.
      </small>
    </label>
  );
}
