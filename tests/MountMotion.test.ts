import { describe, expect, it } from "vitest";
import { createInitialProject } from "../src/designer/InitialProject";
import { createDesignerController } from "../src/designer/DesignerController";
import { resolveAssembly } from "../src/geometry/ResolveAssembly";
import { getPart, intersects } from "../src/geometry/AssemblyTypes";
import {
  resolveMountPreview,
  movePoint,
  movedBounds,
  posedIntersects,
  type Point,
} from "../src/geometry/MountMotion";
import { createViewController } from "../src/viewer/ViewStore";
import { createCamera, projectPoint } from "../src/viewer/Projection";
import { getPreviewDimensions } from "../src/viewer/annotations/MountDimensions";
import { decodeProject } from "../src/project/ProjectSchema";
import { inches } from "../src/shared/Units";

const distance = (a: Point, b: Point) =>
  Math.hypot(...a.map((v, i) => v - b[i]));
describe("mount position preview", () => {
  it("leaves the parked layout intact and moves all attached parts rigidly", () => {
    const project = createInitialProject(),
      base = resolveAssembly(project),
      copy = structuredClone(base);
    const parked = resolveMountPreview(project, base, "parked");
    const mount = getPart(base, "mount").bounds;
    const arms = base.construction.cradle.filter((b) => b.height > 100);
    expect(arms).toHaveLength(2);
    expect(
      arms.every((b) => b.y + b.height >= mount.y + mount.height / 2),
    ).toBe(true);
    expect(movePoint([100, 200, 300], parked.transform)).toEqual([
      100, 200, 300,
    ]);
    for (const preset of ["extended", "left", "right"] as const) {
      const preview = resolveMountPreview(project, base, preset);
      expect(preview.links).toHaveLength(4);
      expect(preview.hinges).toHaveLength(4);
      const lengths = preview.links.map(([a, b]) => distance(a, b));
      for (const length of lengths) expect(length).toBeCloseTo(lengths[0]);
      expect(lengths[0]).toBeCloseTo(distance(...parked.links[0]));
      const tv = getPart(base, "tv").bounds,
        bar = getPart(base, "soundbar").bounds;
      const a: Point = [tv.x, tv.y, tv.z],
        b: Point = [bar.x, bar.y, bar.z];
      expect(
        distance(
          movePoint(a, preview.transform),
          movePoint(b, preview.transform),
        ),
      ).toBeCloseTo(distance(a, b));
      expect(getPart(preview.assembly, "console")).toBe(
        getPart(base, "console"),
      );
      expect(getPart(preview.assembly, "featurePanel")).toBe(
        getPart(base, "featurePanel"),
      );
      expect(getPart(preview.assembly, "mount")).toBe(getPart(base, "mount"));
      expect(preview.rearClearance).toBeGreaterThan(0);
      expect(
        preview.assembly.findings.filter((f) =>
          f.code.startsWith("pose-collision"),
        ),
      ).toHaveLength(0);
    }
    expect(base).toEqual(copy);
  });
  it("mirrors left and right and reports collisions when extension cannot clear swivel", () => {
    const controller = createDesignerController(createInitialProject());
    const { project, assembly } = controller.store.getSnapshot();
    const left = resolveMountPreview(project, assembly, "left"),
      right = resolveMountPreview(project, assembly, "right");
    expect(left.transform.angle).toBe(-right.transform.angle);
    expect(left.rearClearance).toBeCloseTo(right.rearClearance);
    controller.setDistance("mountExtension", 0);
    const next = controller.store.getSnapshot();
    const collision = resolveMountPreview(next.project, next.assembly, "right");
    expect(collision.rearClearance).toBeLessThan(0);
    expect(
      collision.assembly.findings.some(
        (f) => f.code === "pose-collision-featurePanel",
      ),
    ).toBe(true);
    expect(
      resolveMountPreview(
        next.project,
        next.assembly,
        "parked",
      ).assembly.findings.some((f) => f.code.startsWith("pose-collision")),
    ).toBe(false);
  });
  it("uses oriented collision checks rather than colliding empty AABB corners", () => {
    const moving = { x: -50, y: 0, z: -5, width: 100, height: 10, depth: 10 };
    const fixed = { x: 30, y: 0, z: 30, width: 5, height: 10, depth: 5 };
    const pose = {
      pivot: [0, 0, 0] as const,
      extension: 0,
      angle: Math.PI / 4,
    };
    expect(intersects(movedBounds(moving, pose), fixed)).toBe(true);
    expect(posedIntersects(moving, fixed, pose)).toBe(false);
    expect(posedIntersects(moving, { ...fixed, z: -35 }, pose)).toBe(true);
  });
  it("replaces parked boundary findings with findings for the selected pose", () => {
    const controller = createDesignerController(createInitialProject());
    controller.setProductDimension("tv", "width", inches(120));
    controller.setMountSwivel(70);
    const { project, assembly } = controller.store.getSnapshot();
    expect(assembly.findings.some((f) => f.code === "outside-tv")).toBe(true);
    const preview = resolveMountPreview(project, assembly, "right");
    expect(preview.assembly.findings.some((f) => f.code === "outside-tv")).toBe(
      false,
    );
    expect(
      preview.assembly.findings.some((f) => f.code === "pose-outside-wall"),
    ).toBe(false);
  });
  it("fits transformed geometry in every camera and measures the actual pose", () => {
    const project = createInitialProject(),
      base = resolveAssembly(project),
      preview = resolveMountPreview(project, base, "right"),
      view = createViewController();
    view.setMountPreset("right");
    for (const preset of ["front", "side", "isometric"] as const) {
      const camera = createCamera(preview.assembly, 1000, 700, preset);
      for (const id of ["tv", "soundbar", "cradle"] as const) {
        const b = getPart(preview.assembly, id).bounds;
        for (const point of [
          [b.x, b.y, b.z],
          [b.x + b.width, b.y + b.height, b.z + b.depth],
        ] as const) {
          const [x, y] = projectPoint(point, camera, 1000, 700);
          expect(x).toBeGreaterThan(0);
          expect(x).toBeLessThan(1000);
          expect(y).toBeGreaterThan(0);
          expect(y).toBeLessThan(700);
        }
      }
    }
    const dimensions = getPreviewDimensions(
      project,
      base,
      view.store.getSnapshot(),
      preview,
    );
    const width = dimensions.find((d) => d.id === "posed-width")!;
    expect(distance(width.start, width.end)).toBeCloseTo(
      project.products.tv.width.mm,
    );
    expect(dimensions.find((d) => d.id === "pose-clearance")!.mm).toBeCloseTo(
      preview.rearClearance,
    );
    expect(dimensions.some((d) => d.id === "tv-gap")).toBe(false);
    view.setPreset("side");
    view.setLevel(4);
    expect(view.store.getSnapshot().mountPreset).toBe("right");
  });
  it("persists motion settings and upgrades old saves while rejecting invalid ranges", () => {
    const controller = createDesignerController(createInitialProject());
    controller.setMountSwivel(42);
    controller.setDistance("mountExtension", inches(20));
    const saved = decodeProject(controller.exportProject());
    expect(saved.mountSwivelDegrees).toBe(42);
    expect(saved.distances.mountExtension.mm).toBe(inches(20));
    expect(() => controller.setMountSwivel(NaN)).toThrow();
    expect(() => controller.setMountSwivel(90)).toThrow();
    const legacy = JSON.parse(controller.exportProject());
    delete legacy.mountSwivelDegrees;
    delete legacy.distances.mountExtension;
    expect(decodeProject(JSON.stringify(legacy)).mountSwivelDegrees).toBe(30);
    expect(
      decodeProject(JSON.stringify(legacy)).distances.mountExtension.mm,
    ).toBe(inches(18));
  });
});
