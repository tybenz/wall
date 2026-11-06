import type { ViewController, ViewSnapshot, CameraPreset } from "./ViewStore";
export const inspectionLevels = [
  { label: "Finished", description: "Complete wall composition" },
  {
    label: "Behind TV",
    description: "TV and soundbar removed · inspect mount and panel",
  },
  {
    label: "Behind panel",
    description:
      "Panel and bracket removed · perimeter spacers, mount spacers and lag paths",
  },
  {
    label: "At drywall",
    description: "Slats removed · spacers against existing drywall",
  },
  {
    label: "Inside wall",
    description: "Drywall removed · schematic studs, blocking and electrical",
  },
] as const;
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
      <div className="inspection">
        <div className="inspection-heading">
          <span className="eyebrow">INSPECT THE ASSEMBLY</span>
          <span>{state.level + 1} / 5</span>
        </div>
        <div className="layer-buttons">
          <button
            aria-label="Previous inspection layer"
            disabled={state.level === 0}
            onClick={() => view.setLevel(state.level - 1)}
          >
            ←
          </button>
          {inspectionLevels.map((level, index) => (
            <button
              key={level.label}
              aria-pressed={state.level === index}
              onClick={() => view.setLevel(index)}
            >
              {level.label}
            </button>
          ))}
          <button
            aria-label="Next inspection layer"
            disabled={state.level === 4}
            onClick={() => view.setLevel(state.level + 1)}
          >
            →
          </button>
        </div>
        <p>{inspectionLevels[state.level].description}</p>
      </div>
    </>
  );
}
