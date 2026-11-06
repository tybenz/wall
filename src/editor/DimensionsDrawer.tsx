import { AngleInput } from "./AngleInput";
import { Fragment, useEffect, useRef } from "react";
import type { DesignerController } from "../designer/DesignerController";
import type { DesignerSnapshot } from "../designer/DesignerStore";
import type {
  DistanceId,
  ProductId,
  ProductAxis,
} from "../designer/DesignerTypes";
import {
  distanceDefinitions,
  editorGroups,
} from "../designer/DistanceDefinitions";
import type { ViewController, ViewSnapshot } from "../viewer/ViewStore";
import { DistanceInput } from "./DistanceInput";
import { StudEditor } from "./StudEditor";
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
  const { project } = snapshot;
  useEffect(() => {
    if (!state.drawerOpen || !state.focusField) return;
    const element = ref.current?.querySelector<
      HTMLInputElement | HTMLTextAreaElement
    >(`[data-field="${state.focusField}"]`);
    const body = ref.current?.querySelector<HTMLElement>(".drawer-body");
    if (body && element)
      body.scrollTo({
        top:
          body.scrollTop +
          element.getBoundingClientRect().top -
          body.getBoundingClientRect().top -
          40,
        behavior: "smooth",
      });
    element?.focus({ preventScroll: true });
    element?.select();
  }, [state.drawerOpen, state.focusRequest, state.group]);
  if (!state.drawerOpen) return null;
  return (
    <aside
      ref={ref}
      className="drawer"
      aria-label="Dimensions editor"
      onKeyDown={(event) => {
        if (event.key === "Escape") view.closeEditor();
      }}
    >
      <div className="drawer-heading">
        <div>
          <span className="eyebrow">DESIGN VARIABLES</span>
          <h2>Distances & details</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close dimensions editor"
          onClick={view.closeEditor}
        >
          ×
        </button>
      </div>
      <div className="drawer-tabs" role="tablist" aria-label="Dimension groups">
        {editorGroups.map((group) => (
          <button
            key={group.id}
            role="tab"
            aria-selected={group.id === state.group}
            onClick={() => view.setGroup(group.id)}
          >
            {group.label}
          </button>
        ))}
      </div>
      <div
        className="drawer-body"
        role="tabpanel"
        aria-label={
          editorGroups.find((group) => group.id === state.group)?.label
        }
      >
        {state.explanation && (
          <p className="explanation">{state.explanation}</p>
        )}
        {state.group === "products" &&
          Object.entries(project.products).map(([key, product]) => (
            <section key={key} className="product-editor">
              <h3>{product.name}</h3>
              <label className="finish-label">
                Finish{" "}
                <input
                  type="color"
                  aria-label={`${product.name} finish`}
                  value={product.appearance.color}
                  onChange={(event) =>
                    controller.setFinish(key as ProductId, event.target.value)
                  }
                />
              </label>
              {(["width", "height", "depth"] as ProductAxis[]).map((axis) => (
                <DistanceInput
                  key={axis}
                  field={`product:${key as ProductId}:${axis}`}
                  label={
                    key === "featurePanel" && axis !== "depth"
                      ? `Stock ${axis}`
                      : axis[0].toUpperCase() + axis.slice(1)
                  }
                  mm={product[axis].mm}
                  note={product[axis].evidence.note}
                  onChange={(value) =>
                    controller.setProductDimension(
                      key as ProductId,
                      axis,
                      value,
                    )
                  }
                  view={view}
                  units={state.units}
                />
              ))}
            </section>
          ))}
        {Object.entries(distanceDefinitions)
          .filter(([, definition]) => definition.group === state.group)
          .map(([key, definition]) => {
            const id = key as DistanceId;
            const input = project.distances[id];
            return (
              <Fragment key={id}>
                <DistanceInput
                  field={`distance:${id}`}
                  label={definition.label}
                  mm={input.mm}
                  note={input.note}
                  confirmed={input.confidence === "confirmed"}
                  onConfirm={(value) => controller.confirmDistance(id, value)}
                  onChange={(value) => controller.setDistance(id, value)}
                  view={view}
                  units={state.units}
                />
                {id === "mountExtension" && (
                  <AngleInput
                    degrees={project.mountSwivelDegrees}
                    onChange={controller.setMountSwivel}
                  />
                )}
              </Fragment>
            );
          })}
        {state.group === "placement" && (
          <label className="select-field">
            Soundbar orientation
            <select
              value={project.soundbarOrientation}
              onChange={(event) =>
                controller.setSoundbarOrientation(
                  event.target.value === "flat" ? "flat" : "vertical",
                )
              }
            >
              <option value="flat">Flat in cradle</option>
              <option value="vertical">Rotated vertically</option>
            </select>
            <small>
              Uses the same bare housing rotated 90°. Cradle and connector space
              remain unverified.
            </small>
          </label>
        )}
        {state.group === "structure" && (
          <StudEditor
            key={state.units + project.studs.positions.join(",")}
            project={project}
            controller={controller}
            units={state.units}
          />
        )}
        {state.group === "electrical" && (
          <p className="explanation">
            Box envelopes and separate power / low-voltage paths are schematic.
            Routing, access and separation require on-site review.
          </p>
        )}
      </div>
    </aside>
  );
}
