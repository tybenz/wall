import { productCatalog } from "../products/ProductCatalog";
import { inches } from "../shared/Units";
import type { DistanceInput, Project } from "./DesignerTypes";

const preference = (value: number, note: string): DistanceInput => ({
  mm: inches(value),
  kind: "preference",
  confidence: "provisional",
  note,
});
const measurement = (value: number, note: string): DistanceInput => ({
  mm: inches(value),
  kind: "measurement",
  confidence: "provisional",
  note,
});

export function createInitialProject(): Project {
  return {
    schemaVersion: 1,
    name: "TV feature wall",
    products: productCatalog,
    distances: {
      wallWidth: measurement(
        103,
        "Approximate handoff measurement; remeasure on site.",
      ),
      wallHeight: measurement(
        108,
        "Simplified rectangular wall; beam and sloped/unequal heights remain unresolved.",
      ),
      drywallThickness: measurement(
        0.5,
        "Placeholder; actual wall assembly not measured.",
      ),
      studDepth: measurement(
        3.5,
        "Placeholder framing depth; stud positions not measured.",
      ),
      tvCenterHeight: preference(
        52,
        "Exploration starting point, not an ergonomic recommendation.",
      ),
      panelWidth: preference(
        73,
        "Tentative cut width; exceeds 48-inch stock width and uses its long axis.",
      ),
      panelHeight: preference(43, "Tentative cut height."),
      panelRearGap: preference(
        1.5,
        "Slat front face to white panel REAR face; interpretation to confirm.",
      ),
      tvRearGap: preference(
        1,
        "White panel front to TV rear envelope. Placeholder, not mount collapsed depth.",
      ),
      soundbarGap: preference(
        1,
        "TV bottom to soundbar top; bar assumed flat.",
      ),
      consoleWallGap: preference(
        1,
        "Slat front face to console rear; provisional cable space.",
      ),
    },
  };
}
