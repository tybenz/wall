import type { Assembly } from "../geometry/AssemblyTypes";
import { electricalPlacementOptions } from "../electrical/ElectricalPlacement";
import { formatInches } from "../shared/Units";
import { FieldEditor, type EditorProps } from "./FieldEditor";

export function ElectricalPlanner(props: EditorProps & { assembly: Assembly }) {
  const { project, controller, assembly, state } = props;
  const options = electricalPlacementOptions(project, assembly);
  const fmt = (mm: number) => state.units === "in"
    ? formatInches(mm)
    : `${Number(mm.toFixed(1))} mm`;
  const below = options[0], above = options[1];
  return (
    <>
      <p className="section-intro">
        Power and HDMI run straight up from the lower wall beside a stud.
        This plan checks upper plate height and whether the TV hides the plates.
        Left/right placement is handled during installation.
      </p>
      <section className="editor-section">
        <h3>Layout</h3>
        <label className="select-field">
          Power / HDMI location
          <select
            value={project.upperElectricalPlacement}
            onChange={(e) => controller.setUpperElectricalPlacement(
              e.target.value === "above" ? "above" : "below",
            )}
          >
            <option value="below">Below mount</option>
            <option value="above">Above mount</option>
          </select>
        </label>
        <FieldEditor {...props} field="distance:upperBoxGap" />
      </section>
      <section className="editor-section">
        <h3>Will the TV hide the plates?</h3>
        <p>
          {below.hidden
            ? "Both plates fit behind the TV below the mount. Above-mount placement is not needed for visual coverage."
            : above.hidden
              ? "Below the mount, a plate extends beyond the TV. Above the mount, both plates fit behind the TV."
              : "Neither position hides both plates with the current gap, TV height and rail setting."}
        </p>
        {options.map((option) => (
          <div key={option.side}>
            <h4>{option.side === "below" ? "Below mount" : "Above mount"} · {option.hidden ? "Hidden" : "Visible beyond TV"}</h4>
            {option.positions.map((plate) => (
              <p key={plate.label}>
                {plate.label}: bottom {fmt(plate.bottom)}, top {fmt(plate.top)} above floor.
                {plate.clearance < 0
                  ? ` Extends ${fmt(-plate.clearance)} beyond the TV outline.`
                  : ` Nearest TV edge clearance: ${fmt(plate.clearance)}.`}
              </p>
            ))}
          </div>
        ))}
        <p className="section-intro">
          Coverage uses the TV parked, viewed straight from the front. Plate sizes
          are estimates until verified. This does not check access behind the mount arms.
        </p>
      </section>
      <details>
        <summary>Plate dimensions</summary>
        <p className="section-intro">Only the outer plate sizes affect visual coverage.</p>
        <FieldEditor {...props} field="electrical:upperPower:plateWidth" />
        <FieldEditor {...props} field="electrical:upperPower:plateHeight" />
        <FieldEditor {...props} field="electrical:upperSignal:plateWidth" />
        <FieldEditor {...props} field="electrical:upperSignal:plateHeight" />
      </details>
    </>
  );
}
