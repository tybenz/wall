import { productCatalog } from "../products/ProductCatalog";
import { inches } from "../shared/Units";
import type { DistanceInput, Project } from "./DesignerTypes";

const preference = (value: number, note: string): DistanceInput => ({
  mm: inches(value),
  kind: "preference",
  confidence: "provisional",
  note,
});
const measurement = (value: number, note: string): DistanceInput => ({
  mm: inches(value),
  kind: "measurement",
  confidence: "provisional",
  note,
});

export function createInitialProject(): Project {
  return {
    schemaVersion: 2,
    name: "TV feature wall",
    products: structuredClone(productCatalog),
    studs: { positions: [8, 24, 40, 56, 72, 88].map(inches), confirmed: false },
    soundbarOrientation: "flat",
    distances: {
      tvOffsetX: preference(0, "Centered on wall; positive moves right."),
      panelOffsetX: preference(
        0,
        "Relative to TV center; positive moves right.",
      ),
      panelOffsetY: preference(0, "Relative to TV center; positive moves up."),
      consoleOffsetX: preference(
        0,
        "Relative to wall center; positive moves right.",
      ),
      soundbarOffsetZ: preference(
        3,
        "Provisional forward offset avoids panel interference; verify cradle reach.",
      ),
      slatPitch: preference(
        0.75,
        "Visual estimate. Rib profile is not a measured fabrication detail.",
      ),
      cabinetRibPitch: preference(
        0.875,
        "Visual estimate; finish and fluting proportions remain adjustable.",
      ),
      openingWidth: preference(
        22,
        "Illustrative mount access opening; verify actual mount sweep.",
      ),
      openingHeight: preference(
        15,
        "Illustrative mount access opening; verify actual mount sweep.",
      ),
      mountWidth: measurement(
        16,
        "Unmeasured wall plate placeholder; no bolt pattern is inferred.",
      ),
      mountHeight: measurement(9, "Unmeasured wall plate placeholder."),
      mountOffsetY: measurement(
        -2,
        "Unmeasured mount datum; not a VESA offset or bolt schedule.",
      ),
      mountSpacerDepth: preference(
        2,
        "Structural spacer bears on drywall/framing, never rounded ribs.",
      ),
      blockingBottom: preference(
        45,
        "Placeholder blocking position, not structural approval.",
      ),
      blockingHeight: preference(
        8,
        "Placeholder blocking size; professional review required.",
      ),
      blockingWidth: preference(
        32,
        "Zone centered on TV; boards fill available stud bays.",
      ),
      electricalOffsetX: preference(
        26,
        "Illustrative combined boxes; confirm bay and access.",
      ),
      upperBoxHeight: preference(50, "Unverified upper box center."),
      lowerBoxHeight: preference(12, "Unverified lower box center."),
      wallWidth: measurement(
        103,
        "Approximate handoff measurement; remeasure on site.",
      ),
      wallHeight: measurement(
        115,
        "User: ceiling meets beam side at 115 inches; underside is 112 inches with a 3-inch drop.",
      ),
      wallLeftHeight: measurement(
        108,
        "User supplied left-edge ceiling height: 108 inches.",
      ),
      wallRightHeight: measurement(
        108,
        "User supplied right-edge ceiling height: 108 inches, same as left edge.",
      ),
      beamOffsetX: measurement(
        0,
        "Beam assumed centered over paneling; verify offset from the left paneling edge.",
      ),
      beamWidth: measurement(
        7.25,
        "Assumed actual face width of nominal 1 × 8 wrapper; verify finished outside width.",
      ),
      beamDrop: measurement(
        3,
        "User estimate: approximately 3 inches of beam side below ceiling junction.",
      ),
      beamProjection: preference(
        24,
        "Short context preview into the room, not a measurement of the full beam length or ceiling pitch along the room.",
      ),
      drywallThickness: measurement(
        0.5,
        "Placeholder; actual wall assembly not measured.",
      ),
      studDepth: measurement(
        3.5,
        "Placeholder framing depth; stud positions not measured.",
      ),
      tvCenterHeight: preference(
        52,
        "Exploration starting point, not an ergonomic recommendation.",
      ),
      panelWidth: preference(
        73,
        "Tentative cut width; exceeds 48-inch stock width and uses its long axis.",
      ),
      panelHeight: preference(43, "Tentative cut height."),
      panelRearGap: preference(
        1.5,
        "Slat front face to white panel REAR face; interpretation to confirm.",
      ),
      tvRearGap: preference(
        1,
        "White panel front to TV rear envelope. Placeholder, not mount collapsed depth.",
      ),
      soundbarGap: preference(
        1,
        "TV bottom to soundbar top; bar assumed flat.",
      ),
      consoleWallGap: preference(
        1,
        "Slat front face to console rear; provisional cable space.",
      ),
    },
  };
}
