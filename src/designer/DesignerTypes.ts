import type { ProductCatalog } from "../products/ProductTypes";
import type { DistanceId } from "./DistanceDefinitions";
export type { DistanceId } from "./DistanceDefinitions";
export type DistanceInput = Readonly<{
  mm: number;
  kind: "measurement" | "preference";
  confidence: "confirmed" | "provisional";
  note: string;
}>;
export type ProductId = keyof ProductCatalog;
export type ProductAxis = "width" | "height" | "depth";
export type FieldId =
  `distance:${DistanceId}` | `product:${ProductId}:${ProductAxis}` | "studs";
export type Project = Readonly<{
  schemaVersion: 2;
  name: string;
  distances: Readonly<Record<DistanceId, DistanceInput>>;
  products: ProductCatalog;
  studs: Readonly<{ positions: readonly number[]; confirmed: boolean }>;
  soundbarOrientation: "flat" | "vertical";
  mountSwivelDegrees: number;
}>;
