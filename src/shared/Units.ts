/** All domain lengths are millimeters; inches exist only at input/output seams. */
export const inches = (value: number): number => value * 25.4;
export const toInches = (millimeters: number): number => millimeters / 25.4;
export const formatInches = (millimeters: number): string =>
  `${Number(toInches(millimeters).toFixed(3))}″`;
