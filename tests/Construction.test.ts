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
  it("resolves perimeter spacers and 16-inch-on-center mount spacers flush to the panel rear", () => {
    const assembly = resolveAssembly(createInitialProject());
    const supports = assembly.construction.supports;
    expect(supports.filter((b) => b.role === "perimeter")).toHaveLength(4);
    const inner = supports.filter((b) => b.role === "mount");
    expect(inner).toHaveLength(2);
    expect(
      inner[1].x + inner[1].width / 2 - inner[0].x - inner[0].width / 2,
    ).toBeCloseTo(inches(16));
    for (const a of supports)
      for (const b of supports)
        if (a !== b) expect(intersects(a, b)).toBe(false);
    for (const {
      start: [x, y],
      end: [, , z],
    } of assembly.construction.lagPaths) {
      expect(
        inner.some(
          (b) =>
            x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height,
        ),
      ).toBe(true);
      expect(
        assembly.construction.blocking.some(
          (b) =>
            x >= b.x &&
            x <= b.x + b.width &&
            y >= b.y &&
            y <= b.y + b.height &&
            z >= b.z &&
            z <= b.z + b.depth,
        ),
      ).toBe(true);
    }
    // The flat panel is continuous at the mount; its only cutout is for plates.
    expect(getPart(assembly, "featurePanel").openings).toEqual([
      assembly.construction.boxes[0],
    ]);
  });
  it("centers plates on the mount and keeps a two-inch edge gap as the layout changes", () => {
    const controller = createDesignerController(createInitialProject());
    for (const [id, value] of [
      ["wallWidth", inches(110)],
      ["tvCenterHeight", inches(57)],
      ["mountHeight", inches(11)],
      ["mountOffsetY", inches(-3)],
    ] as const) {
      controller.setDistance(id, value);
      const assembly = controller.store.getSnapshot().assembly;
      const mount = getPart(assembly, "mount").bounds;
      const plate = assembly.construction.plates[0];
      expect(plate.x + plate.width / 2).toBeCloseTo(mount.x + mount.width / 2);
      expect(mount.y - plate.y - plate.height).toBeCloseTo(inches(2));
      expect(plate.z).toBeCloseTo(assembly.depth.panelFront);
    }
    controller.setDistance("blockingBottom", inches(70));
    expect(
      controller.store
        .getSnapshot()
        .assembly.findings.some((f) => f.code === "lag-misses-blocking"),
    ).toBe(true);
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
    controller.setDistance("mountOffsetY", -100);
    const assembly = controller.store.getSnapshot().assembly;
    expect(
      getPart(assembly, "mount").bounds.y +
        getPart(assembly, "mount").bounds.height / 2,
    ).toBeCloseTo(inches(52) - 100);
    expect(() => controller.setProductDimension("tv", "depth", 0)).toThrow();
    expect(() => controller.setStuds([NaN], false)).toThrow();
  });
});
