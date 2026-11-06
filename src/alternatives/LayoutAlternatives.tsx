import { applyLayoutAlternative } from "./ApplyLayoutAlternative";
import { useState, useSyncExternalStore } from "react";
import type { DesignerController } from "../designer/DesignerController";
import type { Project } from "../designer/DesignerTypes";
import type { ViewController, ViewSnapshot } from "../viewer/ViewStore";
import { compareLayouts } from "./CompareLayouts";
import { createAlternativeController } from "./AlternativeController";
import "./LayoutAlternatives.css";
export function LayoutAlternatives({
  controller,
  project,
  view,
  state,
}: {
  controller: DesignerController;
  project: Project;
  view: ViewController;
  state: ViewSnapshot;
}) {
  const [library] = useState(() =>
    createAlternativeController({
      read: () => localStorage.getItem("wall-alternatives-v1"),
      write: (text) => localStorage.setItem("wall-alternatives-v1", text),
    }),
  );
  const saved = useSyncExternalStore(
    library.store.subscribe,
    library.store.getSnapshot,
  );
  const [name, setName] = useState("");
  const [selected, setSelected] = useState("");
  const alternative = saved.find((s) => s.name === selected);
  const changes = alternative
    ? compareLayouts(
        project,
        applyLayoutAlternative(project, alternative.project),
        state.units,
      )
    : [];
  const act = (action: () => void, message: string) => {
    try {
      action();
      view.notify(message);
    } catch (error) {
      view.notify(
        error instanceof Error
          ? error.message
          : "Could not update alternatives.",
      );
    }
  };
  return (
    <details className="layout-alternatives">
      <summary>
        Layout alternatives <span>{saved.length} saved in this browser</span>
      </summary>
      <div className="alternative-body">
        <p>
          Save a named snapshot before trying a different construction layout.
          Project export contains the current layout; these alternatives stay in
          this browser. Applying a layout keeps your current physical facts,
          part dimensions and verification status.
        </p>
        {library.getLoadError() && (
          <p role="alert">
            {library.getLoadError()} Existing saved data has been kept.
          </p>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            act(() => {
              library.save(name, project);
              setSelected(name.trim());
              setName("");
            }, "Layout alternative saved.");
          }}
        >
          <label>
            New layout name
            <input
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button type="submit">Save current as new</button>
        </form>
        {saved.length > 0 && (
          <>
            <div className="alternative-select">
              <label>
                Saved layout
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  <option value="">Choose a layout</option>
                  {saved.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                disabled={!alternative}
                onClick={() =>
                  alternative &&
                  act(
                    () => controller.applyAlternative(alternative.project),
                    `Applied ${alternative.name}.`,
                  )
                }
              >
                Apply saved layout
              </button>
              <button
                disabled={!alternative}
                onClick={() =>
                  alternative &&
                  act(
                    () => library.replace(alternative.name, project),
                    `Updated ${alternative.name}.`,
                  )
                }
              >
                Update saved from current
              </button>
            </div>
            {alternative && (
              <>
                <h3>Current compared with {alternative.name}</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Setting</th>
                      <th>Current</th>
                      <th>Saved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changes.map((difference) => (
                      <tr key={difference.label}>
                        <td>{difference.label}</td>
                        <td>{difference.current}</td>
                        <td>{difference.saved}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {changes.length === 0 && (
                  <p>All compared layout settings match.</p>
                )}
                <p>
                  Comparison shows the layout choices that will be applied.
                  Current physical facts stay unchanged.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </details>
  );
}
