import { useState } from "react";
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
        <ViewControls view={view} state={state} />
        <WallViewer
          project={snapshot.project}
          assembly={snapshot.assembly}
          view={view}
          state={state}
        />
        <div className="view-options">
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
        <FindingsPanel assembly={snapshot.assembly} />
        <footer>
          Explore with fixed views. Hover a dimension to inspect it; choose its
          edit button to jump to the distance.
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
