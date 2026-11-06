import { useEffect, useState } from "react";
import type { DesignerController } from "../designer/DesignerController";
import type { Project } from "../designer/DesignerTypes";
import { inches, toInches } from "../shared/Units";
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
  const [editing, setEditing] = useState(editRequest > 0);
  useEffect(() => {
    if (editRequest > 0) setEditing(true);
  }, [editRequest]);
  const [draft, setDraft] = useState(
    project.studs.positions
      .map((value) =>
        Number((units === "in" ? toInches(value) : value).toFixed(3)),
      )
      .join(", "),
  );
  const [error, setError] = useState("");
  useEffect(() => {
    if (!editing)
      setDraft(
        project.studs.positions
          .map((value) =>
            Number((units === "in" ? toInches(value) : value).toFixed(3)),
          )
          .join(", "),
      );
  }, [project.studs.positions, units, editing]);
  return (
    <div className="stud-editor">
      <label htmlFor="field-studs">
        Stud centers from left wall edge ({units})
      </label>
      <span
        className={`fact-status ${project.studs.confirmed ? "verified" : "unverified"}`}
      >
        {project.studs.confirmed ? "Verified" : "Needs verification"}
      </span>
      <button
        className="fact-edit"
        aria-label={
          editing ? "Cancel editing Stud locations" : "Edit Stud locations"
        }
        onClick={() => {
          setEditing(!editing);
          setError("");
        }}
      >
        {editing ? "Cancel" : "Edit"}
      </button>
      <textarea
        id="field-studs"
        data-field="studs"
        rows={3}
        readOnly={!editing}
        tabIndex={editing ? 0 : -1}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <small>
        Comma-separated offsets from the left wall edge. Verify the actual
        positions.
      </small>
      {editing && (
        <button
          className="secondary"
          onClick={() => {
            try {
              const values =
                draft.trim() === ""
                  ? []
                  : draft.split(",").map((item) => {
                      if (!item.trim())
                        throw new Error("Remove empty entries.");
                      return units === "in"
                        ? inches(Number(item))
                        : Number(item);
                    });
              controller.setStuds(values, false);
              setEditing(false);
              setError("");
            } catch {
              setError("Enter up to 50 unique, finite, positive offsets.");
            }
          }}
        >
          Apply stud positions
        </button>
      )}
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
