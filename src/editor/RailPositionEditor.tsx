import { OffsetListEditor } from "./OffsetListEditor";
import type { EditorProps } from "./FieldEditor";
import { formatInches } from "../shared/Units";
export function RailPositionEditor({
  project,
  controller,
  state,
}: EditorProps) {
  const fmt = (v: number) =>
    state.units === "in" ? formatInches(v) : `${Number(v.toFixed(1))} mm`;
  return (
    <>
      <label className="select-field">
        Layout: selected rail position
        <select
          value={project.selectedRailPosition}
          onChange={(e) => controller.setRailPosition(Number(e.target.value))}
        >
          {project.mountRailOffsets.positions.map((v, i) => (
            <option key={i} value={i}>
              {v === 0
                ? "Reference setting"
                : `${v > 0 ? "Raise" : "Lower"} rails ${fmt(Math.abs(v))}`}
            </option>
          ))}
        </select>
        <small>
          Shifts both rails and their hooks relative to the TV. Choose a
          position that keeps the rails behind the housing.
        </small>
      </label>
      <OffsetListEditor
        field="railPositions"
        label="Available rail mounting shifts"
        values={project.mountRailOffsets.positions}
        confirmed={project.mountRailOffsets.confirmed}
        onApply={(values) => controller.setRailOffsets(values)}
        onVerify={(verified) =>
          controller.setRailOffsets(
            project.mountRailOffsets.positions,
            verified,
          )
        }
        units={state.units}
        editRequest={
          state.focusField === "railPositions" ? state.focusRequest : 0
        }
        note="Unmeasured example settings until verified. Enter available shifts from the reference installation, separated by commas. Positive raises the rails relative to the TV; shifts need not be evenly spaced. These represent usable rail settings for the selected TV bolt pattern."
      />
    </>
  );
}
