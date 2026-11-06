import { useEffect, useState } from "react";
import type { FieldId } from "../designer/DesignerTypes";
import type { ViewController } from "../viewer/ViewStore";
import { inches, toInches } from "../shared/Units";
import { DistanceSlider } from "./DistanceSlider";
import { getSliderRange } from "./SliderRanges";
export function DistanceInput({
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
  field: Exclude<FieldId, "studs">;
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
  const [draft, setDraft] = useState(format(mm));
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!focused) setDraft(format(mm));
  }, [mm, units, focused]);
  const id = `field-${field}`;
  return (
    <div className="distance-field">
      <label htmlFor={id}>{label}</label>
      <div className="distance-control">
        <input
          id={id}
          data-field={field}
          type="text"
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
      <small id={`${id}-note`} className={error ? "field-error" : ""}>
        {error || note}
      </small>
      {onConfirm && (
        <label className="confirmation">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => onConfirm(event.target.checked)}
          />
          Confirmed on site
        </label>
      )}
    </div>
  );
}
