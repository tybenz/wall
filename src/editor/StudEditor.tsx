import { useState } from "react";
import type { DesignerController } from "../designer/DesignerController";
import type { Project } from "../designer/DesignerTypes";
import { inches, toInches } from "../shared/Units";
export function StudEditor({
  project,
  controller,
  units,
}: {
  project: Project;
  controller: DesignerController;
  units: "in" | "mm";
}) {
  const [draft, setDraft] = useState(
    project.studs.positions
      .map((value) =>
        Number((units === "in" ? toInches(value) : value).toFixed(3)),
      )
      .join(", "),
  );
  const [error, setError] = useState("");
  return (
    <div className="stud-editor">
      <label htmlFor="field-studs">
        Stud centers from left wall edge ({units})
      </label>
      <textarea
        id="field-studs"
        data-field="studs"
        rows={3}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <small>
        Comma-separated measured offsets. Existing values are placeholders.
      </small>
      <button
        className="secondary"
        onClick={() => {
          try {
            const values =
              draft.trim() === ""
                ? []
                : draft.split(",").map((item) => {
                    if (!item.trim()) throw new Error("Remove empty entries.");
                    return units === "in" ? inches(Number(item)) : Number(item);
                  });
            controller.setStuds(values, project.studs.confirmed);
            setError("");
          } catch {
            setError("Enter up to 50 unique, finite, positive offsets.");
          }
        }}
      >
        Apply stud positions
      </button>
      <label className="confirmation">
        <input
          type="checkbox"
          checked={project.studs.confirmed}
          onChange={(event) =>
            controller.setStuds(project.studs.positions, event.target.checked)
          }
        />
        Stud locations measured on site
      </label>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
