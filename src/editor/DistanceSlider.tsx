import { useEffect, useId, useRef, useState } from "react";
import { formatInches } from "../shared/Units";
import { sliderStep, snapSliderValue, type SliderRange } from "./SliderRanges";
import "./DistanceSlider.css";
import "../shared/RangeControl.css";

export function DistanceSlider({
  label,
  mm,
  range,
  units,
  onChange,
  onFocus,
  onBlur,
}: {
  label: string;
  mm: number;
  range: SliderRange;
  units: "in" | "mm";
  onChange: (mm: number) => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const fineRef = useRef(false);
  const hintId = useId();
  const [fine, setFine] = useState(false);
  const [heldRange, setHeldRange] = useState<SliderRange | null>(null);
  const bounds = heldRange ?? range;
  const setPrecision = (shift: boolean) => {
    fineRef.current = shift;
    setFine(shift);
  };
  useEffect(() => {
    if (!heldRange) return;
    const modifier = (event: KeyboardEvent) => setPrecision(event.shiftKey);
    const clear = () => {
      setPrecision(false);
      setHeldRange(null);
    };
    window.addEventListener("keydown", modifier);
    window.addEventListener("keyup", modifier);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", modifier);
      window.removeEventListener("keyup", modifier);
      window.removeEventListener("blur", clear);
    };
  }, [heldRange]);
  const format = (value: number) =>
    units === "in" ? formatInches(value) : `${Number(value.toFixed(3))} mm`;
  return (
    <div className="distance-slider">
      <input
        className="range-control"
        type="range"
        min={bounds.min}
        max={bounds.max}
        step="any"
        value={mm}
        aria-label={`${label} slider`}
        aria-valuetext={format(mm)}
        aria-describedby={hintId}
        onFocus={() => {
          setHeldRange(range);
          onFocus();
        }}
        onBlur={() => {
          setHeldRange(null);
          setPrecision(false);
          onBlur();
        }}
        onPointerDown={(event) => setPrecision(event.shiftKey)}
        onPointerMove={(event) => setPrecision(event.shiftKey)}
        onChange={(event) =>
          onChange(
            snapSliderValue(
              Number(event.target.value),
              fineRef.current,
              bounds,
            ),
          )
        }
        onKeyDown={(event) => {
          const directions: Record<string, number> = {
            ArrowRight: 1,
            ArrowUp: 1,
            ArrowLeft: -1,
            ArrowDown: -1,
            PageUp: 10,
            PageDown: -10,
          };
          const direction = directions[event.key];
          if (
            direction !== undefined ||
            event.key === "Home" ||
            event.key === "End"
          ) {
            event.preventDefault();
            setPrecision(event.shiftKey);
            const target =
              event.key === "Home"
                ? bounds.min
                : event.key === "End"
                  ? bounds.max
                  : mm + direction * sliderStep(event.shiftKey);
            onChange(
              Math.max(
                bounds.min,
                Math.min(bounds.max, Number(target.toFixed(6))),
              ),
            );
          }
        }}
      />
      <div className="slider-scale" aria-hidden="true">
        <span>{format(bounds.min)}</span>
        <span>{format(bounds.max)}</span>
      </div>
      <small
        id={hintId}
        className={fine ? "slider-hint is-fine" : "slider-hint"}
      >
        {fine ? "¼″ steps · Shift held" : "½″ steps · Hold Shift for ¼″"}
      </small>
    </div>
  );
}
