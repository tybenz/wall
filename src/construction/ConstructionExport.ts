import type { Project } from "../designer/DesignerTypes";
import {
  distanceDefinitions,
  type DistanceId,
} from "../designer/DistanceDefinitions";
import { resolveAssembly } from "../geometry/ResolveAssembly";
import {
  constructionViews,
  resolveConstructionSection,
} from "./ConstructionSections";
import { formatInches } from "../shared/Units";
const xml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
const wrap = (value: string, width = 130): string[] => {
  const lines: string[] = [];
  let line = "";
  for (const word of value.split(/\s+/)) {
    if (line.length + word.length > width) {
      lines.push(line);
      line = "";
    }
    line += (line ? " " : "") + word;
  }
  if (line) lines.push(line);
  return lines;
};
/** Standalone vector construction sheet. No browser or React dependencies. */
export function exportConstructionSvg(
  project: Project,
  units: "in" | "mm",
): string {
  const assembly = resolveAssembly(project);
  const fmt = (mm: number) =>
    units === "in" ? formatInches(mm) : `${Number(mm.toFixed(1))} mm`;
  const text = (x: number, y: number, value: string, size = 15) =>
    `<text x="${x}" y="${y}" font-size="${size}">${xml(value)}</text>`;
  const sections = constructionViews.map((v) =>
    resolveConstructionSection(project, assembly, v.id),
  );
  const unresolved = [
    ...(!project.studs.confirmed
      ? [
          `Stud centers unconfirmed: ${project.studs.positions.map(fmt).join(", ")}`,
        ]
      : []),
    ...(Object.keys(distanceDefinitions) as DistanceId[])
      .filter(
        (id) =>
          distanceDefinitions[id].kind === "measurement" &&
          project.distances[id].confidence !== "confirmed",
      )
      .map(
        (id) =>
          `${distanceDefinitions[id].label}: ${fmt(project.distances[id].mm)} — ${project.distances[id].note}`,
      ),
    ...Object.values(project.products).flatMap((p) =>
      (["width", "height", "depth"] as const)
        .filter((axis) => p[axis].confidence !== "confirmed")
        .map(
          (axis) =>
            `${p.name} ${axis}: ${fmt(p[axis].mm)} — ${p[axis].evidence.note}`,
        ),
    ),
  ];
  const notes = [
    "Unresolved measurements and model assumptions",
    ...unresolved,
    "Layout choices (not measurements awaiting verification)",
    ...(Object.keys(distanceDefinitions) as DistanceId[])
      .filter((id) => distanceDefinitions[id].kind === "preference")
      .map(
        (id) =>
          `${distanceDefinitions[id].label}: ${fmt(project.distances[id].mm)}`,
      ),
    "Current model findings",
    ...assembly.findings.map((f) => f.message),
  ].flatMap((line) => wrap(line));
  const height = 120 + sections.length * 760 + notes.length * 23 + 80;
  const groups = sections
    .map((section, i) => {
      const e = section.extent,
        scale = Math.min(850 / (e.right - e.left), 480 / (e.top - e.bottom));
      const x = (v: number) =>
        100 + (850 - (e.right - e.left) * scale) / 2 + (v - e.left) * scale;
      const y = (v: number) => 150 + (e.top - v) * scale;
      let svg = `<g transform="translate(0 ${120 + i * 760})">${text(40, 35, section.title, 25)}`;
      wrap(section.description, 150).forEach((line, j) => {
        svg += text(40, 65 + j * 21, line, 14);
      });
      svg += text(
        40,
        122,
        section.cutX === null
          ? section.axis
          : `Cut ${fmt(section.cutX)} from left wall. ${section.axis}`,
        13,
      );
      svg += `<rect x="40" y="135" width="940" height="530" rx="5" fill="#f6f5ef"/>`;
      for (const t of [e.bottom, (e.bottom + e.top) / 2, e.top])
        svg += `<line x1="95" y1="${y(t)}" x2="960" y2="${y(t)}" stroke="#d7dfcf"/>${text(45, y(t) - 5, fmt(t), 12)}`;
      for (const r of section.rects)
        svg += `<rect x="${x(r.x)}" y="${y(r.y + r.height)}" width="${r.width * scale}" height="${r.height * scale}" fill="${r.outline ? "none" : r.color}" stroke="${r.outline ? r.color : "#596751"}" stroke-width="1"${r.outline ? ' stroke-dasharray="5 4"' : ""}><title>${xml(r.label)}</title></rect>`;
      for (const l of section.lines)
        svg += `<polyline points="${l.points.map(([a, b]) => `${x(a)},${y(b)}`).join(" ")}" fill="none" stroke="${l.color}" stroke-width="2"${l.dashed ? ' stroke-dasharray="6 4"' : ""}/>`;
      section.measures.forEach((m, j) => {
        svg += text(1010, 155 + j * 28, `${m.label}: ${fmt(m.mm)}`, 13);
      });
      const legend = [
        ...new Map(section.rects.map((r) => [r.label, r.color])).entries(),
      ];
      legend.forEach(([label, color], j) => {
        const lx = 40 + (j % 5) * 260,
          ly = 695 + Math.floor(j / 5) * 23;
        svg += `<rect x="${lx}" y="${ly - 12}" width="14" height="12" fill="${color}" stroke="#7f8c75"/>${text(lx + 22, ly, label, 13)}`;
      });
      return svg + "</g>";
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="${height}" viewBox="0 0 1500 ${height}" role="img"><title>${xml(project.name)} construction sheet</title><style>text{font-family:Arial,sans-serif;fill:#34473b}</style><rect width="1500" height="${height}" fill="#fffefa"/>${text(40, 45, `${project.name} — construction study`, 30)}${text(40, 78, `Units: ${units === "in" ? "inches" : "millimeters"}. Dimensions are model values; not to print scale. Dashed lines are proposed paths / reference limits.`, 15)}${text(40, 103, "Power = amber; low voltage = blue. Fastener specification, framing passages and actual part dimensions remain to be verified.", 15)}${groups}${notes.map((line, i) => text(40, 120 + sections.length * 760 + i * 23, line, 14)).join("")}</svg>`;
}
