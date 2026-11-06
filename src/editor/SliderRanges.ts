import {
  distanceDefinitions,
  type DistanceId,
} from "../designer/DistanceDefinitions";
import type {
  FieldId,
  ProductAxis,
  ProductId,
} from "../designer/DesignerTypes";
import { inches } from "../shared/Units";

export type SliderRange = Readonly<{ min: number; max: number }>;
type InchRange = readonly [number, number];
// Interaction ranges are deliberately narrower than the project's valid limits.
// Precise text entry can expand a slider without changing the entered value.
const distances: Record<DistanceId, InchRange> = {
  studWidth: [0.5, 4],
  blockingDepth: [0.5, 6],
  lagEmbedment: [0.25, 4],
  lagRowSpacing: [1, 16],
  plateWidth: [2, 12],
  plateHeight: [2, 12],
  boxWidth: [1, 12],
  boxHeight: [1, 12],
  boxDepth: [0.5, 6],
  routeDepth: [0.25, 6],
  powerRouteOffsetX: [-36, 36],
  signalRouteOffsetX: [-36, 36],
  mountExtension: [0, 36],
  wallWidth: [48, 180],
  wallHeight: [72, 144],
  wallLeftHeight: [72, 144],
  wallRightHeight: [72, 144],
  beamOffsetX: [-36, 36],
  beamWidth: [1, 18],
  beamDrop: [0.25, 12],
  beamProjection: [1, 72],
  drywallThickness: [0.25, 2],
  studDepth: [1, 12],
  tvCenterHeight: [24, 84],
  panelWidth: [24, 108],
  panelHeight: [12, 84],
  panelRearGap: [0.25, 6],
  tvRearGap: [0, 12],
  cradleThickness: [0.25, 1.5],
  soundbarGap: [0, 6],
  soundbarOffsetZ: [-6, 12],
  consoleWallGap: [0, 12],
  slatPitch: [0.5, 3.5],
  cabinetRibPitch: [0.5, 3.5],
  supportSpacing: [4, 48],
  supportWidth: [0.5, 8],
  supportInset: [0, 12],
  mountWidth: [4, 40],
  mountHeight: [2, 24],
  mountOffsetY: [-24, 24],
  blockingBottom: [12, 96],
  blockingHeight: [1, 24],
  blockingWidth: [12, 96],
  electricalOffsetX: [-48, 48],
  upperBoxGap: [0, 12],
  lowerBoxHeight: [4, 48],
};
const products: Record<ProductId, Record<ProductAxis, InchRange>> = {
  tv: { width: [24, 100], height: [12, 64], depth: [0.25, 12] },
  console: { width: [24, 120], height: [12, 48], depth: [6, 36] },
  slats: { width: [4, 24], height: [48, 144], depth: [0.25, 3.5] },
  soundbar: { width: [12, 60], height: [0.5, 12], depth: [0.5, 16] },
  featurePanel: { width: [24, 96], height: [48, 144], depth: [0.25, 3.5] },
};
export function getSliderRange(
  field: Exclude<FieldId, "studs">,
  mm: number,
): SliderRange {
  let range: InchRange;
  let limits: SliderRange;
  if (field.startsWith("distance:")) {
    const id = field.slice(9) as DistanceId;
    range = distances[id];
    limits = distanceDefinitions[id];
  } else {
    const [, product, axis] = field.split(":") as [
      "product",
      ProductId,
      ProductAxis,
    ];
    range = products[product][axis];
    limits = { min: 1, max: 10000 };
  }
  const quarter = inches(0.25);
  return {
    min: Math.max(
      limits.min,
      Math.min(inches(range[0]), Math.floor(mm / quarter) * quarter),
    ),
    max: Math.min(
      limits.max,
      Math.max(inches(range[1]), Math.ceil(mm / quarter) * quarter),
    ),
  };
}
export const sliderStep = (fine: boolean) => inches(fine ? 0.25 : 0.5);
export function snapSliderValue(
  mm: number,
  fine: boolean,
  range: SliderRange,
): number {
  const step = sliderStep(fine);
  return Math.max(
    range.min,
    Math.min(range.max, Number((Math.round(mm / step) * step).toFixed(6))),
  );
}
