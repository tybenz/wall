import type { Assembly } from "../../geometry/AssemblyTypes";
import { getPart } from "../../geometry/AssemblyTypes";
import { movePoint, type MountPreview } from "../../geometry/MountMotion";
import type { Project } from "../../designer/DesignerTypes";
import type { ViewSnapshot } from "../ViewStore";
import { getDimensions, type Dimension } from "./DimensionDefinitions";

export function getPreviewDimensions(
  project: Project,
  base: Assembly,
  state: ViewSnapshot,
  preview: MountPreview,
): Dimension[] {
  const layout = getDimensions(project, base, state);
  if (preview.preset === "parked" || state.level >= 2) return layout;
  const tv = getPart(base, "tv").bounds,
    bar = getPart(base, "soundbar").bounds,
    cradle = getPart(base, "cradle").bounds;
  const move = (point: readonly [number, number, number]) =>
    movePoint(point, preview.transform);
  const p = preview.closestRearPoint;
  return [
    ...layout.filter((d) =>
      [
        "wall-width",
        "panel-width",
        "wall-left-height",
        "beam-drop",
        "slat-depth",
        "panel-gap",
        "console-depth",
        "upper-box-gap",
      ].includes(d.id),
    ),
    {
      id: "pose-extension",
      label: "Extra extension",
      mm: preview.transform.extension,
      start: [preview.transform.pivot[0], tv.y + tv.height * 0.6, tv.z],
      end: [
        preview.transform.pivot[0],
        tv.y + tv.height * 0.6,
        tv.z + preview.transform.extension,
      ],
      field: "distance:mountExtension",

      offset: [75, 0],
    },
    {
      id: "pose-clearance",
      label: "Panel-plane clearance",
      mm: preview.rearClearance,
      start: [p[0], p[1], base.depth.panelFront],
      end: p,
      field: "distance:mountExtension",

      offset: [-90, 0],
      explanation:
        "Minimum signed distance from the moving TV, soundbar, cradle and rails to the flat panel's front plane. Negative means a part crosses that plane; collision findings also check its vertical and horizontal overlap. Increase extension or reduce swivel in TV & mount.",
    },
    ...(state.level === 0
      ? ([
          {
            id: "posed-width",
            label: "TV body width",
            mm: tv.width,
            start: move([tv.x, tv.y + tv.height, tv.z + tv.depth]),
            end: move([tv.x + tv.width, tv.y + tv.height, tv.z + tv.depth]),
            field: "product:tv:width",

            offset: [0, -30],
          },
          {
            id: "posed-soundbar-gap",
            label: "Soundbar gap",
            mm: project.distances.soundbarGap.mm,
            start: move([bar.x + bar.width, tv.y, bar.z + bar.depth]),
            end: move([
              bar.x + bar.width,
              bar.y + bar.height,
              bar.z + bar.depth,
            ]),
            field: "distance:soundbarGap",

            offset: [70, 12],
          },
          {
            id: "posed-cradle-drop",
            label: "TV bottom → cradle bottom",
            mm: tv.y - cradle.y,
            start: move([cradle.x, tv.y, cradle.z + cradle.depth]),
            end: move([cradle.x, cradle.y, cradle.z + cradle.depth]),
            field: "distance:soundbarGap",

            offset: [-80, 20],
            explanation:
              "TV bottom to cradle bottom includes the soundbar gap, body height and cradle thickness. All three parts share one rigid mount transform.",
          },
        ] satisfies Dimension[])
      : []),
  ];
}
