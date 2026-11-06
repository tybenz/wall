import type { Project } from "../designer/DesignerTypes";
import {
  distanceDefinitions,
  type DistanceId,
} from "../designer/DistanceDefinitions";
import { verificationItems } from "../designer/FieldCatalog";
import { resolveAssembly } from "../geometry/ResolveAssembly";
import {
  constructionViews,
  resolveConstructionSection,
} from "./ConstructionSections";
import {
  resolveConstructionSchedule,
  scheduleTextRows,
} from "./ConstructionSchedule";
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
/** Standalone vector sheets use the same geometry and schedules as the UI. */
export function exportConstructionSvg(
  project: Project,
  units: "in" | "mm",
): string {
  const assembly = resolveAssembly(project),
    fmt = (mm: number) =>
      units === "in" ? formatInches(mm) : `${Number(mm.toFixed(1))} mm`;
  const text = (x: number, y: number, value: string, size = 15) =>
    `<text x="${x}" y="${y}" font-size="${size}">${xml(value)}</text>`;
  const sections = constructionViews
    .filter((v) => v.id !== "electrical")
    .map((v) => resolveConstructionSection(project, assembly, v.id));
  let cursor = 120;
  const groups: string[] = [];
  for (const section of sections) {
    const e = section.extent,
      scale = Math.min(850 / (e.right - e.left), 480 / (e.top - e.bottom));
    const x = (v: number) =>
        100 + (850 - (e.right - e.left) * scale) / 2 + (v - e.left) * scale,
      y = (v: number) => 150 + (e.top - v) * scale;
    let svg = `<g transform="translate(0 ${cursor})">${text(40, 35, section.title, 25)}`;
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
    svg +=
      '<rect x="40" y="135" width="940" height="530" rx="5" fill="#f6f5ef"/>';
    for (const t of [e.bottom, (e.bottom + e.top) / 2, e.top])
      svg += `<line x1="95" y1="${y(t)}" x2="960" y2="${y(t)}" stroke="#d7dfcf"/>${text(45, y(t) - 5, fmt(t), 12)}`;
    for (const r of section.rects)
      svg += `<rect x="${x(r.x)}" y="${y(r.y + r.height)}" width="${r.width * scale}" height="${r.height * scale}" fill="${r.outline ? "none" : r.color}" stroke="${r.outline ? r.color : "#596751"}" stroke-width="1"${r.outline ? ' stroke-dasharray="5 4"' : ""}><title>${xml(r.label)}</title></rect>`;
    for (const l of section.lines)
      svg += `<polyline points="${l.points.map(([a, b]) => `${x(a)},${y(b)}`).join(" ")}" fill="none" stroke="${l.color}" stroke-width="2"${l.dashed ? ' stroke-dasharray="6 4"' : ""}><title>${xml(l.label ?? l.id)}</title></polyline>`;
    section.measures.forEach((m, j) => {
      svg += text(1010, 155 + j * 28, `${m.label}: ${fmt(m.mm)}`, 13);
    });
    const legend = [
      ...new Map(section.rects.map((r) => [r.label, r.color])).entries(),
    ];
    legend.forEach(([label, color], j) => {
      const lx = 40 + (j % 4) * 340,
        ly = 695 + Math.floor(j / 4) * 23;
      svg += `<rect x="${lx}" y="${ly - 12}" width="14" height="12" fill="${color}" stroke="#7f8c75"/>${text(lx + 22, ly, label, 12)}`;
    });
    groups.push(svg + "</g>");
    cursor += Math.max(
      770,
      section.measures.length * 28 + 210,
      720 + Math.ceil(legend.length / 4) * 23,
    );
  }
  const notes = [
    ...scheduleTextRows(resolveConstructionSchedule(project, assembly), fmt),
    "Unresolved measurements and model assumptions",
    ...verificationItems(project).map((item) => `${item.label}: ${item.note}`),
    ...(!project.studs.confirmed ? ["Stud centers unconfirmed"] : []),
    "Layout choices (not measurements awaiting verification)",
    ...(Object.keys(distanceDefinitions) as DistanceId[])
      .filter(
        (id) =>
          distanceDefinitions[id].kind === "preference" &&
          !(
            id === "blockingBottom" &&
            project.blockingPlacement === "follow-mount"
          ),
      )
      .map(
        (id) =>
          `${distanceDefinitions[id].label}: ${fmt(project.distances[id].mm)}`,
      ),
    "Current model findings",
    ...assembly.findings.map((f) => f.message),
  ].flatMap((line) => wrap(line));
  const height = cursor + notes.length * 23 + 80;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="${height}" viewBox="0 0 1500 ${height}" role="img"><title>${xml(project.name)} construction sheet</title><style>text{font-family:Arial,sans-serif;fill:#34473b}</style><rect width="1500" height="${height}" fill="#fffefa"/>${text(40, 45, `${project.name} — construction study`, 30)}${text(40, 78, `Units: ${units === "in" ? "inches" : "millimeters"}. Model dimensions; not to print scale. Fastener and passage specifications remain unresolved.`, 15)}${text(40, 103, "Amber = power / hook line; blue = low voltage / TV bolts; red crosses = unresolved framing passages.", 15)}${groups.join("")}${notes.map((line, i) => text(40, cursor + i * 23, line, 14)).join("")}</svg>`;
}
