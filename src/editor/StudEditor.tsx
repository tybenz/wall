import type { Project } from "../designer/DesignerTypes";
import type { DesignerController } from "../designer/DesignerController";
import { OffsetListEditor } from "./OffsetListEditor";
export function StudEditor({
  project,
  controller,
  units,
  editRequest = 0,
}: {
  project: Project;
  controller: DesignerController;
  units: "in" | "mm";
  editRequest?: number;
}) {
  return (
    <OffsetListEditor
      field="studs"
      label="Stud centers from left wall edge"
      values={project.studs.positions}
      confirmed={project.studs.confirmed}
      onApply={(values) => controller.setStuds(values)}
      onVerify={(verified) =>
        controller.setStuds(project.studs.positions, verified)
      }
      units={units}
      editRequest={editRequest}
      note="Comma-separated centers from the left wall edge. Verify actual stud locations."
    />
  );
}
