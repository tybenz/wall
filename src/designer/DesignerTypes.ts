import type { ProductCatalog } from "../products/ProductTypes";

export type DistanceId =
  | "wallWidth"
  | "wallHeight"
  | "drywallThickness"
  | "studDepth"
  | "tvCenterHeight"
  | "panelWidth"
  | "panelHeight"
  | "panelRearGap"
  | "tvRearGap"
  | "soundbarGap"
  | "consoleWallGap";

export type DistanceInput = Readonly<{
  mm: number;
  kind: "measurement" | "preference";
  confidence: "confirmed" | "provisional";
  note: string;
}>;

export type Project = Readonly<{
  schemaVersion: 1;
  name: string;
  distances: Readonly<Record<DistanceId, DistanceInput>>;
  products: ProductCatalog;
}>;
