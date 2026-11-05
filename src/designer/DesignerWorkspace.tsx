import { useDesignerController } from "./DesignerContext";
import { useDesigner } from "./UseDesigner";
import { DepthSchedule } from "./DepthSchedule";
import { FoundationInputs } from "./FoundationInputs";
import { formatInches } from "../shared/Units";

export function DesignerWorkspace() {
  const controller = useDesignerController();
  const { project, assembly } = useDesigner(controller.store);
  return (
    <main>
      <header>
        <span className="eyebrow">WALL / MILESTONE 01</span>
        <h1>A measured foundation.</h1>
        <p>One spatial model for the finished wall and everything behind it.</p>
      </header>
      <div className="summary">
        <span>{formatInches(project.distances.wallWidth.mm)} wall</span>
        <span>
          {formatInches(project.products.slats.depth.mm)} slat thickness
        </span>
        <span>{assembly.coverage.cartons} cartons · nominal coverage</span>
      </div>
      <div className="workspace">
        <DepthSchedule assembly={assembly} />
        <FoundationInputs
          distances={project.distances}
          onChange={controller.setDistance}
        />
      </div>
      <section className="card notes">
        <h2>Still provisional</h2>
        <p>
          All placements are exploratory. Product dimensions retain their
          sources; wall measurements and assembly assumptions need confirmation.
        </p>
        <ul>
          {assembly.findings.map((finding) => (
            <li key={finding.code}>{finding.message}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
