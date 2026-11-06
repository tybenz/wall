import { describe, expect, it } from "vitest";
import { createInitialProject } from "../src/designer/InitialProject";
import {
  distanceDefinitions,
  type DistanceId,
} from "../src/designer/DistanceDefinitions";
import { getSliderRange, snapSliderValue } from "../src/editor/SliderRanges";
import { inches, toInches } from "../src/shared/Units";

describe("measurement slider policy", () => {
  it("snaps on half-inch and Shift quarter-inch grids in millimeters", () => {
    const range = { min: inches(-6), max: inches(12) };
    expect(toInches(snapSliderValue(inches(1.3), false, range))).toBeCloseTo(
      1.5,
    );
    expect(toInches(snapSliderValue(inches(1.3), true, range))).toBeCloseTo(
      1.25,
    );
    expect(toInches(snapSliderValue(inches(-1.3), false, range))).toBeCloseTo(
      -1.5,
    );
    expect(toInches(snapSliderValue(inches(-1.3), true, range))).toBeCloseTo(
      -1.25,
    );
    expect(snapSliderValue(inches(100), false, range)).toBe(range.max);
    expect(snapSliderValue(inches(-100), true, range)).toBe(range.min);
  });
  it("keeps slider ranges inside domain limits and includes precise existing measurements", () => {
    const project = createInitialProject();
    for (const id of Object.keys(distanceDefinitions) as DistanceId[]) {
      const mm = project.distances[id].mm;
      const range = getSliderRange(`distance:${id}`, mm);
      expect(range.min).toBeGreaterThanOrEqual(distanceDefinitions[id].min);
      expect(range.max).toBeLessThanOrEqual(distanceDefinitions[id].max);
      expect(mm).toBeGreaterThanOrEqual(range.min);
      expect(mm).toBeLessThanOrEqual(range.max);
      expect(range.max).toBeGreaterThan(range.min);
    }
    const thickness = project.products.slats.depth.mm;
    expect(thickness).toBeCloseTo(inches(0.47));
    const range = getSliderRange("product:slats:depth", thickness);
    expect(range.min).toBeLessThan(thickness);
    expect(range.max).toBeGreaterThan(thickness);
  });
  it("expands for text-entered values outside the normal interaction range", () => {
    const large = inches(200.125);
    expect(
      getSliderRange("distance:wallWidth", large).max,
    ).toBeGreaterThanOrEqual(large);
    const tiny = 1;
    expect(getSliderRange("product:slats:depth", tiny).min).toBe(tiny);
  });
});
