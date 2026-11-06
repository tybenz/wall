import { describe, expect, it } from "vitest";
import { createDesignerController } from "../src/designer/DesignerController";
import { createInitialProject } from "../src/designer/InitialProject";
import { decodeProject } from "../src/project/ProjectSchema";
import type { ProjectStorage } from "../src/project/ProjectPersistence";
import { inches } from "../src/shared/Units";
function memoryStorage(): ProjectStorage {
  let saved: string | null = null;
  return {
    read: () => saved,
    write: (text) => {
      saved = text;
    },
  };
}
describe("project persistence", () => {
  it("round-trips a complete edited project through save/reset/load and a fresh controller", () => {
    const storage = memoryStorage();
    const controller = createDesignerController(
      createInitialProject(),
      storage,
    );
    controller.setDistance("panelRearGap", inches(2));
    controller.setProductDimension("tv", "width", 1500);
    controller.setStuds([200, 600, 1000], true);
    controller.setSoundbarOrientation("vertical");
    controller.saveLocal();
    const saved = controller.store.getSnapshot().project;
    controller.reset();
    expect(controller.store.getSnapshot().project).not.toEqual(saved);
    controller.loadLocal();
    expect(controller.store.getSnapshot().project).toEqual(saved);
    const fresh = createDesignerController(createInitialProject(), storage);
    fresh.loadLocal();
    expect(fresh.store.getSnapshot().assembly).toEqual(
      controller.store.getSnapshot().assembly,
    );
  });
  it("rejects malformed, incompatible, incomplete and nonfinite files without replacing the current design", () => {
    const controller = createDesignerController(createInitialProject());
    const before = controller.store.getSnapshot();
    const invalids = [
      "not json",
      "{}",
      JSON.stringify({ ...before.project, schemaVersion: 1 }),
      JSON.stringify({
        ...before.project,
        studs: { positions: [1, 1], confirmed: true },
      }),
      JSON.stringify({
        ...before.project,
        distances: {
          ...before.project.distances,
          wallWidth: { ...before.project.distances.wallWidth, mm: -1 },
        },
      }),
      JSON.stringify({
        ...before.project,
        products: {
          ...before.project.products,
          tv: {
            ...before.project.products.tv,
            width: {
              mm: null,
              evidence: before.project.products.tv.width.evidence,
            },
          },
        },
      }),
    ];
    for (const text of invalids) {
      expect(() => controller.importProject(text)).toThrow();
      expect(controller.store.getSnapshot()).toBe(before);
    }
  });
  it("preserves sources during export and makes user-edited facts explicit", () => {
    const controller = createDesignerController(createInitialProject());
    controller.setProductDimension("slats", "depth", 15);
    const project = decodeProject(controller.exportProject());
    expect(project.products.slats.depth.evidence.source).toBe("user-entered");
    expect(project.products.tv.depth.evidence.source).toBe(
      "local-reference:television",
    );
  });
  it("reports unavailable storage without losing project edits", () => {
    const controller = createDesignerController(createInitialProject(), {
      read: () => {
        throw new Error("Storage denied");
      },
      write: () => {
        throw new Error("Storage full");
      },
    });
    controller.setDistance("tvCenterHeight", 1400);
    expect(() => controller.saveLocal()).toThrow("Storage full");
    expect(() => controller.loadLocal()).toThrow("Storage denied");
    expect(
      controller.store.getSnapshot().project.distances.tvCenterHeight.mm,
    ).toBe(1400);
  });
  it("loads the earlier mount-opening layout into the spacer-frame layout while keeping custom values", () => {
    const initial = createInitialProject();
    const distances: Record<string, unknown> = { ...initial.distances };
    for (const id of [
      "supportSpacing",
      "supportWidth",
      "supportInset",
      "upperBoxGap",
      "cradleThickness",
    ])
      delete distances[id];
    for (const id of [
      "openingWidth",
      "openingHeight",
      "mountSpacerDepth",
      "upperBoxHeight",
    ])
      distances[id] = { ...initial.distances.panelWidth, mm: 100 };
    distances.soundbarGap = {
      ...initial.distances.soundbarGap,
      mm: inches(1),
      note: "TV bottom to soundbar top; bar assumed flat.",
    };
    const upgraded = decodeProject(JSON.stringify({ ...initial, distances }));
    expect(upgraded.distances.supportSpacing.mm).toBeCloseTo(inches(16));
    expect(upgraded.distances.upperBoxGap.mm).toBeCloseTo(inches(2));
    expect(upgraded.distances.soundbarGap.mm).toBeCloseTo(inches(0.25));
    expect(upgraded.distances).not.toHaveProperty("openingWidth");
    distances.soundbarGap = {
      ...initial.distances.soundbarGap,
      mm: inches(0.5),
      note: "TV bottom to soundbar top; bar assumed flat.",
    };
    expect(
      decodeProject(JSON.stringify({ ...initial, distances })).distances
        .soundbarGap.mm,
    ).toBeCloseTo(inches(0.5));
  });
  it("retires saved centering offsets and keeps the three major elements centered", () => {
    const initial = createInitialProject();
    const distances: Record<string, unknown> = { ...initial.distances };
    for (const id of [
      "tvOffsetX",
      "consoleOffsetX",
      "panelOffsetX",
      "panelOffsetY",
    ])
      distances[id] = { ...initial.distances.mountOffsetY, mm: inches(5) };
    const project = decodeProject(JSON.stringify({ ...initial, distances }));
    const controller = createDesignerController(project);
    controller.setDistance("wallWidth", inches(120));
    controller.setDistance("panelWidth", inches(80));
    controller.setDistance("tvCenterHeight", inches(55));
    const { assembly } = controller.store.getSnapshot();
    for (const id of ["tv", "featurePanel", "console"]) {
      const b = assembly.parts.find((part) => part.id === id)!.bounds;
      expect(b.x + b.width / 2).toBeCloseTo(inches(60));
    }
    const panel = assembly.parts.find(
      (part) => part.id === "featurePanel",
    )!.bounds;
    expect(panel.y + panel.height / 2).toBeCloseTo(inches(55));
    expect(project.distances).not.toHaveProperty("tvOffsetX");
  });
});
