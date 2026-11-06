import { describe, it, expect } from "vitest";
import { createInitialProject } from "../src/designer/InitialProject";
import { createDesignerController } from "../src/designer/DesignerController";
import { constructionDistanceIds } from "../src/designer/DistanceDefinitions";
import { resolveAssembly } from "../src/geometry/ResolveAssembly";
import { segmentCrossesBox } from "../src/geometry/ConstructionFindings";
import {
  resolveConstructionSection,
  constructionViews,
} from "../src/construction/ConstructionSections";
import { exportConstructionSvg } from "../src/construction/ConstructionExport";
import { parseProject } from "../src/project/ProjectSchema";
import { inches } from "../src/shared/Units";
describe("construction planning", () => {
  it("keeps plates at finished faces and sizes rough openings independently", () => {
    const controller = createDesignerController(createInitialProject());
    controller.setElectricalDimension("upperPower", "openingWidth", 90);
    controller.setElectricalDimension("upperPower", "plateWidth", 170);
    controller.setElectricalDimension("upperPower", "bodyDepth", 60);
    const { assembly } = controller.store.getSnapshot();
    const c = assembly.construction;
    expect(c.plates[0].width).toBe(170);
    expect(c.electrical[0].opening.width).toBe(90);
    expect(c.plates[0].x + c.plates[0].width / 2).toBeCloseTo(
      c.boxes[0].x + c.boxes[0].width / 2,
    );
    expect(c.plates[0].z).toBe(assembly.depth.panelFront);
    expect(c.boxes[0].z).toBe(-60);
    expect(c.boxes[0].z + c.boxes[0].depth).toBe(0);
    expect(c.electrical[0].reach?.depth).toBe(c.plates[0].z);
    expect(
      assembly.parts.find((p) => p.id === "featurePanel")?.openings,
    ).toEqual(
      c.electrical.filter((p) => p.location === "upper").map((p) => p.opening),
    );
  });
  it("uses actual proposed lag rows and embedment and reports missing material", () => {
    const controller = createDesignerController(createInitialProject());
    controller.setDistance("blockingDepth", inches(1));
    controller.setDistance("lagEmbedment", inches(2));
    controller.setDistance("lagBottomRowInset", inches(14.25));
    const { assembly, project } = controller.store.getSnapshot();
    const paths = assembly.construction.lagPaths;
    expect(paths[0].start[1] - paths[1].start[1]).toBeCloseTo(inches(12));
    expect(paths[0].end[2]).toBeCloseTo(
      -project.distances.drywallThickness.mm - inches(2),
    );
    expect(assembly.findings.map((f) => f.code)).toEqual(
      expect.arrayContaining([
        "lag-depth",
        "lag-outside-mount",
        "lag-misses-blocking",
      ]),
    );
  });
  it("detects independent route crossings and depth/coverage conflicts", () => {
    const controller = createDesignerController(createInitialProject());
    controller.setDistance("powerRouteOffsetX", inches(56 - 103 / 2));
    let codes = controller.store
      .getSnapshot()
      .assembly.findings.map((f) => f.code);
    expect(codes).toContain("route-framing-0");
    expect(codes).not.toContain("route-framing-1");
    controller.setElectricalDimension("upperPower", "bodyDepth", inches(5));
    controller.setDistance("routeDepth", inches(6));
    controller.setElectricalDimension("upperPower", "openingWidth", inches(12));
    codes = controller.store.getSnapshot().assembly.findings.map((f) => f.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "box-depth-upperPower",
        "route-depth",
        "plate-coverage-upperPower",
      ]),
    );
  });
  it("does not flag a segment next to framing as crossing it", () => {
    const b = { x: 10, y: 10, z: 10, width: 10, height: 10, depth: 10 };
    expect(segmentCrossesBox([0, 15, 15], [30, 15, 15], b)).toBe(true);
    expect(segmentCrossesBox([0, 10, 15], [30, 10, 15], b)).toBe(false);
    expect(segmentCrossesBox([0, 0, 0], [5, 5, 5], b)).toBe(false);
  });
  it("cuts through the selected construction member using exact depths", () => {
    const project = createInitialProject(),
      assembly = resolveAssembly(project);
    const section = resolveConstructionSection(project, assembly, "mount");
    const spacer = section.rects.find((r) => r.label === "Spacer")!;
    expect(spacer.x).toBe(0);
    expect(spacer.width).toBe(assembly.depth.panelRear);
    const blocking = section.rects.find((r) => r.label === "Blocking")!;
    expect(blocking.x + blocking.width).toBeCloseTo(
      -project.distances.drywallThickness.mm,
    );
    expect(section.lines.filter((l) => l.id.startsWith("lag-"))).toHaveLength(
      2,
    );
    for (const view of constructionViews) {
      const cut = resolveConstructionSection(project, assembly, view.id);
      for (const r of cut.rects) {
        expect(r.width).toBeGreaterThan(0);
        expect(r.height).toBeGreaterThan(0);
        expect(Number.isFinite(r.x + r.y)).toBe(true);
      }
    }
  });
  it("loads earlier saves with provisional defaults without replacing existing edits", () => {
    const project = createInitialProject();
    const { blockingDepth, ...distances } = project.distances;
    const old = {
      ...project,
      distances: Object.fromEntries(
        Object.entries(distances).filter(
          ([id]) =>
            !constructionDistanceIds.includes(
              id as (typeof constructionDistanceIds)[number],
            ),
        ),
      ),
    };
    old.distances.tvCenterHeight = {
      ...project.distances.tvCenterHeight,
      mm: 1500,
    };
    const parsed = parseProject(old);
    expect(parsed.distances.blockingDepth).toEqual(blockingDepth);
    expect(parsed.distances.tvCenterHeight.mm).toBe(1500);
    expect(parseProject(JSON.parse(JSON.stringify(parsed)))).toEqual(parsed);
  });
  it("exports self-contained vector sections, dimensions, findings and unresolved notes safely", () => {
    const p = createInitialProject();
    const svg = exportConstructionSvg(
      { ...p, name: '<script> & "study"' },
      "in",
    );
    expect(svg).toContain("&lt;script&gt; &amp; &quot;study&quot;");
    expect(svg).not.toContain("<script>");
    for (const view of constructionViews)
      expect(svg).toContain(
        resolveConstructionSection(p, resolveAssembly(p), view.id).title,
      );
    expect(svg).toContain("Unresolved measurements");
    expect(svg).toContain("Stud centers unconfirmed");
    expect(svg).toContain("52″");
    expect(svg).not.toMatch(/(?:NaN|Infinity|undefined)/);
    expect(exportConstructionSvg(p, "mm")).toContain("1320.8 mm");
  });
});

it("resolves imported stud centers in spatial order and applies the actual face width", () => {
  const p = createInitialProject();
  const controller = createDesignerController({
    ...p,
    studs: { ...p.studs, positions: [...p.studs.positions].reverse() },
  });
  controller.setDistance("studWidth", 50);
  const c = controller.store.getSnapshot().assembly.construction;
  expect(c.studs.every((s) => s.width === 50)).toBe(true);
  expect(c.blocking.length).toBeGreaterThan(0);
  for (const b of c.blocking) expect(b.width).toBeGreaterThan(0);
});
it("loads project files that still contain retired external cable inputs", () => {
  const p = createInitialProject();
  const migrated = parseProject({
    ...p,
    distances: {
      ...p.distances,
      powerLeadLength: {
        mm: 1000,
        kind: "preference",
        confidence: "provisional",
        note: "retired",
      },
    },
  });
  expect(migrated).toEqual(p);
});
