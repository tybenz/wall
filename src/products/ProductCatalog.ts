import { inches } from "../shared/Units";
import type { Evidence, LengthFact, ProductCatalog } from "./ProductTypes";

const fact = (mm: number, evidence: Evidence): LengthFact => ({ mm, evidence });
const television: Evidence = {
  kind: "manufacturer",
  source: "local-reference:television",
  note: "Published dimensions are rounded; confirm actual display selection.",
};
const cabinet: Evidence = {
  kind: "manufacturer",
  source: "local-reference:cabinet",
  note: "Published overall dimensions. Exact finish and contour need confirmation.",
};
const paneling: Evidence = {
  kind: "user-listing",
  source: "local-reference:paneling",
  note: "User supplied listing dimensions. Two panels/carton; 19.38 sq ft/carton. Finish/profile details pending.",
};
const audio: Evidence = {
  kind: "manufacturer",
  source: "local-reference:audio",
  note: "Flat orientation. Cradle compatibility/orientation not confirmed.",
};
const mdf: Evidence = {
  kind: "user-listing",
  source: "local-reference:feature-panel",
  note: "Handoff: 19 mm thick, 4 × 9 ft stock. Listing not independently retrieved.",
};

export const productCatalog: ProductCatalog = {
  tv: {
    id: "television",
    name: "Television",
    width: fact(inches(56.9), television),
    height: fact(inches(32.7), television),
    depth: fact(inches(2.2), television),
    appearance: { color: "#171b20", profile: "screen" },
  },
  console: {
    id: "media-console",
    name: "Media console",
    width: fact(inches(84), cabinet),
    height: fact(inches(23.6), cabinet),
    depth: fact(inches(18.7), cabinet),
    appearance: { color: "#79523b", profile: "square-fluted" },
  },
  slats: {
    id: "fluted-paneling",
    name: "Fluted wall panels",
    width: fact(inches(11.81), paneling),
    height: fact(inches(118.11), paneling),
    depth: fact(inches(0.47), paneling),
    appearance: { color: "#9b7658", profile: "round-fluted" },
  },
  soundbar: {
    id: "soundbar",
    name: "Soundbar",
    width: fact(910, audio),
    height: fact(53, audio),
    depth: fact(131, audio),
    appearance: { color: "#25282b", profile: "grille" },
  },
  featurePanel: {
    id: "white-feature-panel",
    name: "White MDF / PET stock",
    width: fact(inches(48), mdf),
    height: fact(inches(108), mdf),
    depth: fact(19, mdf),
    appearance: { color: "#f5f3ec", profile: "smooth" },
  },
};
