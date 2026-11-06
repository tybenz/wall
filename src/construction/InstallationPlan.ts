import type { FieldId, Project } from "../designer/DesignerTypes";
import { fieldIsFact, fieldVerified, verificationItems } from "../designer/FieldCatalog";
import { getPart, type Assembly, type Bounds } from "../geometry/AssemblyTypes";

export type InstallationMark = Readonly<{
  id: string;
  label: string;
  height: number;
  anchorX: number;
  control: FieldId;
  unverified: readonly FieldId[];
}>;
export type InstallationFootprint = Readonly<{
  id: string;
  label: string;
  bounds: Bounds;
  control: FieldId;
  unverified: readonly FieldId[];
}>;

/** References the resolved assembly; no independent installation geometry. */
export function resolveInstallationPlan(project: Project, assembly: Assembly) {
  const c = assembly.construction, m = c.datums;
  const tv = getPart(assembly, "tv").bounds;
  const mount = getPart(assembly, "mount").bounds;
  const panel = getPart(assembly, "featurePanel").bounds;
  const unknown = (fields: readonly FieldId[]) => [...new Set(fields)].filter(
    (field) => fieldIsFact(field) && !fieldVerified(project, field),
  );
  const tvFacts: FieldId[] = ["product:tv:height"];
  const hookFacts: FieldId[] = [
    ...tvFacts, "distance:tvTopToMountHole",
    "distance:railReferenceHoleBelowHook", "railPositions",
  ];
  const plateFacts: FieldId[] = [...hookFacts, "distance:hookAbovePlateTop"];
  const lagFacts: FieldId[] = [
    ...plateFacts, "distance:lagTopRowInset", "distance:lagBottomRowInset",
  ];
  const blockFacts = project.blockingPlacement === "follow-mount" ? lagFacts : [];
  const marks: InstallationMark[] = [];
  const mark = (label: string, height: number, anchorX: number, control: FieldId, facts: readonly FieldId[]) => {
    marks.push({ id: String(marks.length + 1), label, height, anchorX, control, unverified: unknown(facts) });
  };
  mark("TV top", m.tvTop, tv.x + tv.width, "distance:tvCenterHeight", tvFacts);
  mark("TV bottom", m.tvBottom, tv.x + tv.width, "distance:tvCenterHeight", tvFacts);
  mark("Hook contact line", m.hook, mount.x + mount.width, "railPositions", hookFacts);
  mark("Wall plate top", m.plateTop, mount.x + mount.width, "distance:hookAbovePlateTop", plateFacts);
  mark("Wall plate bottom", m.plateBottom, mount.x + mount.width, "distance:mountHeight", [...plateFacts, "distance:mountHeight"]);
  mark("Upper lag row", m.lagHigh, mount.x + mount.width, "distance:lagTopRowInset", lagFacts);
  mark("Lower lag row", m.lagLow, mount.x + mount.width, "distance:lagBottomRowInset", lagFacts);
  const blockRight = Math.max(mount.x + mount.width, ...c.blocking.map((b) => b.x + b.width));
  const blockControl: FieldId = project.blockingPlacement === "follow-mount" ? "distance:blockingHeight" : "distance:blockingBottom";
  mark("Blocking top", m.blockingTop, blockRight, blockControl, blockFacts);
  mark("Blocking bottom", m.blockingBottom, blockRight, blockControl, blockFacts);
  for (const device of c.electrical.filter((p) => p.location === "upper")) {
    const facts: FieldId[] = [...plateFacts];
    if (project.upperElectricalPlacement === "below") facts.push("distance:mountHeight");
    facts.push(`electrical:${device.id}:plateHeight`);
    const label = device.kind === "power" ? "Power plate" : "HDMI plate";
    mark(`${label} top`, device.plate.y + device.plate.height, device.plate.x + device.plate.width, "distance:upperBoxGap", facts);
    mark(`${label} bottom`, device.plate.y, device.plate.x + device.plate.width, "distance:upperBoxGap", facts);
  }
  mark("Panel top", panel.y + panel.height, panel.x + panel.width, "distance:panelHeight", []);
  mark("Panel bottom", panel.y, panel.x + panel.width, "distance:panelHeight", []);
  const footprints: InstallationFootprint[] = [
    { id: "P1", label: "Flat panel", bounds: panel, control: "distance:panelWidth", unverified: unknown(["distance:wallWidth"]) },
    ...c.blocking.map((bounds, i): InstallationFootprint => ({
      id: `B${i + 1}`, label: "Blocking", bounds, control: "studs",
      unverified: unknown(["studs", "distance:studWidth", ...blockFacts]),
    })),
    ...c.supports.map((bounds, i): InstallationFootprint => ({
      id: `S${i + 1}`, label: bounds.role === "mount" ? "Mount spacer" : "Perimeter spacer",
      bounds, control: bounds.role === "mount" ? "distance:supportSpacing" : "distance:supportInset",
      unverified: unknown(["distance:wallWidth"]),
    })),
  ];
  const unverified = [...new Set([...marks, ...footprints].flatMap((r) => r.unverified))];
  return {
    width: project.distances.wallWidth.mm,
    profile: assembly.wallProfile,
    tv, mount, panel,
    studs: c.studs,
    blocks: c.blocking,
    spacers: c.supports,
    plates: c.electrical.filter((p) => p.location === "upper").map((p) => p.plate),
    lags: c.lagPaths.map((p) => p.start),
    hook: m.hook,
    marks,
    footprints,
    unverified,
    factLabels: verificationItems(project).filter((item) => unverified.includes(item.field)),
    hasBlocking: c.blocking.length > 0,
    blockingMode: project.blockingPlacement,
  };
}
export type InstallationPlan = ReturnType<typeof resolveInstallationPlan>;
