export type PartId =
  | "studZone"
  | "drywall"
  | "slats"
  | "featurePanel"
  | "tv"
  | "soundbar"
  | "console";
export type Bounds = Readonly<{
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
}>;
export type AssemblyPart = Readonly<{
  id: PartId;
  label: string;
  bounds: Bounds;
  provisional: boolean;
}>;
export type Finding = Readonly<{ code: string; message: string }>;
export type Assembly = Readonly<{
  parts: readonly AssemblyPart[];
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
