import type { ViewController, ViewSnapshot, CameraPreset } from "./ViewStore";
import { InspectionSlider } from "./InspectionSlider";
export function ViewControls({
  view,
  state,
}: {
  view: ViewController;
  state: ViewSnapshot;
}) {
  return (
    <>
      <div className="viewer-controls">
        <div className="segmented" aria-label="Camera views">
          {(["front", "side", "isometric"] as CameraPreset[]).map((preset) => (
            <button
              key={preset}
              aria-pressed={state.preset === preset}
              onClick={() => view.setPreset(preset)}
            >
              {preset === "isometric"
                ? "Isometric"
                : preset[0].toUpperCase() + preset.slice(1)}
            </button>
          ))}
        </div>
        <InspectionSlider level={state.level} onChange={view.setLevel} />
        <div className="zoom-controls">
          <button
            aria-label="Zoom out"
            onClick={() => view.setZoom(state.zoom - 0.2)}
          >
            −
          </button>
          <button onClick={() => view.setZoom(1)}>Fit</button>
          <button
            aria-label="Zoom in"
            onClick={() => view.setZoom(state.zoom + 0.2)}
          >
            +
          </button>
        </div>
        <button
          aria-pressed={state.dimensions}
          onClick={() => view.toggle("dimensions")}
        >
          Dimensions
        </button>
        <button className="primary" onClick={() => view.openEditor()}>
          Edit distances ↗
        </button>
      </div>
    </>
  );
}
