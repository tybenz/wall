import type { WallProfile } from "./WallProfile";
export type PartId =
  | "beam"
  | "studZone"
  | "drywall"
  | "slats"
  | "featurePanel"
  | "tv"
  | "soundbar"
  | "cradle"
  | "console"
  | "mount";
export type Bounds = Readonly<{
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
}>;
export type Opening = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;
export type AssemblyPart = Readonly<{
  id: PartId;
  label: string;
  bounds: Bounds;
  provisional: boolean;
  openings?: readonly Opening[];
  topProfile?: WallProfile;
}>;
export type Finding = Readonly<{
  code: string;
  message: string;
  severity?: "info" | "warning";
}>;
export type Spacer = Bounds & Readonly<{ role: "perimeter" | "mount" }>;
export type LagPath = Readonly<{
  start: readonly [number, number, number];
  end: readonly [number, number, number];
}>;
export type Construction = Readonly<{
  studs: readonly Bounds[];
  blocking: readonly Bounds[];
  supports: readonly Spacer[];
  lagPaths: readonly LagPath[];
  cradle: readonly Bounds[];
  boxes: readonly Bounds[];
  plates: readonly Bounds[];
  routes: readonly (readonly (readonly [number, number, number])[])[];
}>;
export type Assembly = Readonly<{
  parts: readonly AssemblyPart[];
  wallProfile: WallProfile;
  construction: Construction;
  depth: Readonly<{
    slatFront: number;
    panelRear: number;
    panelFront: number;
    tvRear: number;
    tvFront: number;
  }>;
  coverage: Readonly<{ panels: number; cartons: number; nominalWidth: number }>;
  findings: readonly Finding[];
}>;
export function getPart(assembly: Assembly, id: PartId): AssemblyPart {
  const part = assembly.parts.find((part) => part.id === id);
  if (!part) throw new Error(`Missing assembly part: ${id}`);
  return part;
}
export function intersects(a: Bounds, b: Bounds): boolean {
  const epsilon = 0.01;
  return (
    a.x < b.x + b.width - epsilon &&
    b.x < a.x + a.width - epsilon &&
    a.y < b.y + b.height - epsilon &&
    b.y < a.y + a.height - epsilon &&
    a.z < b.z + b.depth - epsilon &&
    b.z < a.z + a.depth - epsilon
  );
}
