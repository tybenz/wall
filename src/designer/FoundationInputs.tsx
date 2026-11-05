import { useState } from "react";
import type { DistanceId, DistanceInput } from "./DesignerTypes";
import { inches, toInches } from "../shared/Units";

function DistanceField({
  id,
  label,
  input,
  onChange,
}: {
  id: DistanceId;
  label: string;
  input: DistanceInput;
  onChange: (id: DistanceId, mm: number) => void;
}) {
  const [error, setError] = useState("");
  return (
    <label className="distance-field" htmlFor={id}>
      <span>{label}</span>
      <span className="input-row">
        <input
          id={id}
          type="number"
          min="0"
          step="0.125"
          defaultValue={Number(toInches(input.mm).toFixed(6))}
          aria-describedby={`${id}-note`}
          aria-invalid={!!error}
          onBlur={(event) => {
            try {
              if (event.currentTarget.value.trim() === "")
                throw new Error("Enter a distance.");
              onChange(id, inches(Number(event.currentTarget.value)));
              setError("");
            } catch (cause) {
              setError(
                cause instanceof Error ? cause.message : "Invalid distance.",
              );
            }
          }}
        />
        <span>in</span>
      </span>
      <small id={`${id}-note`}>{error || input.note}</small>
    </label>
  );
}

const fields: readonly [DistanceId, string][] = [
  ["tvCenterHeight", "TV center above floor"],
  ["panelRearGap", "Slat face → panel rear"],
  ["tvRearGap", "Panel front → TV rear"],
];

export function FoundationInputs({
  distances,
  onChange,
}: {
  distances: Readonly<Record<DistanceId, DistanceInput>>;
  onChange: (id: DistanceId, mm: number) => void;
}) {
  return (
    <section className="card">
      <h2>Exercise the model</h2>
      <p>Temporary foundation controls. Apply a value by leaving the field.</p>
      {fields.map(([id, label]) => (
        <DistanceField
          key={id}
          id={id}
          label={label}
          input={distances[id]}
          onChange={onChange}
        />
      ))}
    </section>
  );
}
