import type { LengthFact } from "../products/ProductTypes";
export const electricalParts = [
  { id: "upperPower", label: "Upper power", location: "upper", kind: "power" },
  {
    id: "upperSignal",
    label: "Upper low voltage",
    location: "upper",
    kind: "signal",
  },
  { id: "lowerPower", label: "Lower power", location: "lower", kind: "power" },
  {
    id: "lowerSignal",
    label: "Lower low voltage",
    location: "lower",
    kind: "signal",
  },
] as const;
export type ElectricalPartId = (typeof electricalParts)[number]["id"];
export const electricalDimensions = {
  plateWidth: "Plate width",
  plateHeight: "Plate height",
  plateDepth: "Plate thickness",
  bodyWidth: "Box body width",
  bodyHeight: "Box body height",
  bodyDepth: "Box body depth",
  openingWidth: "Required opening width",
  openingHeight: "Required opening height",
} as const;
export type ElectricalDimensionId = keyof typeof electricalDimensions;
export type ElectricalSpec = Readonly<
  Record<ElectricalDimensionId, LengthFact>
>;
export type ElectricalCatalog = Readonly<
  Record<ElectricalPartId, ElectricalSpec>
>;
export type ElectricalMounting = Readonly<
  Record<ElectricalPartId, "drywall" | "finish">
>;
export function createElectricalParts(): ElectricalCatalog {
  const values: Record<ElectricalDimensionId, number> = {
    plateWidth: 88.9,
    plateHeight: 127,
    plateDepth: 3,
    bodyWidth: 50.8,
    bodyHeight: 88.9,
    bodyDepth: 69.85,
    openingWidth: 57.15,
    openingHeight: 95.25,
  };
  return Object.fromEntries(
    electricalParts.map((part) => [
      part.id,
      Object.fromEntries(
        Object.entries(values).map(([id, mm]) => [
          id,
          {
            mm,
            confidence: "provisional",
            evidence: {
              kind: "assumption",
              source: "unmeasured-electrical-placeholder",
              note: `Illustrative ${part.label.toLowerCase()} ${electricalDimensions[id as ElectricalDimensionId].toLowerCase()}; verify the selected hardware and its required opening.`,
            },
          },
        ]),
      ),
    ]),
  ) as ElectricalCatalog;
}
export const initialElectricalMounting: ElectricalMounting = {
  upperPower: "drywall",
  upperSignal: "drywall",
  lowerPower: "drywall",
  lowerSignal: "drywall",
};
