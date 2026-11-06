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
    mountSwivelDegrees: 30,
    distances: {
      studWidth: measurement(
        1.5,
        "Assumed stud face width; verify actual framing stock.",
      ),
      blockingDepth: measurement(
        3.5,
        "Provisional blocking depth; front face is flush with the back of drywall.",
      ),
      lagEmbedment: measurement(
        1.75,
        "Proposed embedment from blocking front face; not a fastener specification.",
      ),
      lagRowSpacing: measurement(
        4.5,
        "Illustrative vertical hole spacing, centered on the mount plate. Measure actual holes.",
      ),
      plateWidth: measurement(
        5.905511811023622,
        "Unmeasured combined power / low-voltage plate envelope.",
      ),
      plateHeight: measurement(
        5.118110236220473,
        "Unmeasured combined plate height; upper plate top tracks the bracket gap.",
      ),
      boxWidth: measurement(
        5.118110236220473,
        "Unmeasured combined box / rough-opening envelope. Separate compartments remain schematic.",
      ),
      boxHeight: measurement(
        4.330708661417323,
        "Unmeasured rough-opening height, centered behind the plate group.",
      ),
      boxDepth: measurement(
        2.25,
        "Depth behind the back of drywall; the box extends forward to the finished surface.",
      ),
      routeDepth: measurement(
        1.25,
        "Illustrative in-wall route plane, measured behind the back of drywall.",
      ),
      powerRouteOffsetX: measurement(
        -1.25,
        "Proposed vertical power route; penetrations through framing are not modeled.",
      ),
      signalRouteOffsetX: measurement(
        1.25,
        "Proposed vertical signal route; independent of the power route.",
      ),

      mountExtension: preference(
        18,
        "Additional TV-rear travel from the parked position. Provisional preview range, not verified mount reach.",
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
      supportSpacing: measurement(
        16,
        "User layout: two vertical mount spacers at 16 inches on center, centered on TV mount.",
      ),
      supportWidth: preference(
        3.5,
        "Illustrative spacer face width; actual stock not specified.",
      ),
      supportInset: preference(
        2,
        "Illustrative inset of perimeter frame from flat panel edges.",
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
        0,
        "Lower box offset relative to mount center; upper plates always track mount center.",
      ),
      upperBoxGap: preference(
        2,
        "User layout: 2-inch clear vertical separation from mount wall plate bottom to upper electrical plates top; group centered on mount.",
      ),
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
      cradleThickness: preference(
        0.25,
        "Illustrative cradle material thickness only; actual accessory dimensions are unverified.",
      ),
      soundbarGap: preference(
        0.25,
        "User preference: quarter-inch clearance from TV bottom to soundbar top; cradle follows TV swivel mount.",
      ),
      consoleWallGap: preference(
        1,
        "Slat front face to console rear; provisional cable space.",
      ),
    },
  };
}
