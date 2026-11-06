import { useMemo } from "react";
import { fieldGroup } from "../designer/FieldCatalog";
import type { FieldId } from "../designer/DesignerTypes";
import { ElectricalPartSelector } from "../editor/ElectricalPartSelector";
import { formatInches } from "../shared/Units";
import {
  resolveConstructionSection,
  type ConstructionView,
} from "./ConstructionSections";
import { SectionDrawing } from "./SectionDrawing";
import type { ConstructionProps } from "./ConstructionDetails";
export function ConstructionInspection({
  project,
  assembly,
  view,
  state,
  viewId,
}: ConstructionProps & { viewId: Exclude<ConstructionView, "schedule"> }) {
  const section = useMemo(
    () =>
      resolveConstructionSection(
        project,
        assembly,
        viewId,
        state.electricalPart,
      ),
    [project, assembly, viewId, state.electricalPart],
  );
  const edit = (field: FieldId) => view.openEditor(fieldGroup(field), field);
  const target: FieldId =
    viewId === "electrical"
      ? `electrical:${state.electricalPart}:bodyDepth`
      : viewId === "rails"
        ? "railPositions"
        : viewId === "mount"
          ? "distance:tvTopToMountHole"
          : "studs";
  return (
    <>
      {viewId === "electrical" && (
        <div className="construction-part-selector">
          <ElectricalPartSelector state={state} view={view} />
        </div>
      )}
      <div className="construction-heading">
        <div>
          <h2>{section.title}</h2>
          <p>{section.description}</p>
        </div>
        <button onClick={() => edit(target)}>
          {viewId === "electrical"
            ? "Edit component"
            : viewId === "rails"
              ? "Choose rail position"
              : viewId === "mount"
                ? "Edit mount facts"
                : "Edit framing"}{" "}
          ↗
        </button>
      </div>
      <div className="construction-body">
        <SectionDrawing section={section} units={state.units} />
        <div className="construction-schedule">
          <h3>Construction dimensions</h3>
          <p>
            ↗ opens the matching drawer input. Derived heights are calculated
            from the chosen layout and current physical facts.
          </p>
          <dl>
            {section.measures.map((m, i) => (
              <div key={`${m.label}-${i}`}>
                <dt>{m.label}</dt>
                <dd>
                  {state.units === "in"
                    ? formatInches(m.mm)
                    : `${Number(m.mm.toFixed(1))} mm`}
                  {m.field && (
                    <button
                      aria-label={`Edit ${m.label}`}
                      onClick={() => edit(m.field!)}
                    >
                      ↗
                    </button>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <p>
            Verify physical facts before transferring coordinates to the wall.
            Lag paths and crossing marks are proposed geometry.
          </p>
        </div>
      </div>
    </>
  );
}
