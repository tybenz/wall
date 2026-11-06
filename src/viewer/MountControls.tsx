import { mountPresets, type MountPreview } from "../geometry/MountMotion";
import type { ViewController, ViewSnapshot } from "./ViewStore";
import { formatInches } from "../shared/Units";
import "./MountControls.css";
export function MountControls({
  view,
  state,
  preview,
}: {
  view: ViewController;
  state: ViewSnapshot;
  preview: MountPreview;
}) {
  const fmt = (mm: number) =>
    state.units === "in" ? formatInches(mm) : `${Number(mm.toFixed(1))} mm`;
  return (
    <section className="mount-controls" aria-label="Mount position preview">
      <div className="mount-control-row">
        <span className="eyebrow">MOUNT POSITION</span>
        <div className="mount-presets" aria-label="Mount position">
          {mountPresets.map(({ id, label }) => (
            <button
              key={id}
              aria-pressed={state.mountPreset === id}
              onClick={() => view.setMountPreset(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          className="mount-settings"
          onClick={() =>
            view.openEditor("structure", "distance:mountExtension")
          }
        >
          Edit mount range ↗
        </button>
      </div>
      <p className="mount-readout" aria-live="polite">
        {state.level < 2 ? (
          <>
            <span>
              Extra extension{" "}
              <strong>{fmt(preview.transform.extension)}</strong>
            </span>
            <span>
              Swivel{" "}
              <strong>
                {Math.round(
                  (Math.abs(preview.transform.angle) * 180) / Math.PI,
                )}
                °
              </strong>
            </span>
            <span className={preview.rearClearance < 0 ? "warning-text" : ""}>
              Panel-plane clearance{" "}
              <strong>{fmt(preview.rearClearance)}</strong>
            </span>
            <span>
              Above console top <strong>{fmt(preview.consoleGap)}</strong>
            </span>
          </>
        ) : (
          <span>Moving assembly hidden at this inspection depth.</span>
        )}
        <small>Unverified mount range · schematic arm</small>
      </p>
    </section>
  );
}
