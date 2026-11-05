import { describe, expect, it } from "vitest";
import { createDesignerController } from "../src/designer/DesignerController";
import { createInitialProject } from "../src/designer/InitialProject";
import { inches } from "../src/shared/Units";

describe("designer controller and store contract", () => {
  it("publishes inputs and derived geometry atomically and preserves evidence", () => {
    const initial = createInitialProject();
    const controller = createDesignerController(initial);
    const before = controller.store.getSnapshot();
    expect(controller.store.getSnapshot()).toBe(before);
    const observations: number[] = [];
    const unsubscribe = controller.store.subscribe(() => {
      const { project, assembly } = controller.store.getSnapshot();
      expect(assembly.depth.panelRear).toBeCloseTo(
        project.products.slats.depth.mm + project.distances.panelRearGap.mm,
      );
      observations.push(project.distances.panelRearGap.mm);
    });
    controller.setDistance("panelRearGap", inches(2));
    expect(observations).toEqual([inches(2)]);
    expect(before.project.distances.panelRearGap.mm).toBe(inches(1.5));
    expect(initial.distances.panelRearGap.mm).toBe(inches(1.5));
    expect(
      controller.store.getSnapshot().project.products.slats.depth.evidence,
    ).toEqual(initial.products.slats.depth.evidence);
    expect(
      Object.isFrozen(controller.store.getSnapshot().project.distances),
    ).toBe(true);
    controller.setDistance("panelRearGap", inches(2));
    expect(observations).toHaveLength(1);
    unsubscribe();
    controller.setDistance("panelRearGap", inches(3));
    expect(observations).toHaveLength(1);
  });

  it("rejects invalid edits without changing state or notifying subscribers", () => {
    const controller = createDesignerController(createInitialProject());
    const before = controller.store.getSnapshot();
    let notifications = 0;
    controller.store.subscribe(() => {
      notifications++;
    });
    for (const value of [NaN, Infinity, -1, 100_001])
      expect(() => controller.setDistance("panelRearGap", value)).toThrow(
        RangeError,
      );
    expect(() => controller.setDistance("wallWidth", 0)).toThrow(RangeError);
    expect(controller.store.getSnapshot()).toBe(before);
    expect(notifications).toBe(0);
  });

  it("does not share state between workspaces", () => {
    const first = createDesignerController(createInitialProject());
    const second = createDesignerController(createInitialProject());
    first.setDistance("panelRearGap", inches(3));
    expect(second.store.getSnapshot().project.distances.panelRearGap.mm).toBe(
      inches(1.5),
    );
  });
});
