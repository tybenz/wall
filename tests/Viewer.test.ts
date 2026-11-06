import { describe, expect, it } from "vitest";
import { createViewController } from "../src/viewer/ViewStore";
import { createInitialProject } from "../src/designer/InitialProject";
import { resolveAssembly } from "../src/geometry/ResolveAssembly";
import { createCamera, projectPoint } from "../src/viewer/Projection";
import { getDimensions } from "../src/viewer/annotations/DimensionDefinitions";
describe("preset views and annotation editing", () => {
  it("preserves inspection level and editor selection across camera changes", () => {
    const view = createViewController();
    view.setLevel(3);
    view.openEditor("surfaces", "distance:panelRearGap");
    view.setPreset("isometric");
    expect(view.store.getSnapshot()).toMatchObject({
      level: 3,
      preset: "isometric",
      drawerOpen: true,
      focusField: "distance:panelRearGap",
    });
    const before = view.store.getSnapshot().focusRequest;
    view.openEditor("surfaces", "distance:panelRearGap");
    expect(view.store.getSnapshot().focusRequest).toBe(before + 1);
  });
  it("clamps layer navigation and zoom and notifies subscriptions", () => {
    const view = createViewController();
    let calls = 0;
    const off = view.store.subscribe(() => calls++);
    view.setLevel(100);
    view.setZoom(100);
    expect(view.store.getSnapshot()).toMatchObject({ level: 4, zoom: 2 });
    expect(calls).toBe(2);
    off();
    view.setLevel(-1);
    expect(calls).toBe(2);
    expect(view.store.getSnapshot().level).toBe(0);
  });
  it("fits every assembly envelope in each fixed projection without perspective scaling", () => {
    const assembly = resolveAssembly(createInitialProject());
    for (const preset of ["front", "side", "isometric"] as const) {
      const camera = createCamera(assembly, 1000, 700, preset);
      expect(camera.isOrthographicCamera).toBe(true);
      for (const part of assembly.parts) {
        const b = part.bounds;
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
  });
  it("links a calculated annotation to its controlling field and supplies side depth annotations", () => {
    const project = createInitialProject(),
      assembly = resolveAssembly(project),
      view = createViewController();
    const derived = getDimensions(
      project,
      assembly,
      view.store.getSnapshot(),
    ).find((item) => item.id === "tv-bottom");
    expect(derived?.field).toBe("distance:tvCenterHeight");
    expect(derived?.explanation).toContain("half");
    view.setPreset("side");
    const depth = getDimensions(
      project,
      assembly,
      view.store.getSnapshot(),
    ).find((item) => item.id === "slat-depth");
    expect(depth?.mm).toBeCloseTo(11.938);
    expect(depth?.field).toBe("product:slats:depth");
  });
});
