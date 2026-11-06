import { useMemo } from "react";
import type { Project } from "../designer/DesignerTypes";
import type { Assembly } from "../geometry/AssemblyTypes";
import { verificationItems } from "../designer/FieldCatalog";
import { resolveConstructionSchedule } from "./ConstructionSchedule";
import type { ViewController, ViewSnapshot } from "../viewer/ViewStore";
import { formatInches } from "../shared/Units";
export function ConstructionScheduleView({
  project,
  assembly,
  state,
  view,
}: {
  project: Project;
  assembly: Assembly;
  state: ViewSnapshot;
  view: ViewController;
}) {
  const s = useMemo(
      () => resolveConstructionSchedule(project, assembly),
      [project, assembly],
    ),
    fmt = (v: number | null) =>
      v === null
        ? "—"
        : state.units === "in"
          ? formatInches(v)
          : `${Number(v.toFixed(1))} mm`;
  return (
    <div className="build-schedule">
      <h2>Cut & drilling schedule</h2>
      <p>
        Coordinates and sizes follow the current model. Cuts exclude kerf / fit
        allowances; lag coordinates do not specify hole diameter or fastener
        selection.
      </p>
      <button onClick={() => view.openEditor("verification")}>
        Needs verification · {verificationItems(project).length} ↗
      </button>
      <h3>Blocking & spacers</h3>
      <p>
        Blocking spans complete selected stud bays. Spacer depth is the required
        stack depth, not a chosen stock thickness.
      </p>
      <div className="schedule-scroll">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Part</th>
              <th>Width</th>
              <th>Height</th>
              <th>Depth</th>
            </tr>
          </thead>
          <tbody>
            {s.pieces.map((p) => (
              <tr key={p.id}>
                <th>{p.id}</th>
                <td>{p.label}</td>
                <td>{fmt(p.bounds.width)}</td>
                <td>{fmt(p.bounds.height)}</td>
                <td>{fmt(p.bounds.depth)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>Wall-plate lag locations</h3>
      <p>
        Wall X starts at the left wall edge; floor Y starts at finished floor.
        Panel and blocking coordinates start at each part's lower-left corner,
        looking from the room.
      </p>
      <div className="schedule-scroll">
        <table>
          <thead>
            <tr>
              <th>Lag</th>
              <th>Wall X</th>
              <th>Floor Y</th>
              <th>Panel X / Y</th>
              <th>Blocking / local X / Y</th>
              <th>Spacer</th>
              <th>Path</th>
            </tr>
          </thead>
          <tbody>
            {s.lags.map((l) => (
              <tr key={l.id}>
                <th>{l.id}</th>
                <td>{fmt(l.wallX)}</td>
                <td>{fmt(l.floorY)}</td>
                <td>
                  {fmt(l.panelX)} / {fmt(l.panelY)}
                </td>
                <td>
                  {l.blockingId
                    ? `${l.blockingId}: ${fmt(l.blockingX)} / ${fmt(l.blockingY)}`
                    : "MISSES BLOCKING"}
                </td>
                <td>{l.spacerId ?? "MISSES SPACER"}</td>
                <td>{fmt(l.pathLength)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>Openings & spacer clearances</h3>
      <div className="schedule-scroll">
        <table>
          <thead>
            <tr>
              <th>Layer</th>
              <th>Opening</th>
              <th>X / Y</th>
              <th>Width × height</th>
              <th>Datum</th>
            </tr>
          </thead>
          <tbody>
            {s.openings.map((o) => (
              <tr key={o.id}>
                <td>{o.layer}</td>
                <td>{o.label}</td>
                <td>
                  {fmt(o.x)} / {fmt(o.y)}
                </td>
                <td>
                  {fmt(o.width)} × {fmt(o.height)}
                </td>
                <td>{o.datum}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
