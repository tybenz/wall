import { ElectricalPlanner } from "./ElectricalPlanner";
import { RailPositionEditor } from "./RailPositionEditor";
import { BlockingPlanControls } from "./BlockingPlanControls";
import { MountHeightChain } from "./MountHeightChain";
import type { EditorGroup } from "../designer/DistanceDefinitions";
import { fieldGroup, productGroups } from "../designer/FieldCatalog";
import type { ProductId } from "../designer/DesignerTypes";
import type { Assembly } from "../geometry/AssemblyTypes";
import { formatInches } from "../shared/Units";
import { mountPresets } from "../geometry/MountMotion";
import { editorSections } from "./EditorSections";
import { FieldEditor, type EditorProps } from "./FieldEditor";
import { StudEditor } from "./StudEditor";
import { AngleInput } from "./AngleInput";
import { calculatedValues } from "./CalculatedValues";
export function CategoryEditor(
  props: EditorProps & {
    group: Exclude<EditorGroup, "verification">;
    assembly: Assembly;
  },
) {
  const { group, project, controller, view, state, assembly } = props;
  const productId = (Object.keys(productGroups) as ProductId[]).find(
    (id) => productGroups[id] === group,
  );
  if (group === "electrical") return <ElectricalPlanner {...props} />;
  return (
    <>
      {editorSections(group).map((section) => (
        <section className="editor-section" key={section.label}>
          <h3>{section.label}</h3>
          {group === "wall" && section.label === "Blocking plan" && (
            <BlockingPlanControls {...props} />
          )}
          {section.label === "Layout" && productId && (
            <label className="category-finish">
              Finish
              <input
                type="color"
                aria-label={`${project.products[productId].name} finish`}
                value={project.products[productId].appearance.color}
                onChange={(e) =>
                  controller.setFinish(productId, e.target.value)
                }
              />
            </label>
          )}
          {section.label === "Layout" && group === "soundbar" && (
            <label className="select-field">
              Soundbar orientation
              <select
                value={project.soundbarOrientation}
                onChange={(e) =>
                  controller.setSoundbarOrientation(
                    e.target.value === "flat" ? "flat" : "vertical",
                  )
                }
              >
                <option value="flat">Flat in cradle</option>
                <option value="vertical">Rotated vertically</option>
              </select>
            </label>
          )}
          {section.label === "Material dimensions" && productId && (
            <p className="section-intro">
              Dimensions of {project.products[productId].name.toLowerCase()}.
              Edit to correct a measurement or reflect different selected stock.
            </p>
          )}
          {section.label === "Physical dimensions" && productId && (
            <p className="section-intro">
              Dimensions of the selected{" "}
              {project.products[productId].name.toLowerCase()} and its hardware.
              Unverified dimensions still need checking.
            </p>
          )}
          {section.fields
            .filter(
              (field) =>
                !(
                  field === "distance:blockingBottom" &&
                  project.blockingPlacement === "follow-mount"
                ) &&
                (!field.startsWith("electrical:") ||
                  field.split(":")[1] === state.electricalPart),
            )
            .map((field) =>
              field === "railPositions" ? (
                <RailPositionEditor key="railPositions" {...props} />
              ) : field === "studs" ? (
                <StudEditor
                  key={`studs:${state.units}`}
                  project={project}
                  controller={controller}
                  units={state.units}
                  editRequest={
                    state.focusField === "studs" ? state.focusRequest : 0
                  }
                />
              ) : (
                <FieldEditor key={field} {...props} field={field} />
              ),
            )}
          {group === "tv" && section.label === "Layout" && (
            <MountHeightChain
              assembly={assembly}
              state={state}
              view={view}
              project={project}
              controller={controller}
            />
          )}
          {section.label === "Position previews" && (
            <>
              <AngleInput
                degrees={project.mountSwivelDegrees}
                onChange={controller.setMountSwivel}
              />
              <div className="drawer-mount-presets">
                {mountPresets.map((p) => (
                  <button
                    key={p.id}
                    aria-pressed={state.mountPreset === p.id}
                    onClick={() => view.setMountPreset(p.id)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </>
          )}
          {section.label.startsWith("Calculated") && (
            <dl className="calculated-values">
              {calculatedValues(assembly, group).map((value, i) => (
                <div key={`${value.label}-${i}`}>
                  <dt>{value.label}</dt>
                  <dd>
                    {value.mm === undefined
                      ? value.text
                      : state.units === "in"
                        ? formatInches(value.mm)
                        : `${Number(value.mm.toFixed(1))} mm`}
                  </dd>
                  <small>{value.explanation}</small>
                  {value.controls && (
                    <div className="calculated-controls">
                      {value.controls.map((control) => (
                        <button
                          key={control.field}
                          onClick={() =>
                            view.openEditor(
                              fieldGroup(control.field),
                              control.field,
                            )
                          }
                        >
                          {control.label} ↗
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </dl>
          )}
        </section>
      ))}
    </>
  );
}
