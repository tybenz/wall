import type { Bounds } from "../geometry/AssemblyTypes";
import { formatInches } from "../shared/Units";
import type { InstallationPlan } from "./InstallationPlan";

const escapeXml = (s: string) => s.replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
})[c]!);

/** Shared SVG for the on-screen elevation and its standalone download. */
export function installationPlanSvg(plan: InstallationPlan, units: "in" | "mm") {
  const fmt = (mm: number) => escapeXml(units === "in" ? formatInches(mm) : `${Number(mm.toFixed(1))} mm`);
  const top = Math.max(...plan.profile.map((p) => p[1]), ...plan.marks.map((p) => p.height));
  const bottom = Math.min(0, ...plan.marks.map((p) => p.height));
  const scale = Math.min(640 / plan.width, 750 / Math.max(1, top - bottom));
  const x = (v: number) => 60 + v * scale;
  const y = (v: number) => 100 + (top - v) * scale;
  const text = (a: number, b: number, value: string, attrs = "") =>
    `<text x="${a}" y="${b}" ${attrs}>${escapeXml(value)}</text>`;
  const rect = (b: Bounds, fill: string, stroke: string, dashed = false) =>
    `<rect x="${x(b.x)}" y="${y(b.y + b.height)}" width="${b.width * scale}" height="${b.height * scale}" fill="${fill}" stroke="${stroke}" ${dashed ? 'stroke-dasharray="7 5"' : ""}/>`;
  const sorted = [...plan.marks].sort((a, b) => b.height - a.height || Number(a.id) - Number(b.id));
  const labelGap = 28;
  let nextLabelY = 110;
  const labels = sorted.map((mark) => {
    const labelY = Math.max(nextLabelY, y(mark.height));
    nextLabelY = labelY + labelGap;
    return { mark, labelY };
  });
  // Pack against neighboring labels, not fixed per-index bounds. This keeps
  // coincident and closely spaced heights distinct without moving anchors.
  let previousLabelY = 850;
  for (let i = labels.length - 1; i >= 0; i--) {
    labels[i].labelY = Math.min(labels[i].labelY, previousLabelY);
    previousLabelY = labels[i].labelY - labelGap;
  }
  const floorY = y(0);
  const documentHeight = 1020 + plan.factLabels.length * 22;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 ${documentHeight}" role="img" aria-labelledby="plan-title plan-desc">
    <title id="plan-title">Installation height plan</title>
    <desc id="plan-desc">Front elevation. Heights from finished floor; horizontal positions from left wall edge. Numbered leaders match the measurement list. Dashed TV outline is the parked reference.</desc>
    <style>text{font:14px system-ui,sans-serif;fill:#34463b} .small{font-size:12px} .title{font-size:23px;font-weight:600} .mark{font-size:13px} .value{font-variant-numeric:tabular-nums;font-weight:600}</style>
    <rect width="1200" height="${documentHeight}" fill="#fffefa"/>
    ${text(35, 36, "Installation height plan", 'class="title"')}
    ${text(35, 62, "Front elevation · parked TV · Y = finished floor · X = left wall edge", 'class="small"')}
    <polygon points="${x(0)},${y(0)} ${plan.profile.map(([a, b]) => `${x(a)},${y(b)}`).join(" ")} ${x(plan.width)},${y(0)}" fill="#f4f3ed" stroke="#bdc5b8"/>
    ${plan.studs.map((b) => rect(b, "#e2d7c3", "#d1c4ae")).join("")}
    ${plan.blocks.map((b, i) => rect(b, "#cfb48a", "#8a724e") + text(x(b.x + b.width / 2), y(b.y + b.height / 2) + 4, `B${i + 1}`, 'text-anchor="middle" class="small"')).join("")}
    ${rect(plan.panel, "none", "#84907b", true)}
    ${text(x(plan.panel.x) + 4, y(plan.panel.y + plan.panel.height) - 8, "P1 · flat panel", 'class="small"')}
    ${plan.spacers.map((b, i) => rect(b, "#9bb68f", "#667e5e") + text(x(b.x + b.width / 2), y(b.y + b.height / 2) + 4, `S${i + 1}`, 'text-anchor="middle" class="small"')).join("")}
    ${rect(plan.tv, "none", "#34463b", true)}
    ${rect(plan.mount, "#e2e7df", "#34463b")}
    ${plan.plates.map((b) => rect(b, "#d6e5e9", "#45747e")).join("")}
    <line x1="${x(plan.mount.x)}" x2="${x(plan.mount.x + plan.mount.width)}" y1="${y(plan.hook)}" y2="${y(plan.hook)}" stroke="#b17b31" stroke-width="3"/>
    ${plan.lags.map(([a, b]) => `<circle cx="${x(a)}" cy="${y(b)}" r="4" fill="#34463b"/>`).join("")}
    ${labels.map(({ mark, labelY }) => `<g>
      <circle cx="${x(mark.anchorX)}" cy="${y(mark.height)}" r="3" fill="#7a8973"/>
      <polyline points="${x(mark.anchorX)},${y(mark.height)} 755,${y(mark.height)} 805,${labelY} 823,${labelY}" fill="none" stroke="${mark.unverified.length ? "#b58a43" : "#8a9b80"}" stroke-width="1"/>
      ${text(830, labelY + 4, `${mark.id}. ${mark.label}${mark.unverified.length ? " *" : ""}`, 'class="mark"')}
      <text x="1175" y="${labelY + 4}" text-anchor="end" class="value">${fmt(mark.height)}</text>
    </g>`).join("")}
    <line x1="${x(0)}" x2="${x(plan.width)}" y1="${floorY}" y2="${floorY}" stroke="#34463b" stroke-width="2"/>
    ${text(x(0), floorY + 24, "X = 0 · floor Y = 0", 'class="small"')}
    <text x="${x(plan.width)}" y="${floorY + 24}" text-anchor="end" class="small">Wall width ${fmt(plan.width)}</text>
    ${text(35, 930, "Dashed: TV / panel outline · tan: blocking · green: spacers · blue: power / HDMI plates", 'class="small"')}
    ${text(35, 954, `* Depends on an unverified fact. ${plan.unverified.length} relevant facts need verification.`, 'class="small"')}
    ${text(35, 978, "All coordinates reflect the model. See the measurement list for dependencies and part locations. Not a print scale.", 'class="small"')}
    ${plan.factLabels.map((fact, i) => text(35, 1010 + i * 22, `Verify: ${fact.label}`, 'class="small"')).join("")}
  </svg>`;
}
