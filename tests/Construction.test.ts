import { describe, expect, it } from "vitest";
import { createDesignerController } from "../src/designer/DesignerController";
import { createInitialProject } from "../src/designer/InitialProject";
import { getPart, intersects } from "../src/geometry/AssemblyTypes";
import { resolveAssembly } from "../src/geometry/ResolveAssembly";
import { inches } from "../src/shared/Units";
describe("construction geometry", () => {
  it("fits blocking between studs instead of drawing through them", () => {
    const assembly = resolveAssembly(createInitialProject());
    expect(assembly.construction.blocking.length).toBeGreaterThan(0);
    for (const block of assembly.construction.blocking)
      for (const stud of assembly.construction.studs)
        expect(intersects(block, stud)).toBe(false);
  });
  it("places structural spacers directly on drywall and exposes matching slat openings", () => {
    const assembly = resolveAssembly(createInitialProject());
    const slats = getPart(assembly, "slats");
    for (const support of assembly.construction.supports) {
      expect(support.z).toBe(0);
      expect(support.depth).toBe(assembly.depth.panelRear);
      expect(
        slats.openings?.some(
          (hole) => hole.x === support.x && hole.width === support.width,
        ),
      ).toBe(true);
    }
  });
  it("recalculates the complete soundbar envelope when orientation changes", () => {
    const controller = createDesignerController(createInitialProject());
    const flat = getPart(
      controller.store.getSnapshot().assembly,
      "soundbar",
    ).bounds;
    controller.setSoundbarOrientation("vertical");
    const rotated = getPart(
      controller.store.getSnapshot().assembly,
      "soundbar",
    ).bounds;
    expect(rotated.width).toBe(flat.width);
    expect(rotated.height).toBe(flat.depth);
    expect(rotated.depth).toBe(flat.height);
  });
  it("detects an electrical box placed over a stud", () => {
    const controller = createDesignerController(createInitialProject());
    controller.setDistance("electricalOffsetX", inches(56) - inches(103) / 2);
    expect(
      controller.store
        .getSnapshot()
        .assembly.findings.some((item) => item.code === "electrical-framing"),
    ).toBe(true);
  });
  it("permits signed design offsets while rejecting invalid physical lengths", () => {
    const controller = createDesignerController(createInitialProject());
    controller.setDistance("tvOffsetX", -100);
    const assembly = controller.store.getSnapshot().assembly;
    expect(getPart(assembly, "tv").bounds.x).toBeCloseTo(
      (inches(103) - inches(56.9)) / 2 - 100,
    );
    expect(() => controller.setProductDimension("tv", "depth", 0)).toThrow();
    expect(() => controller.setStuds([NaN], false)).toThrow();
  });
});
