import { LayoutAlternatives } from "../alternatives/LayoutAlternatives";
import { ConstructionDetails } from "../construction/ConstructionDetails";
import { resolveMountPreview } from "../geometry/MountMotion";
import { MountControls } from "../viewer/MountControls";
import { useMemo, useState } from "react";
import { useDesignerController } from "./DesignerContext";
import { useDesigner } from "./UseDesigner";
import { createViewController } from "../viewer/ViewStore";
import { useView } from "../viewer/UseView";
import { WallViewer } from "../viewer/WallViewer";
import { ViewControls } from "../viewer/ViewControls";
import { DimensionsDrawer } from "../editor/DimensionsDrawer";
import { ProjectToolbar } from "./ProjectToolbar";
import { FindingsPanel } from "./FindingsPanel";
import { formatInches } from "../shared/Units";
export function DesignerWorkspace() {
  const controller = useDesignerController();
  const snapshot = useDesigner(controller.store);
  const [view] = useState(createViewController);
  const state = useView(view);
  const preview = useMemo(
    () =>
      resolveMountPreview(
        snapshot.project,
        snapshot.assembly,
        state.mountPreset,
      ),
    [snapshot.project, snapshot.assembly, state.mountPreset],
  );
  return (
    <main className={`application ${state.drawerOpen ? "has-drawer" : ""}`}>
      <header className="topbar">
        <a className="wordmark" href={import.meta.env.BASE_URL}>
          wall<span> / </span>
          <small>parametric studio</small>
        </a>
        <ProjectToolbar controller={controller} view={view} />
      </header>
      <div className="workspace-content">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">YOUR SPACE, IN PROPORTION</span>
            <h1>TV feature wall</h1>
          </div>
          <div className="project-meta">
            <span>
              {formatInches(snapshot.project.distances.wallWidth.mm)} ×{" "}
              {formatInches(snapshot.project.distances.wallHeight.mm)}
            </span>
            <span>
              {snapshot.assembly.coverage.cartons} cartons · nominal coverage
            </span>
          </div>
        </div>
        <LayoutAlternatives
          controller={controller}
          project={snapshot.project}
          view={view}
          state={state}
        />
        <div className="workspace-mode">
          <div className="segmented" aria-label="Workspace">
            <button
              aria-pressed={state.workspace === "assembly"}
              onClick={() => view.setWorkspace("assembly")}
            >
              Assembly
            </button>
            <button
              aria-pressed={state.workspace === "construction"}
              onClick={() => view.setWorkspace("construction")}
            >
              Construction details
            </button>
          </div>
          <p>
            {state.workspace === "assembly"
              ? "Layout, layers and mount positions"
              : "Framing, electrical and wall attachment sections"}
          </p>
        </div>
        {state.workspace === "construction" ? (
          <ConstructionDetails
            project={snapshot.project}
            assembly={snapshot.assembly}
            view={view}
            state={state}
          />
        ) : (
          <>
            <ViewControls view={view} state={state} />
            <MountControls view={view} state={state} preview={preview} />
            <WallViewer
              project={snapshot.project}
              assembly={snapshot.assembly}
              preview={preview}
              view={view}
              state={state}
            />
          </>
        )}
        <div className="view-options">
          {state.workspace === "assembly" && (
            <>
              <label>
                <input
                  type="checkbox"
                  checked={state.level < 4 && state.showSupports}
                  disabled={state.level === 4}
                  onChange={() => view.toggle("showSupports")}
                />
                Supports
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={state.showElectrical}
                  onChange={() => view.toggle("showElectrical")}
                />
                Electrical
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={state.screenOn}
                  onChange={() => view.toggle("screenOn")}
                />
                Screen artwork
              </label>
            </>
          )}
          <label className="units-label">
            Units
            <select
              aria-label="Display units"
              value={state.units}
              onChange={(event) =>
                view.setUnits(event.target.value === "mm" ? "mm" : "in")
              }
            >
              <option value="in">inches</option>
              <option value="mm">millimeters</option>
            </select>
          </label>
        </div>
        <FindingsPanel
          assembly={
            state.workspace === "construction"
              ? snapshot.assembly
              : preview.assembly
          }
        />
        <footer>
          {state.workspace === "construction"
            ? "Choose a fixed construction section. Use ↗ beside a dimension to edit its source."
            : "Explore with fixed views. Hover a dimension to inspect it; choose its edit button to jump to the distance."}
        </footer>
      </div>
      <DimensionsDrawer
        controller={controller}
        snapshot={snapshot}
        view={view}
        state={state}
      />
      {state.notice && (
        <div className="toast" role="status">
          <span>{state.notice}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => view.notify(null)}
          >
            ×
          </button>
        </div>
      )}
    </main>
  );
}
