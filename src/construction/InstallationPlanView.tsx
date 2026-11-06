import { useMemo } from "react";
import { fieldGroup, verificationItems } from "../designer/FieldCatalog";
import type { FieldId } from "../designer/DesignerTypes";
import { formatInches } from "../shared/Units";
import type { ConstructionProps } from "./ConstructionDetails";
import { resolveInstallationPlan } from "./InstallationPlan";
import { installationPlanSvg } from "./InstallationPlanSvg";
import "./InstallationPlan.css";

export function InstallationPlanView({ project, assembly, state, view }: ConstructionProps) {
  const plan = useMemo(() => resolveInstallationPlan(project, assembly), [project, assembly]);
  const svg = useMemo(() => installationPlanSvg(plan, state.units), [plan, state.units]);
  const fmt = (mm: number) => state.units === "in" ? formatInches(mm) : `${Number(mm.toFixed(1))} mm`;
  const edit = (field: FieldId) => view.openEditor(fieldGroup(field), field);
  const facts = verificationItems(project).filter((item) => plan.unverified.includes(item.field));
  const download = () => {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "InstallationHeightPlan.svg";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const status = (fields: readonly FieldId[]) => fields.length
    ? <details className="installation-dependencies">
        <summary>Verify {fields.length} {fields.length === 1 ? "fact" : "facts"}</summary>
        {fields.map((field) => <button key={field} onClick={() => edit(field)}>
          {facts.find((f) => f.field === field)?.label ?? field} ↗
        </button>)}
      </details>
    : <span className="installation-known">No unverified inputs</span>;
  return (
    <div className="installation-plan">
      <div className="installation-heading">
        <div>
          <h2>Installation height plan</h2>
          <p>Measure every height from finished floor, and every X from the left wall edge. The numbered callouts match the list below.</p>
        </div>
        <button onClick={download}>Export height plan SVG ↓</button>
      </div>
      <p className="installation-summary">
        Blocking: {plan.blockingMode === "follow-mount" ? "follows mount lag rows" : "fixed at manual floor height"}.
        {plan.unverified.length ? ` ${plan.unverified.length} relevant physical facts still need verification.` : " Relevant physical facts are verified; layout values remain your choices."}
      </p>
      {!plan.hasBlocking && <p className="installation-warning">No blocking boards fit the current stud layout and blocking zone. <button onClick={() => edit("studs")}>Check framing ↗</button></p>}
      <div className="installation-figure" dangerouslySetInnerHTML={{ __html: svg }} />
      <h3>Heights from finished floor</h3>
      <div className="schedule-scroll">
        <table>
          <thead><tr><th>Mark</th><th>Reference point</th><th>Height</th><th>Depends on</th><th>Adjust</th></tr></thead>
          <tbody>{plan.marks.map((mark) => <tr key={mark.id}>
            <th>{mark.id}</th><td>{mark.label}</td><td className="installation-number">{fmt(mark.height)}</td>
            <td>{status(mark.unverified)}</td>
            <td><button aria-label={`Adjust ${mark.label}`} onClick={() => edit(mark.control)}>↗</button></td>
          </tr>)}</tbody>
        </table>
      </div>
      <h3>Panel, blocking & spacer locations</h3>
      <p>X and bottom Y locate each part’s lower-left corner, looking from the room. IDs match the elevation and cut schedule.</p>
      <div className="schedule-scroll">
        <table>
          <thead><tr><th>Part</th><th>X from wall left</th><th>Bottom Y</th><th>Top Y</th><th>Width × height</th><th>Depends on</th><th>Adjust</th></tr></thead>
          <tbody>{plan.footprints.map((part) => <tr key={part.id}>
            <th>{part.id} · {part.label}</th>
            <td className="installation-number">{fmt(part.bounds.x)}</td>
            <td className="installation-number">{fmt(part.bounds.y)}</td>
            <td className="installation-number">{fmt(part.bounds.y + part.bounds.height)}</td>
            <td>{fmt(part.bounds.width)} × {fmt(part.bounds.height)}</td>
            <td>{status(part.unverified)}</td>
            <td><button aria-label={`Adjust ${part.label} ${part.id}`} onClick={() => edit(part.control)}>↗</button></td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
