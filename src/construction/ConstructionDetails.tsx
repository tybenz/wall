import { fieldGroup } from "../designer/FieldCatalog";
import { exportConstructionSvg } from "./ConstructionExport";
import { useMemo } from "react";
import type { Project, FieldId } from "../designer/DesignerTypes";
import type { Assembly } from "../geometry/AssemblyTypes";
import type { ViewController, ViewSnapshot } from "../viewer/ViewStore";
import { formatInches } from "../shared/Units";
import {
  constructionViews,
  resolveConstructionSection,
} from "./ConstructionSections";
import { SectionDrawing } from "./SectionDrawing";
import "./ConstructionDetails.css";
export function ConstructionDetails({
  project,
  assembly,
  view,
  state,
}: {
  project: Project;
  assembly: Assembly;
  view: ViewController;
  state: ViewSnapshot;
}) {
  const section = useMemo(
    () => resolveConstructionSection(project, assembly, state.constructionView),
    [project, assembly, state.constructionView],
  );
  const edit = (field: FieldId) => view.openEditor(fieldGroup(field), field);
  const exportSheet = () => {
    const url = URL.createObjectURL(
      new Blob([exportConstructionSvg(project, state.units)], {
        type: "image/svg+xml",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "WallConstruction.svg";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    view.notify(
      "Construction sheet exported with all four views and unresolved measurements.",
    );
  };
  return (
    <section className="construction-details" aria-label="Construction details">
      <div className="construction-tabs" aria-label="Construction views">
        <button className="construction-export" onClick={exportSheet}>
          Export construction sheet ↓
        </button>
        {constructionViews.map((v) => (
          <button
            key={v.id}
            aria-pressed={state.constructionView === v.id}
            onClick={() => view.setConstructionView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div className="construction-heading">
        <div>
          <h2>{section.title}</h2>
          <p>{section.description}</p>
        </div>
        <button
          onClick={() =>
            edit(
              state.constructionView === "electrical"
                ? "distance:boxDepth"
                : "studs",
            )
          }
        >
          {state.constructionView === "electrical"
            ? "Edit electrical"
            : "Edit framing"}{" "}
          ↗
        </button>
      </div>
      <div className="construction-body">
        <SectionDrawing section={section} units={state.units} />
        <div className="construction-schedule">
          <h3>Construction dimensions</h3>
          <p>↗ opens the matching drawer input.</p>
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
            Confirm measurements in the drawer as you verify them. Lag paths
            show proposed positions and embedment, not a bolt specification.
          </p>
        </div>
      </div>
    </section>
  );
}
