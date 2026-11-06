import { describe, expect, it } from "vitest";
import { createInitialProject } from "../src/designer/InitialProject";
import { resolveAssembly } from "../src/geometry/ResolveAssembly";
import { getPart } from "../src/geometry/AssemblyTypes";
import { profileCutHeight, profileHeightAt } from "../src/geometry/WallProfile";
import { decodeProject } from "../src/project/ProjectSchema";
import { inches } from "../src/shared/Units";

describe("vaulted wall and beam", () => {
  it("shares the measured ceiling outline and 112-inch beam underside across wall layers", () => {
    const assembly = resolveAssembly(createInitialProject());
    const profile = assembly.wallProfile;
    expect(profile[0]).toEqual([0, inches(108)]);
    expect(profile.at(-1)).toEqual([inches(103), inches(108)]);
    expect(profile[1][1]).toBe(inches(115));
    expect(profileHeightAt(profile, inches(51.5))).toBeCloseTo(inches(112));
    expect(getPart(assembly, "beam").bounds.y).toBeCloseTo(inches(112));
    expect(getPart(assembly, "beam").bounds.width).toBeCloseTo(inches(7.25));
    expect(getPart(assembly, "slats").topProfile).toBe(profile);
    expect(getPart(assembly, "drywall").topProfile).toBe(profile);
    for (const stud of assembly.construction.studs) {
      expect(stud.height).toBe(
        profileCutHeight(profile, stud.x, stud.x + stud.width),
      );
    }
  });
  it("cuts spans crossing the beam notch below its underside", () => {
    const assembly = resolveAssembly(createInitialProject());
    const beam = getPart(assembly, "beam").bounds;
    expect(
      profileCutHeight(
        assembly.wallProfile,
        beam.x - 10,
        beam.x + beam.width + 10,
      ),
    ).toBeCloseTo(inches(112));
  });
  it("detects an object above the local ceiling even when below the maximum wall height", () => {
    const project = createInitialProject();
    const assembly = resolveAssembly({
      ...project,
      distances: {
        ...project.distances,
        panelWidth: { ...project.distances.panelWidth, mm: inches(100) },
        panelHeight: { ...project.distances.panelHeight, mm: inches(10) },
        tvCenterHeight: {
          ...project.distances.tvCenterHeight,
          mm: inches(106),
        },
      },
    });
    expect(
      assembly.findings.some(
        (finding) => finding.code === "outside-featurePanel",
      ),
    ).toBe(true);
  });
  it("upgrades old saved defaults without discarding layout edits or customized heights", () => {
    const original = createInitialProject();
    const distances: Record<string, unknown> = { ...original.distances };
    for (const id of [
      "wallLeftHeight",
      "wallRightHeight",
      "beamOffsetX",
      "beamWidth",
      "beamDrop",
      "beamProjection",
    ])
      delete distances[id];
    distances.wallHeight = {
      ...original.distances.wallHeight,
      mm: inches(108),
      note: "Simplified rectangular wall; beam unresolved.",
    };
    distances.panelWidth = { ...original.distances.panelWidth, mm: inches(75) };
    const upgraded = decodeProject(JSON.stringify({ ...original, distances }));
    expect(upgraded.distances.wallHeight.mm).toBe(inches(115));
    expect(upgraded.distances.panelWidth.mm).toBe(inches(75));
    distances.wallHeight = {
      ...original.distances.wallHeight,
      mm: inches(120),
      note: "Custom height",
    };
    expect(
      decodeProject(JSON.stringify({ ...original, distances })).distances
        .wallHeight.mm,
    ).toBe(inches(120));
  });
});
