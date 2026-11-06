import { it, expect } from "vitest";
import { createInitialProject } from "../src/designer/InitialProject";
import { createAlternativeController } from "../src/alternatives/AlternativeController";
it("persists independent named layouts and restores edited construction values", () => {
  let text: string | null = null;
  const storage = {
    read: () => text,
    write: (next: string) => {
      text = next;
    },
  };
  const c = createAlternativeController(storage),
    p = createInitialProject();
  c.save("Original", p);
  c.save("Different blocking", {
    ...p,
    distances: {
      ...p.distances,
      blockingHeight: { ...p.distances.blockingHeight, mm: 300 },
    },
  });
  const restored = createAlternativeController(storage).store.getSnapshot();
  expect(restored).toHaveLength(2);
  expect(restored[0].project.distances.blockingHeight.mm).toBe(
    p.distances.blockingHeight.mm,
  );
  expect(restored[1].project.distances.blockingHeight.mm).toBe(300);
  expect(() => c.save("Original", p)).toThrow("already saved");
  c.replace("Original", restored[1].project);
  expect(c.store.getSnapshot()[0].project.distances.blockingHeight.mm).toBe(
    300,
  );
});
it("keeps existing library intact when parsing or writing fails", () => {
  let text = "broken";
  const c = createAlternativeController({
    read: () => text,
    write: (next) => {
      text = next;
    },
  });
  expect(c.getLoadError()).toBeTruthy();
  expect(() => c.save("Test", createInitialProject())).toThrow(
    "existing storage was kept",
  );
  expect(text).toBe("broken");
  const failed = createAlternativeController({
    read: () => null,
    write: () => {
      throw new Error("storage full");
    },
  });
  expect(() => failed.save("Test", createInitialProject())).toThrow(
    "storage full",
  );
  expect(failed.store.getSnapshot()).toHaveLength(0);
});

it("compares physical part changes, measured status and layout settings", async () => {
  const { compareLayouts } = await import("../src/alternatives/CompareLayouts");
  const p = createInitialProject();
  const changed = {
    ...p,
    mountSwivelDegrees: 45,
    studs: { ...p.studs, confirmed: true },
    products: {
      ...p.products,
      tv: { ...p.products.tv, depth: { ...p.products.tv.depth, mm: 99 } },
    },
  };
  const rows = compareLayouts(changed, p, "mm");
  expect(rows.map((r) => r.label)).toEqual(
    expect.arrayContaining([
      "Swivel per side",
      "Stud locations confirmed",
      `${p.products.tv.name} depth`,
    ]),
  );
  expect(
    rows.find((r) => r.label === `${p.products.tv.name} depth`)?.current,
  ).toBe("99 mm");
  expect(compareLayouts(p, p, "in")).toEqual([]);
});
