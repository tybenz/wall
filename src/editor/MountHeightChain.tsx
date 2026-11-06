import type { Assembly } from "../geometry/AssemblyTypes";
import type { ViewController, ViewSnapshot } from "../viewer/ViewStore";
import { formatInches } from "../shared/Units";
import type { EditorProps } from "./FieldEditor";
export function MountHeightChain({
  assembly,
  state,
  view,
  project,
  controller,
}: {
  assembly: Assembly;
  state: ViewSnapshot;
  view: ViewController;
} & Pick<EditorProps, "project" | "controller">) {
  const m = assembly.construction.datums,
    fmt = (v: number) =>
      state.units === "in" ? formatInches(v) : `${Number(v.toFixed(1))} mm`;
  return (
    <details className="mount-height-chain">
      <summary>Mount & blocking height chain</summary>
      <p className="section-intro">
        Floor heights from the current TV layout, measured hardware facts and
        selected rail setting.
      </p>
      <p className="section-intro">
        {project.blockingPlacement === "follow-mount"
          ? "Blocking follows the mount lag rows."
          : "Blocking is fixed at a manual floor height and will not follow the TV or rail position."}
      </p>
      {project.blockingPlacement === "manual" && (
        <button onClick={() => controller.setBlockingPlacement("follow-mount")}>
          Have blocking follow mount lag rows
        </button>
      )}
      <ol>
        {[
          ["TV top", m.tvTop],
          ["Upper TV mounting hole", m.upperTvHole],
          ["Hook contact line", m.hook],
          ["Wall plate top", m.plateTop],
          ["Upper lag row", m.lagHigh],
          ["Lower lag row", m.lagLow],
          ["Blocking top", m.blockingTop],
          ["Blocking bottom", m.blockingBottom],
        ].map(([label, value]) => (
          <li key={String(label)}>
            <span>{label}</span>
            <strong>{fmt(Number(value))}</strong>
          </li>
        ))}
      </ol>
      <p className="section-intro">
        Hook below TV top: {fmt(m.tvTopToHook)}. Hook above TV bottom:{" "}
        {fmt(m.tvBottomToHook)}. Rail top/bottom: {fmt(m.railTop)} /{" "}
        {fmt(m.railBottom)} above floor.
      </p>
      <button
        onClick={() => view.openEditor("tv", "distance:tvTopToMountHole")}
      >
        Edit mounting facts ↗
      </button>
    </details>
  );
}
