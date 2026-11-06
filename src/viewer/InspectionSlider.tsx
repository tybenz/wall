import { useId } from "react";
import "./InspectionSlider.css";
import "../shared/RangeControl.css";

const levels = [
  { label: "Finished", description: "Complete wall composition" },
  {
    label: "Behind TV",
    description:
      "TV, soundbar and console removed · inspect mount, panel and outlets",
  },
  {
    label: "Behind panel",
    description:
      "Panel and bracket removed · perimeter spacers, mount spacers and lag paths",
  },
  {
    label: "At drywall",
    description: "Slats removed · spacers against existing drywall",
  },
  {
    label: "Inside wall",
    description: "Drywall removed · schematic studs, blocking and electrical",
  },
] as const;

export function InspectionSlider({
  level,
  onChange,
}: {
  level: number;
  onChange: (level: number) => void;
}) {
  const id = useId();
  return (
    <div className="inspection-control">
      <label className="inspection-label" htmlFor={id}>
        <span>Inspection depth</span>
        <strong>{levels[level].label}</strong>
      </label>
      <div className="inspection-track">
        <div className="inspection-ticks" aria-hidden="true">
          {levels.map((stop, index) => (
            <span
              key={stop.label}
              style={{ left: `${(index * 100) / (levels.length - 1)}%` }}
            />
          ))}
        </div>
        <input
          className="range-control"
          id={id}
          type="range"
          min={0}
          max={levels.length - 1}
          step={1}
          value={level}
          aria-label="Inspection depth"
          aria-valuetext={`${level + 1} of ${levels.length}: ${levels[level].label}`}
          aria-describedby={`${id}-description`}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
      <span className="visually-hidden" id={`${id}-description`}>
        {levels[level].description}
      </span>
    </div>
  );
}
