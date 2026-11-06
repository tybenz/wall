import { useEffect, useRef } from "react";
import type { DesignerController } from "../designer/DesignerController";
import type { DesignerSnapshot } from "../designer/DesignerStore";
import {
  editorGroups,
  type EditorGroup,
} from "../designer/DistanceDefinitions";
import { verificationItems } from "../designer/FieldCatalog";
import type { ViewController, ViewSnapshot } from "../viewer/ViewStore";
import { CategoryEditor } from "./CategoryEditor";
import { VerificationList } from "./VerificationList";
import "./DimensionsDrawer.css";
export function DimensionsDrawer({
  controller,
  snapshot,
  view,
  state,
}: {
  controller: DesignerController;
  snapshot: DesignerSnapshot;
  view: ViewController;
  state: ViewSnapshot;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!state.drawerOpen) return;
    const body = ref.current?.querySelector<HTMLElement>(".drawer-body");
    if (!state.focusField) {
      body?.scrollTo({ top: 0 });
      return;
    }
    const element = ref.current?.querySelector<
      HTMLInputElement | HTMLTextAreaElement
    >(`[data-field="${state.focusField}"]`);
    if (body && element)
      body.scrollTo({
        top:
          body.scrollTop +
          element.getBoundingClientRect().top -
          body.getBoundingClientRect().top -
          45,
        behavior: "smooth",
      });
    element?.focus({ preventScroll: true });
    element?.select();
  }, [state.drawerOpen, state.focusRequest, state.group]);
  if (!state.drawerOpen) return null;
  const remaining = verificationItems(snapshot.project).length;
  return (
    <aside
      ref={ref}
      className="drawer"
      aria-label="Dimensions editor"
      onKeyDown={(e) => {
        if (e.key === "Escape") view.closeEditor();
      }}
    >
      <div className="drawer-heading">
        <div>
          <span className="eyebrow">YOUR ASSEMBLY</span>
          <h2>Layout & physical facts</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close dimensions editor"
          onClick={view.closeEditor}
        >
          ×
        </button>
      </div>
      <div className="drawer-navigation">
        <label htmlFor="drawer-category">Category</label>
        <select
          id="drawer-category"
          value={state.group}
          onChange={(e) => view.setGroup(e.target.value as EditorGroup)}
        >
          {editorGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
              {g.id === "verification" ? ` · ${remaining}` : ""}
            </option>
          ))}
        </select>
        {state.group !== "verification" && (
          <button
            className="verification-shortcut"
            onClick={() => view.setGroup("verification")}
          >
            Needs verification <span>{remaining}</span> ↗
          </button>
        )}
      </div>
      <div
        className="drawer-body"
        role="region"
        aria-label={editorGroups.find((g) => g.id === state.group)?.label}
      >
        {state.explanation && (
          <p className="explanation">{state.explanation}</p>
        )}
        {state.group === "verification" ? (
          <VerificationList project={snapshot.project} view={view} />
        ) : (
          <CategoryEditor
            key={state.group}
            project={snapshot.project}
            assembly={snapshot.assembly}
            controller={controller}
            view={view}
            state={state}
            group={state.group}
          />
        )}
      </div>
    </aside>
  );
}
