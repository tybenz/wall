import { fieldGroup } from "../../designer/FieldCatalog";
import type { Dimension } from "./DimensionDefinitions";
import type { ViewController } from "../ViewStore";
export function DimensionAnnotation({
  intent,
  dimension,
  start,
  end,
  labelPosition,
  label,
  active,
  view,
}: {
  intent: string;
  dimension: Dimension;
  start: readonly [number, number];
  end: readonly [number, number];
  labelPosition: readonly [number, number];
  label: string;
  active: boolean;
  view: ViewController;
}) {
  const [x, y] = labelPosition,
    width = Math.max(100, label.length * 6.1 + 36);
  return (
    <g
      className={`dimension ${active ? "is-active" : ""}`}
      onMouseEnter={() => view.hover(dimension.field)}
      onMouseLeave={() => view.hover(null)}
    >
      <title>
        {intent}: {label}
      </title>
      <path
        className="dimension-line"
        d={`M ${start[0]} ${start[1]} L ${end[0]} ${end[1]}`}
      />
      <circle cx={start[0]} cy={start[1]} r={2} />
      <circle cx={end[0]} cy={end[1]} r={2} />
      <path
        className="dimension-leader"
        d={`M ${(start[0] + end[0]) / 2} ${(start[1] + end[1]) / 2} L ${x} ${y}`}
      />
      <g transform={`translate(${x},${y})`}>
        <g className="dimension-label">
          <rect x={-width / 2} y={-14} width={width} height={28} rx={6} />
          <text x={-width / 2 + 10} y={4}>
            {label}
          </text>
          <g
            className="dimension-edit"
            role="button"
            tabIndex={0}
            aria-label={`${dimension.explanation ? "Explain" : "Edit"} ${dimension.label}`}
            onFocus={() => view.hover(dimension.field)}
            onBlur={() => view.hover(null)}
            onClick={() =>
              view.openEditor(
                fieldGroup(dimension.field),
                dimension.field,
                dimension.explanation ?? null,
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                view.openEditor(
                  fieldGroup(dimension.field),
                  dimension.field,
                  dimension.explanation ?? null,
                );
              }
            }}
          >
            <rect x={width / 2 - 29} y={-14} width={29} height={28} rx={6} />
            <text x={width / 2 - 15} y={4} textAnchor="middle">
              {dimension.explanation ? "ⓘ" : "↗"}
            </text>
          </g>
        </g>
      </g>
    </g>
  );
}
