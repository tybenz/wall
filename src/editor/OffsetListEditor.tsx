import { useEffect, useState } from "react";
import { inches, toInches } from "../shared/Units";
export function OffsetListEditor({
  field,
  label,
  values,
  confirmed,
  onApply,
  onVerify,
  units,
  editRequest = 0,
  note,
}: {
  field: "studs" | "railPositions";
  label: string;
  values: readonly number[];
  confirmed: boolean;
  onApply: (values: readonly number[]) => void;
  onVerify: (confirmed: boolean) => void;
  units: "in" | "mm";
  editRequest?: number;
  note: string;
}) {
  const format = () =>
    values
      .map((v) => Number((units === "in" ? toInches(v) : v).toFixed(3)))
      .join(", ");
  const [editing, setEditing] = useState(editRequest > 0),
    [draft, setDraft] = useState(format),
    [error, setError] = useState("");
  useEffect(() => {
    if (editRequest > 0) setEditing(true);
  }, [editRequest]);
  useEffect(() => {
    if (!editing) setDraft(format());
  }, [values, units, editing]);
  return (
    <div className="stud-editor">
      <div className="field-heading">
        <label htmlFor={`field-${field}`}>
          {label} ({units})
        </label>
        <button
          className="fact-edit"
          aria-label={`${editing ? "Cancel editing" : "Edit"} ${label}`}
          onClick={() => {
            setEditing(!editing);
            setError("");
          }}
        >
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>
      <span className={`fact-status ${confirmed ? "verified" : "unverified"}`}>
        {confirmed ? "Verified" : "Needs verification"}
      </span>
      <textarea
        id={`field-${field}`}
        data-field={field}
        rows={3}
        readOnly={!editing}
        tabIndex={editing ? 0 : -1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <small>{note}</small>
      {editing && (
        <button
          onClick={() => {
            try {
              const next =
                draft.trim() === ""
                  ? []
                  : draft.split(",").map((s) => {
                      if (!s.trim() || !Number.isFinite(Number(s)))
                        throw new Error("Enter comma-separated numbers.");
                      return units === "in" ? inches(Number(s)) : Number(s);
                    });
              onApply(next);
              setEditing(false);
              setError("");
            } catch (cause) {
              setError(
                cause instanceof Error ? cause.message : "Invalid offsets.",
              );
            }
          }}
        >
          Apply {label.toLowerCase()}
        </button>
      )}
      <label className="confirmation">
        <input
          type="checkbox"
          aria-label={`Verified ${label}`}
          checked={confirmed}
          onChange={(e) => onVerify(e.target.checked)}
        />
        Verified against actual measurements
      </label>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
