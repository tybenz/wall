import type { FieldId } from "../designer/DesignerTypes";
import { getPart, type Assembly } from "../geometry/AssemblyTypes";
import type { EditorGroup } from "../designer/DistanceDefinitions";
export type CalculatedValue = Readonly<{
  label: string;
  mm?: number;
  text?: string;
  explanation: string;
  controls?: readonly { label: string; field: FieldId }[];
}>;
export function calculatedValues(
  assembly: Assembly,
  group: EditorGroup,
): CalculatedValue[] {
  const tv = getPart(assembly, "tv").bounds,
    panel = getPart(assembly, "featurePanel").bounds,
    bar = getPart(assembly, "soundbar").bounds,
    cradle = getPart(assembly, "cradle").bounds,
    console = getPart(assembly, "console").bounds;
  const m = assembly.construction.datums;
  switch (group) {
    case "wall":
      return [
        {
          label: "Blocking bottom above floor",
          mm: m.blockingBottom,
          explanation:
            "Follows the current lag rows unless manual floor height is selected.",
          controls: [
            { label: "Board height", field: "distance:blockingHeight" },
          ],
        },
        {
          label: "Blocking top above floor",
          mm: m.blockingTop,
          explanation: "Blocking bottom + chosen board height.",
        },
        {
          label: "Height for selected lag margin",
          mm: m.requiredBlockingHeight,
          explanation:
            "Lag-row separation + twice the chosen planning margin; not a structural specification.",
          controls: [
            { label: "Planning margin", field: "distance:blockingLagMargin" },
          ],
        },
      ];
    case "slats":
      return [
        {
          label: "Panels by nominal width",
          controls: [
            { label: "Wall width", field: "distance:wallWidth" },
            { label: "Stock width", field: "product:slats:width" },
          ],
          text: String(assembly.coverage.panels),
          explanation:
            "Wall width divided by panel stock width, rounded up; excludes overlap and waste.",
        },
        {
          label: "Cartons",
          controls: [{ label: "Stock width", field: "product:slats:width" }],
          text: String(assembly.coverage.cartons),
          explanation: "Two panels per carton.",
        },
        {
          label: "Tallest wall cut",
          controls: [{ label: "Ceiling height", field: "distance:wallHeight" }],
          mm: Math.max(...assembly.wallProfile.map((p) => p[1])),
          explanation: "Maximum height of the vaulted wall profile.",
        },
      ];
    case "panel":
      return [
        {
          label: "Total spacer depth",
          controls: [
            { label: "Rear gap", field: "distance:panelRearGap" },
            { label: "Slat thickness", field: "product:slats:depth" },
          ],
          mm: assembly.depth.panelRear,
          explanation:
            "Slat thickness + chosen gap behind panel. Spacers bear directly on drywall.",
        },
        {
          label: "Panel front from drywall",
          controls: [
            { label: "Panel thickness", field: "product:featurePanel:depth" },
          ],
          mm: assembly.depth.panelFront,
          explanation: "Total spacer depth + panel material thickness.",
        },
      ];
    case "tv":
      return [
        {
          label: "Hook below TV top · derived",
          mm: m.tvTopToHook,
          explanation:
            "TV top-to-upper-hole fact − reference rail hook-to-hole fact − chosen rail shift.",
          controls: [{ label: "Rail settings", field: "railPositions" }],
        },
        {
          label: "Hook above TV bottom · derived",
          mm: m.tvBottomToHook,
          explanation:
            "Current hook height − TV bottom. Changes with rail setting.",
        },
        {
          label: "Wall plate top above floor",
          mm: m.plateTop,
          explanation:
            "Hook contact height − assembled hook-to-plate-top offset.",
          controls: [
            {
              label: "Hook / plate offset",
              field: "distance:hookAbovePlateTop",
            },
          ],
        },
        {
          label: "TV bottom above floor",
          controls: [{ label: "TV center", field: "distance:tvCenterHeight" }],
          mm: tv.y,
          explanation: "TV center height − half the housing height.",
        },
        {
          label: "TV top above floor",
          controls: [{ label: "TV center", field: "distance:tvCenterHeight" }],
          mm: tv.y + tv.height,
          explanation: "TV center height + half the housing height.",
        },
        {
          label: "Proposed lag path length",
          controls: [{ label: "Embedment", field: "distance:lagEmbedment" }],
          mm:
            assembly.construction.lagPaths[0].start[2] -
            assembly.construction.lagPaths[0].end[2],
          explanation:
            "Path from the schematic mount plate face through panel, spacer and drywall plus chosen embedment. Not a fastener specification.",
        },
      ];
    case "soundbar":
      return [
        {
          label: "Cradle bottom above floor",
          controls: [{ label: "TV center", field: "distance:tvCenterHeight" }],
          mm: cradle.y,
          explanation:
            "Parked assembly: TV bottom − chosen gap − soundbar housing height − shelf thickness.",
        },
        {
          label: "TV bottom → cradle bottom",
          controls: [
            { label: "TV gap", field: "distance:soundbarGap" },
            { label: "Shelf thickness", field: "distance:cradleThickness" },
          ],
          mm: tv.y - cradle.y,
          explanation:
            "Gap + soundbar height in selected orientation + shelf thickness.",
        },
        {
          label: "Soundbar rear from panel face",
          controls: [
            { label: "Forward offset", field: "distance:soundbarOffsetZ" },
          ],
          mm: bar.z - panel.z - panel.depth,
          explanation:
            "Signed parked rear clearance based on the chosen forward offset and housing depth.",
        },
      ];
    case "console":
      return [
        {
          label: "TV bottom above console",
          controls: [
            { label: "TV center", field: "distance:tvCenterHeight" },
            { label: "Console height", field: "product:console:height" },
          ],
          mm: tv.y - console.height,
          explanation: "TV bottom height − cabinet height; parked reference.",
        },
        {
          label: "Cradle bottom above console",
          controls: [
            { label: "Console height", field: "product:console:height" },
          ],
          mm: cradle.y - console.height,
          explanation:
            "Cradle bottom height − cabinet height; parked reference.",
        },
      ];
    case "electrical":
      return [
        {
          label: "Upper plates center above floor",
          controls: [{ label: "Bracket gap", field: "distance:upperBoxGap" }],
          mm:
            assembly.construction.plates[0].y +
            assembly.construction.plates[0].height / 2,
          explanation:
            "Tracks the chosen side of the mount, gap and plate height.",
        },

      ];
    default:
      return [];
  }
}
