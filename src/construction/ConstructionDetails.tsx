import { exportConstructionSvg } from "./ConstructionExport";
import { exportConstructionScheduleCsv } from "./ConstructionSchedule";
import { ConstructionScheduleView } from "./ConstructionScheduleView";
import { ConstructionInspection } from "./ConstructionInspection";
import { constructionViews } from "./ConstructionSections";
import type { Project } from "../designer/DesignerTypes";
import type { Assembly } from "../geometry/AssemblyTypes";
import type { ViewController, ViewSnapshot } from "../viewer/ViewStore";
import "./ConstructionDetails.css";
export type ConstructionProps = {
  project: Project;
  assembly: Assembly;
  view: ViewController;
  state: ViewSnapshot;
};
export function ConstructionDetails(props: ConstructionProps) {
  const { project, assembly, view, state } = props;
  const download = (format: "svg" | "csv") => {
    const contents =
      format === "svg"
        ? exportConstructionSvg(project, state.units)
        : exportConstructionScheduleCsv(project, assembly, state.units);
    const url = URL.createObjectURL(
      new Blob([contents], {
        type: format === "svg" ? "image/svg+xml" : "text/csv;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download =
      format === "svg"
        ? "WallConstruction.svg"
        : "WallConstructionSchedule.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    view.notify(
      format === "svg"
        ? "Construction views, schedule and unresolved measurements exported."
        : "Construction schedule exported.",
    );
  };
  return (
    <section className="construction-details" aria-label="Construction details">
      <div className="construction-tabs" aria-label="Construction views">
        {constructionViews.filter((v) => v.id !== "electrical").map((v) => (
          <button
            key={v.id}
            aria-pressed={state.constructionView === v.id}
            onClick={() => view.setConstructionView(v.id)}
          >
            {v.label}
          </button>
        ))}
        <button
          aria-pressed={state.constructionView === "schedule"}
          onClick={() => view.setConstructionView("schedule")}
        >
          Cut & drilling schedule
        </button>
        <button className="construction-export" onClick={() => download("svg")}>
          Export sheet ↓
        </button>
        <button className="construction-export" onClick={() => download("csv")}>
          Export schedule CSV ↓
        </button>
      </div>
      {state.constructionView === "schedule" ? (
        <ConstructionScheduleView {...props} />
      ) : (
        <ConstructionInspection {...props} viewId={state.constructionView} />
      )}
    </section>
  );
}
