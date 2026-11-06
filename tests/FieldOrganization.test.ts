import { describe, expect, it } from "vitest";
import { createInitialProject } from "../src/designer/InitialProject";
import { createDesignerController } from "../src/designer/DesignerController";
import {
  distanceDefinitions,
  editorGroups,
} from "../src/designer/DistanceDefinitions";
import {
  fieldGroup,
  fieldIsFact,
  verificationItems,
  productAxes,
} from "../src/designer/FieldCatalog";
import { editorSections } from "../src/editor/EditorSections";
import { parseProject } from "../src/project/ProjectSchema";
import { exportConstructionSvg } from "../src/construction/ConstructionExport";
import { createViewController } from "../src/viewer/ViewStore";
describe("object-oriented editor and fact verification", () => {
  it("places each editable field in exactly one object section", () => {
    const fields = editorGroups
      .filter((g) => g.id !== "verification")
      .flatMap((g) =>
        editorSections(g.id as Exclude<typeof g.id, "verification">).flatMap(
          (s) => s.fields,
        ),
      );
    const p = createInitialProject();
    const expected = [
      ...Object.keys(distanceDefinitions).map((id) => `distance:${id}`),
      ...Object.keys(p.products).flatMap((id) =>
        productAxes.map((axis) => `product:${id}:${axis}`),
      ),
      "studs",
    ];
    expect(new Set(fields).size).toBe(fields.length);
    expect([...fields].sort()).toEqual(expected.sort());
    for (const field of fields)
      expect(
        editorSections(
          fieldGroup(field) as Exclude<
            ReturnType<typeof fieldGroup>,
            "verification"
          >,
        ).some((s) => s.fields.includes(field)),
      ).toBe(true);
  });
  it("keeps layout choices out of the verification list and does not infer verification from published evidence", () => {
    const p = createInitialProject();
    const list = verificationItems(p);
    expect(fieldIsFact("distance:cradleThickness")).toBe(true);
    expect(list.some((i) => i.field === "distance:cradleThickness")).toBe(true);
    expect(list.some((i) => i.field === "distance:panelRearGap")).toBe(false);
    expect(list.some((i) => i.field === "product:tv:width")).toBe(true);
    expect(list.every((i) => fieldIsFact(i.field))).toBe(true);
  });
  it("verifies physical facts and invalidates verification only when their values change", () => {
    const c = createDesignerController(createInitialProject());
    c.confirmDistance("cradleThickness", true);
    c.confirmProductDimension("soundbar", "height", true);
    const before = c.store.getSnapshot().project;
    c.setDistance("cradleThickness", before.distances.cradleThickness.mm);
    c.setProductDimension(
      "soundbar",
      "height",
      before.products.soundbar.height.mm,
    );
    expect(
      verificationItems(c.store.getSnapshot().project).some(
        (i) => i.field === "distance:cradleThickness",
      ),
    ).toBe(false);
    c.setDistance("cradleThickness", 8);
    c.setProductDimension("soundbar", "height", 54);
    expect(
      c.store.getSnapshot().project.distances.cradleThickness.confidence,
    ).toBe("provisional");
    expect(
      c.store.getSnapshot().project.products.soundbar.height.confidence,
    ).toBe("provisional");
    expect(
      c.store.getSnapshot().project.products.soundbar.height.evidence.note,
    ).toContain(before.products.soundbar.height.evidence.source);
    expect(() => c.confirmDistance("soundbarGap", true)).toThrow(
      "Only physical facts",
    );
  });
  it("loads old facts without pretending they are verified, preserving values and source notes", () => {
    const p = createInitialProject();
    const { confidence, ...oldFact } = p.products.tv.width;
    const legacy = {
      ...p,
      distances: {
        ...p.distances,
        cradleThickness: { ...p.distances.cradleThickness, kind: "preference" },
      },
      products: { ...p.products, tv: { ...p.products.tv, width: oldFact } },
    };
    const next = parseProject(legacy);
    expect(next.products.tv.width.confidence).toBe("provisional");
    expect(next.products.tv.width.evidence).toEqual(oldFact.evidence);
    expect(next.distances.cradleThickness.kind).toBe("measurement");
    expect(parseProject(JSON.parse(JSON.stringify(next)))).toEqual(next);
  });
  it("routes dimension jumps to the canonical object category", () => {
    const view = createViewController();
    view.openEditor("wall", "product:soundbar:depth");
    expect(view.store.getSnapshot().group).toBe("soundbar");
    view.openEditor("tv", "distance:panelRearGap");
    expect(view.store.getSnapshot().group).toBe("panel");
  });
  it("separates unresolved physical facts and layout choices in construction exports", () => {
    const c = createDesignerController(createInitialProject());
    c.confirmProductDimension("tv", "width", true);
    const svg = exportConstructionSvg(c.store.getSnapshot().project, "in");
    const unresolved = svg.slice(
      svg.indexOf("Unresolved measurements"),
      svg.indexOf("Layout choices (not measurements"),
    );
    expect(unresolved).toContain("Cradle / shelf thickness");
    expect(unresolved).not.toContain("Television width:");
    expect(unresolved).not.toContain("White panel width:");
  });
});

it("retains site and part verification across local save/load", () => {
  let text: string | null = null;
  const c = createDesignerController(createInitialProject(), {
    read: () => text,
    write: (next) => {
      text = next;
    },
  });
  c.setDistance("wallWidth", 2700);
  c.confirmDistance("wallWidth", true);
  c.setProductDimension("soundbar", "height", 54);
  c.confirmProductDimension("soundbar", "height", true);
  c.saveLocal();
  c.reset();
  c.loadLocal();
  expect(c.store.getSnapshot().project.distances.wallWidth).toMatchObject({
    mm: 2700,
    kind: "measurement",
    confidence: "confirmed",
  });
  expect(c.store.getSnapshot().project.products.soundbar.height).toMatchObject({
    mm: 54,
    confidence: "confirmed",
  });
  expect(
    verificationItems(c.store.getSnapshot().project).some(
      (i) => i.field === "product:soundbar:height",
    ),
  ).toBe(false);
});
