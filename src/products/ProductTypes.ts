export type Evidence = Readonly<{
  kind: "manufacturer" | "user-listing" | "assumption";
  source: string;
  note: string;
}>;

export type LengthFact = Readonly<{ mm: number; evidence: Evidence }>;
export type Product = Readonly<{
  id: string;
  name: string;
  width: LengthFact;
  height: LengthFact;
  depth: LengthFact;
  appearance: Readonly<{
    color: string;
    profile: "screen" | "square-fluted" | "round-fluted" | "grille" | "smooth";
  }>;
}>;

export type ProductCatalog = Readonly<{
  tv: Product;
  console: Product;
  slats: Product;
  soundbar: Product;
  featurePanel: Product;
}>;
