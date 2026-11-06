import { useEffect, useState } from "react";
import type { FieldId } from "../designer/DesignerTypes";
import type { ViewController } from "../viewer/ViewStore";
import { inches, toInches } from "../shared/Units";
import { DistanceSlider } from "./DistanceSlider";
import { getSliderRange } from "./SliderRanges";
export function DistanceInput({
  mode = "layout",
  editRequest = 0,
  source,
  field,
  label,
  mm,
  note,
  onChange,
  view,
  units,
  confirmed,
  onConfirm,
}: {
  mode?: "layout" | "fact";
  editRequest?: number;
  source?: string;
  field: Exclude<FieldId, "studs" | "railPositions">;
  label: string;
  mm: number;
  note: string;
  onChange: (mm: number) => void;
  view: ViewController;
  units: "in" | "mm";
  confirmed?: boolean;
  onConfirm?: (confirmed: boolean) => void;
}) {
  const format = (value: number) =>
    String(Number((units === "in" ? toInches(value) : value).toFixed(3)));
  const [editing, setEditing] = useState(mode === "layout" || editRequest > 0);
  useEffect(() => {
    if (editRequest > 0) setEditing(true);
  }, [editRequest]);
  const [draft, setDraft] = useState(format(mm));
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!focused) setDraft(format(mm));
  }, [mm, units, focused]);
  const id = `field-${field}`;
  return (
    <div
      className={`distance-field ${mode === "fact" ? "fact-field" : "layout-field"} ${editing ? "is-editing" : "is-reference"}`}
    >
      <div className="field-heading">
        <label htmlFor={id}>{label}</label>
        {mode === "fact" && (
          <button
            type="button"
            className="fact-edit"
            aria-label={`${editing ? "Done editing" : "Edit"} ${label}`}
            onClick={() => {
              setEditing(!editing);
              if (!editing) {
                const input = document.getElementById(
                  id,
                ) as HTMLInputElement | null;
                input?.focus();
                input?.select();
              }
            }}
          >
            {editing ? "Done" : "Edit"}
          </button>
        )}
      </div>
      {mode === "fact" && (
        <span
          className={`fact-status ${confirmed ? "verified" : "unverified"}`}
        >
          {confirmed ? "Verified" : "Needs verification"}
          {source ? ` · ${source}` : ""}
        </span>
      )}
      <div className="distance-control">
        <input
          id={id}
          data-field={field}
          type="text"
          readOnly={!editing}
          tabIndex={editing ? 0 : -1}
          inputMode="decimal"
          value={draft}
          aria-invalid={!!error}
          aria-describedby={`${id}-note`}
          onFocus={() => {
            setFocused(true);
            view.focus(field);
          }}
          onBlur={() => {
            setFocused(false);
            view.focus(null);
            setError("");
            setDraft(format(mm));
          }}
          onChange={(event) => {
            const value = event.target.value;
            setDraft(value);
            if (value.trim() === "" || !Number.isFinite(Number(value))) {
              setError("Enter a number.");
              return;
            }
            try {
              onChange(units === "in" ? inches(Number(value)) : Number(value));
              setError("");
            } catch (cause) {
              setError(
                cause instanceof Error ? cause.message : "Invalid distance.",
              );
            }
          }}
        />
        <span>{units === "in" ? "in" : "mm"}</span>
      </div>
      {mode === "layout" && (
        <DistanceSlider
          label={label}
          mm={mm}
          range={getSliderRange(field, mm)}
          units={units}
          onFocus={() => view.focus(field)}
          onBlur={() => view.focus(null)}
          onChange={(value) => {
            try {
              onChange(value);
              setDraft(format(value));
              setError("");
            } catch (cause) {
              setError(
                cause instanceof Error ? cause.message : "Invalid distance.",
              );
            }
          }}
        />
      )}
      <small id={`${id}-note`} className={error ? "field-error" : ""}>
        {error || (mode === "fact" ? `Reference note: ${note}` : note)}
      </small>
      {onConfirm && (
        <label className="confirmation">
          <input
            type="checkbox"
            aria-label={`Verified ${label}`}
            checked={confirmed}
            onChange={(event) => onConfirm(event.target.checked)}
          />
          Verified against the actual part or measurement
        </label>
      )}
    </div>
  );
}
