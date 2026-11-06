import { useEffect, useRef, useState } from "react";
import "../shared/RangeControl.css";
export function AngleInput({
  degrees,
  onChange,
}: {
  degrees: number;
  onChange: (degrees: number) => void;
}) {
  const [draft, setDraft] = useState(String(degrees));
  const fine = useRef(false);
  useEffect(() => setDraft(String(degrees)), [degrees]);
  const publish = (value: number) => {
    if (Number.isFinite(value) && value >= 0 && value <= 70) onChange(value);
  };
  return (
    <div className="distance-field">
      <label htmlFor="mount-swivel">Mount swivel per side</label>
      <div className="distance-control">
        <input
          id="mount-swivel"
          type="number"
          min={0}
          max={70}
          step={1}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (e.target.value.trim()) publish(Number(e.target.value));
          }}
          onBlur={() => setDraft(String(degrees))}
        />
        <span>deg</span>
      </div>
      <div className="distance-slider">
        <input
          className="range-control"
          type="range"
          min={0}
          max={70}
          step="any"
          value={degrees}
          aria-label="Mount swivel per side slider"
          aria-valuetext={`${degrees} degrees`}
          onPointerDown={(e) => {
            fine.current = e.shiftKey;
          }}
          onPointerMove={(e) => {
            fine.current = e.shiftKey;
          }}
          onKeyDown={(e) => {
            fine.current = e.shiftKey;
            if (
              ["ArrowRight", "ArrowUp", "ArrowLeft", "ArrowDown"].includes(
                e.key,
              )
            ) {
              e.preventDefault();
              publish(
                Math.max(
                  0,
                  Math.min(
                    70,
                    degrees +
                      (["ArrowRight", "ArrowUp"].includes(e.key) ? 1 : -1) *
                        (e.shiftKey ? 1 : 5),
                  ),
                ),
              );
            }
          }}
          onChange={(e) => {
            const step = fine.current ? 1 : 5;
            publish(Math.round(Number(e.target.value) / step) * step);
          }}
        />
        <div className="slider-scale" aria-hidden="true">
          <span>0°</span>
          <span>70°</span>
        </div>
      </div>
      <small>
        Provisional rotation about the TV rear center. 5° steps; Shift for 1°.
        Actual articulation limits are unmeasured.
      </small>
    </div>
  );
}
