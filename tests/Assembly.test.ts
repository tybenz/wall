import { describe, expect, it } from "vitest";
import { createInitialProject } from "../src/designer/InitialProject";
import { resolveAssembly } from "../src/geometry/ResolveAssembly";
import { inches } from "../src/shared/Units";

describe("assembly resolution", () => {
  it("builds a depth stack from drywall without losing sourced slat thickness", () => {
    const assembly = resolveAssembly(createInitialProject());
    expect(assembly.depth.slatFront).toBeCloseTo(11.938);
    expect(assembly.depth.panelRear).toBeCloseTo(50.038);
    expect(assembly.depth.panelFront).toBeCloseTo(69.038);
    expect(assembly.depth.tvRear).toBeCloseTo(94.438);
    const drywall = assembly.parts.find((part) => part.id === "drywall")!;
    expect(drywall.bounds.z + drywall.bounds.depth).toBe(0);
    expect(
      assembly.parts.find((part) => part.id === "studZone")!.bounds.z,
    ).toBeLessThan(drywall.bounds.z);
  });

  it("counts panels and cartons using linear width, not carton square footage", () => {
    expect(resolveAssembly(createInitialProject()).coverage).toEqual({
      panels: 9,
      cartons: 5,
      nominalWidth: inches(118.1),
    });
  });

  it("repositions the TV and attached soundbar together without moving the floor console", () => {
    const project = createInitialProject();
    const before = resolveAssembly(project);
    const after = resolveAssembly({
      ...project,
      distances: {
        ...project.distances,
        tvCenterHeight: {
          ...project.distances.tvCenterHeight,
          mm: project.distances.tvCenterHeight.mm + inches(4),
        },
      },
    });
    for (const id of ["tv", "soundbar", "featurePanel"]) {
      expect(
        after.parts.find((part) => part.id === id)!.bounds.y -
          before.parts.find((part) => part.id === id)!.bounds.y,
      ).toBeCloseTo(inches(4));
    }
    expect(after.parts.find((part) => part.id === "console")!.bounds).toEqual(
      before.parts.find((part) => part.id === "console")!.bounds,
    );
  });

  it("flags stock too short for the wall", () => {
    const project = createInitialProject();
    const assembly = resolveAssembly({
      ...project,
      distances: {
        ...project.distances,
        wallHeight: { ...project.distances.wallHeight, mm: inches(120) },
      },
    });
    expect(
      assembly.findings.some((finding) => finding.code === "short-slats"),
    ).toBe(true);
  });

  it("exposes a provisional soundbar/panel conflict instead of implying clearance", () => {
    const initial = createInitialProject();
    const project = {
      ...initial,
      distances: {
        ...initial.distances,
        soundbarOffsetZ: { ...initial.distances.soundbarOffsetZ, mm: 0 },
      },
    };
    expect(
      resolveAssembly(project).findings.some(
        (finding) => finding.code === "soundbar-panel-overlap",
      ),
    ).toBe(true);
    const moved = {
      ...project,
      distances: {
        ...project.distances,
        tvRearGap: { ...project.distances.tvRearGap, mm: inches(5) },
      },
    };
    expect(
      resolveAssembly(moved).findings.some(
        (finding) => finding.code === "soundbar-panel-overlap",
      ),
    ).toBe(false);
  });
});
