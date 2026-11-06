import type { ConstructionSection } from "./ConstructionSections";
import { formatInches } from "../shared/Units";
export function SectionDrawing({
  section,
  units,
}: {
  section: ConstructionSection;
  units: "in" | "mm";
}) {
  const { extent: e } = section;
  const scale = Math.min(780 / (e.right - e.left), 450 / (e.top - e.bottom));
  const x = (value: number) =>
    110 + (780 - (e.right - e.left) * scale) / 2 + (value - e.left) * scale;
  const y = (value: number) => 50 + (e.top - value) * scale;
  const fmt = (value: number) =>
    units === "in" ? formatInches(value) : `${Number(value.toFixed(1))} mm`;
  const ticks = [e.bottom, (e.bottom + e.top) / 2, e.top];
  const legend = [
    ...new Map(section.rects.map((r) => [r.label, r.color])).entries(),
  ];
  return (
    <div className="section-figure">
      <svg viewBox="0 0 1000 550" role="img" aria-label={section.title}>
        <title>{section.title}</title>
        <desc>
          {section.description} {section.axis}
        </desc>
        {ticks.map((t) => (
          <g key={t} className="section-grid">
            <line x1="105" y1={y(t)} x2="900" y2={y(t)} />
            <text x="94" y={y(t) + 4} textAnchor="end">
              {fmt(t)}
            </text>
          </g>
        ))}
        {section.rects.map((r) => (
          <rect
            key={r.id}
            x={x(r.x)}
            y={y(r.y + r.height)}
            width={r.width * scale}
            height={r.height * scale}
            fill={r.outline ? "none" : r.color}
            stroke={r.outline ? r.color : "#53604d"}
            strokeWidth={r.outline ? 1.2 : 0.7}
            strokeDasharray={r.outline ? "6 4" : undefined}
          >
            <title>
              {r.label} · {fmt(r.width)} × {fmt(r.height)}
            </title>
          </rect>
        ))}
        {section.lines.map((l) => (
          <polyline
            key={l.id}
            points={l.points.map(([a, b]) => `${x(a)},${y(b)}`).join(" ")}
            fill="none"
            stroke={l.color}
            strokeWidth={l.id.startsWith("route") ? 2.5 : 1.8}
            strokeDasharray={l.dashed ? "6 4" : undefined}
          >
            <title>
              {l.id.startsWith("lag")
                ? "Proposed lag path"
                : l.id === "wall-outline"
                  ? "Vaulted wall boundary"
                  : l.id === "cavity-back"
                    ? "Back of framing cavity"
                    : l.id === "route-0"
                      ? "Power route"
                      : "Low-voltage route"}
            </title>
          </polyline>
        ))}
        <line
          x1={x(e.left)}
          y1="515"
          x2={x(e.right)}
          y2="515"
          stroke="#83907c"
        />
        <text x={x(e.left)} y="537" textAnchor="middle">
          {fmt(e.left)}
        </text>
        <text x={x(e.right)} y="537" textAnchor="middle">
          {fmt(e.right)}
        </text>
        {section.cutX !== null && (
          <text x="500" y="25" textAnchor="middle">
            Cut {fmt(section.cutX)} from left wall · dashed vertical line =
            cavity back
          </text>
        )}
      </svg>
      <div className="section-legend">
        {legend.map(([label, color]) => (
          <span key={label}>
            <i style={{ background: color }} />
            {label}
          </span>
        ))}
        {section.cutX === null && (
          <>
            <span>
              <i style={{ background: "#b77b37" }} />
              Power route
            </span>
            <span>
              <i style={{ background: "#527e8a" }} />
              Low-voltage route
            </span>
          </>
        )}
      </div>
      <p className="section-axis">
        {section.axis}. Dimensions reflect the model; drawing is not a print
        scale.
      </p>
    </div>
  );
}
