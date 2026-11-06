import type { EditorProps } from "./FieldEditor";
import type { Assembly } from "../geometry/AssemblyTypes";
import { formatInches } from "../shared/Units";
export function BlockingPlanControls({
  project,
  controller,
  state,
  assembly,
}: EditorProps & { assembly: Assembly }) {
  const m = assembly.construction.datums,
    fmt = (v: number) =>
      state.units === "in" ? formatInches(v) : `${Number(v.toFixed(1))} mm`;
  return (
    <>
      <label className="select-field">
        Blocking height follows
        <select
          value={project.blockingPlacement}
          onChange={(e) =>
            controller.setBlockingPlacement(
              e.target.value === "manual" ? "manual" : "follow-mount",
            )
          }
        >
          <option value="follow-mount">Mount lag rows</option>
          <option value="manual">Manual floor height</option>
        </select>
      </label>
      {project.blockingPlacement === "follow-mount" && (
        <p className="explanation">
          Blocking bottom {fmt(m.blockingBottom)}; top {fmt(m.blockingTop)}. The
          chosen board height is centered on the lag rows and follows TV height
          and rail position. Boards span complete selected stud bays.
        </p>
      )}
      <p className="section-intro">
        The desired margin is a layout allowance, not a specified structural
        edge distance.
      </p>
    </>
  );
}
