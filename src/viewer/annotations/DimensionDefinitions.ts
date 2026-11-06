import { getFocusedDimension } from "./FocusedDimension";
import { getPart, type Assembly } from "../../geometry/AssemblyTypes";
import type { Project, FieldId } from "../../designer/DesignerTypes";
import type { EditorGroup } from "../../designer/DistanceDefinitions";
import type { ViewSnapshot } from "../ViewStore";
import type { Point3 } from "../Projection";
export type Dimension = Readonly<{
  id: string;
  label: string;
  mm: number;
  start: Point3;
  end: Point3;
  field: FieldId;
  group: EditorGroup;
  offset?: readonly [number, number];
  explanation?: string;
}>;
export function getDimensions(
  project: Project,
  assembly: Assembly,
  state: ViewSnapshot,
): Dimension[] {
  const d = project.distances,
    w = d.wallWidth.mm,
    h = d.wallHeight.mm;
  const tv = getPart(assembly, "tv").bounds,
    panel = getPart(assembly, "featurePanel").bounds,
    bar = getPart(assembly, "soundbar").bounds,
    console = getPart(assembly, "console").bounds;
  const result: Dimension[] = [];
  if (state.preset === "side") {
    const x = w / 2;
    result.push({
      id: "slat-depth",
      label: "Slats",
      mm: project.products.slats.depth.mm,
      start: [x, h * 0.85, 0],
      end: [x, h * 0.85, assembly.depth.slatFront],
      field: "product:slats:depth",
      group: "products",
      offset: [-90, -15],
    });
    result.push({
      id: "panel-gap",
      label: "Panel rear gap",
      mm: d.panelRearGap.mm,
      start: [x, panel.y + panel.height, assembly.depth.slatFront],
      end: [x, panel.y + panel.height, assembly.depth.panelRear],
      field: "distance:panelRearGap",
      group: "surfaces",
      offset: [45, -30],
    });
    result.push({
      id: "tv-gap",
      label: "TV rear gap",
      mm: d.tvRearGap.mm,
      start: [x, tv.y + tv.height * 0.7, assembly.depth.panelFront],
      end: [x, tv.y + tv.height * 0.7, assembly.depth.tvRear],
      field: "distance:tvRearGap",
      group: "placement",
      offset: [55, 0],
    });
    result.push({
      id: "console-depth",
      label: "Console depth",
      mm: console.depth,
      start: [console.x, 60, console.z],
      end: [console.x, 60, console.z + console.depth],
      field: "product:console:depth",
      group: "products",
      offset: [0, 35],
    });
  } else {
    const leftHeight = getFocusedDimension(
      "distance:wallLeftHeight",
      project,
      assembly,
    )!;
    result.push({
      ...leftHeight,
      id: "wall-left-height",
      label: "Left ceiling",
      offset: [-65, 0],
    });
    const beamDrop = getFocusedDimension(
      "distance:beamDrop",
      project,
      assembly,
    )!;
    result.push({
      ...beamDrop,
      id: "beam-drop",
      label: "Beam side",
      offset: [65, -25],
    });
    result.push({
      id: "wall-width",
      label: "Wall width",
      mm: w,
      start: [0, 0, 0],
      end: [w, 0, 0],
      field: "distance:wallWidth",
      group: "surfaces",
      offset: [0, 38],
    });
    result.push({
      id: "panel-width",
      label: "Panel width",
      mm: panel.width,
      start: [panel.x, panel.y + panel.height, panel.z + panel.depth],
      end: [
        panel.x + panel.width,
        panel.y + panel.height,
        panel.z + panel.depth,
      ],
      field: "distance:panelWidth",
      group: "surfaces",
      offset: [0, -30],
    });
    if (state.level === 0) {
      result.push({
        id: "tv-height",
        label: "TV center",
        mm: d.tvCenterHeight.mm,
        start: [w, 0, tv.z],
        end: [w, d.tvCenterHeight.mm, tv.z],
        field: "distance:tvCenterHeight",
        group: "placement",
        offset: [75, 0],
      });
      result.push({
        id: "soundbar-gap",
        label: "Soundbar gap",
        mm: d.soundbarGap.mm,
        start: [tv.x + tv.width, tv.y, bar.z + bar.depth],
        end: [tv.x + tv.width, bar.y + bar.height, bar.z + bar.depth],
        field: "distance:soundbarGap",
        group: "placement",
        offset: [55, 12],
      });
      result.push({
        id: "tv-bottom",
        label: "TV bottom · derived",
        mm: tv.y,
        start: [tv.x, 0, tv.z],
        end: [tv.x, tv.y, tv.z],
        field: "distance:tvCenterHeight",
        group: "placement",
        offset: [-90, 0],
        explanation:
          "TV bottom = TV center height − half the TV body height. Edit center height here, or body height in Parts.",
      });
    }
  }
  if (state.level === 0) {
    const cradle = getPart(assembly, "cradle").bounds;
    result.push({
      id: "cradle-drop",
      label: "TV bottom → cradle bottom",
      mm: tv.y - cradle.y,
      start: [cradle.x, tv.y, cradle.z + cradle.depth],
      end: [cradle.x, cradle.y, cradle.z + cradle.depth],
      field: "distance:soundbarGap",
      group: "placement",
      offset: [-100, 20],
      explanation:
        "TV bottom to cradle bottom = TV-to-soundbar gap + soundbar housing height in the selected orientation + cradle thickness. Edit the gap here; thickness is in Structure. Cradle geometry is provisional.",
    });
  }
  if (state.level >= 1) {
    const gap = getFocusedDimension("distance:upperBoxGap", project, assembly)!;
    result.push({
      ...gap,
      id: "upper-box-gap",
      label: "Bracket → plates",
      offset: [75, 0],
    });
  }
  if (state.level >= 2) {
    const spacing = getFocusedDimension(
      "distance:supportSpacing",
      project,
      assembly,
    )!;
    result.push({
      ...spacing,
      id: "mount-spacer-spacing",
      label: "Mount spacers · O.C.",
      offset: [0, -30],
    });
  }
  if (state.level === 4) {
    result.push({
      id: "blocking-height",
      label: "Blocking bottom",
      mm: d.blockingBottom.mm,
      start: [0, 0, -d.drywallThickness.mm],
      end: [0, d.blockingBottom.mm, -d.drywallThickness.mm],
      field: "distance:blockingBottom",
      group: "structure",
      offset: [-70, 0],
    });
  }
  const active = state.hoveredField ?? state.activeField;
  if (active && !result.some((dimension) => dimension.field === active)) {
    const focused = getFocusedDimension(active, project, assembly);
    if (focused) result.push(focused);
  }
  return result;
}
