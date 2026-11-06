import type { Assembly, Bounds } from "../../geometry/AssemblyTypes";
import { getPart } from "../../geometry/AssemblyTypes";
import type {
  FieldId,
  Project,
  ProductId,
  ProductAxis,
  DistanceId,
} from "../../designer/DesignerTypes";
import { distanceDefinitions } from "../../designer/DistanceDefinitions";
import type { Dimension } from "./DimensionDefinitions";
import type { Point3 } from "../Projection";
export function getFocusedDimension(
  field: FieldId,
  project: Project,
  assembly: Assembly,
): Dimension | null {
  const { distances: d } = project,
    w = d.wallWidth.mm,
    h = d.wallHeight.mm;
  const tv = getPart(assembly, "tv").bounds,
    panel = getPart(assembly, "featurePanel").bounds,
    console = getPart(assembly, "console").bounds,
    mount = getPart(assembly, "mount").bounds;
  const center = (b: Bounds): Point3 => [
    b.x + b.width / 2,
    b.y + b.height / 2,
    b.z + b.depth,
  ];
  if (field === "studs") return null;
  const axisDimension = (
    b: Bounds,
    axis: ProductAxis,
    mm: number,
  ): [Point3, Point3] =>
    axis === "width"
      ? [
          [b.x, b.y + b.height, b.z + b.depth],
          [b.x + mm, b.y + b.height, b.z + b.depth],
        ]
      : axis === "height"
        ? [
            [b.x, b.y, b.z + b.depth],
            [b.x, b.y + mm, b.z + b.depth],
          ]
        : [
            [b.x, b.y + b.height / 2, b.z],
            [b.x, b.y + b.height / 2, b.z + mm],
          ];
  if (field.startsWith("product:")) {
    const [, key, axis] = field.split(":") as [
      "product",
      ProductId,
      ProductAxis,
    ];
    const product = project.products[key];
    const b = getPart(
      assembly,
      key === "featurePanel" ? "featurePanel" : key,
    ).bounds;
    const mm = product[axis].mm;
    const displayAxis =
      key === "soundbar" && project.soundbarOrientation === "vertical"
        ? axis === "height"
          ? "depth"
          : axis === "depth"
            ? "height"
            : axis
        : axis;
    const [start, end] = axisDimension(b, displayAxis, mm);
    return {
      id: field,
      label: `${product.name} ${axis}`,
      mm,
      start,
      end,
      field,
      group: "products",
      offset: [0, -34],
    };
  }
  const id = field.slice(9) as DistanceId;
  let start: Point3 = [0, 0, 0],
    end: Point3 = [0, 0, 0];
  const panelCenter = center(panel),
    tvCenter = center(tv),
    consoleCenter = center(console);
  const upper = assembly.construction.boxes[0],
    boxCenter = center(upper);
  switch (id) {
    case "wallWidth":
      start = [0, 0, 0];
      end = [w, 0, 0];
      break;
    case "wallHeight":
      start = [assembly.wallProfile[1][0], 0, 0];
      end = [start[0], h, 0];
      break;
    case "wallLeftHeight":
      start = [0, 0, 0];
      end = [0, d.wallLeftHeight.mm, 0];
      break;
    case "wallRightHeight":
      start = [w, 0, 0];
      end = [w, d.wallRightHeight.mm, 0];
      break;
    case "beamOffsetX":
      start = [w / 2, h, 0];
      end = [w / 2 + d.beamOffsetX.mm, h, 0];
      break;
    case "beamWidth": {
      const b = getPart(assembly, "beam").bounds;
      [start, end] = axisDimension(b, "width", b.width);
      break;
    }
    case "beamDrop": {
      const b = getPart(assembly, "beam").bounds;
      [start, end] = axisDimension(b, "height", b.height);
      break;
    }
    case "beamProjection": {
      const b = getPart(assembly, "beam").bounds;
      [start, end] = axisDimension(b, "depth", b.depth);
      break;
    }
    case "drywallThickness":
      start = [w, h * 0.7, -d.drywallThickness.mm];
      end = [w, h * 0.7, 0];
      break;
    case "studDepth":
      start = [w, h * 0.8, -d.drywallThickness.mm - d.studDepth.mm];
      end = [w, h * 0.8, -d.drywallThickness.mm];
      break;
    case "tvCenterHeight":
      start = [tvCenter[0], 0, tvCenter[2]];
      end = tvCenter;
      break;
    case "panelWidth":
      [start, end] = axisDimension(panel, "width", panel.width);
      break;
    case "panelHeight":
      [start, end] = axisDimension(panel, "height", panel.height);
      break;
    case "panelRearGap":
      start = [panel.x, panelCenter[1], assembly.depth.slatFront];
      end = [panel.x, panelCenter[1], panel.z];
      break;
    case "tvRearGap":
      start = [tv.x, tvCenter[1], assembly.depth.panelFront];
      end = [tv.x, tvCenter[1], tv.z];
      break;
    case "soundbarGap":
      start = [tv.x, tv.y, tvCenter[2]];
      end = [tv.x, tv.y - d.soundbarGap.mm, tvCenter[2]];
      break;
    case "soundbarOffsetZ":
      start = [tvCenter[0], tv.y - 80, assembly.depth.tvFront];
      end = [
        tvCenter[0],
        tv.y - 80,
        assembly.depth.tvFront + d.soundbarOffsetZ.mm,
      ];
      break;
    case "consoleWallGap":
      start = [console.x, consoleCenter[1], assembly.depth.slatFront];
      end = [console.x, consoleCenter[1], console.z];
      break;
    case "slatPitch":
      start = [0, h * 0.9, assembly.depth.slatFront];
      end = [d.slatPitch.mm, h * 0.9, assembly.depth.slatFront];
      break;
    case "cabinetRibPitch":
      start = [console.x, console.y + console.height, consoleCenter[2]];
      end = [
        console.x + d.cabinetRibPitch.mm,
        console.y + console.height,
        consoleCenter[2],
      ];
      break;
    case "cradleThickness": {
      const b = getPart(assembly, "cradle").bounds;
      start = [b.x, b.y, b.z + b.depth];
      end = [b.x, b.y + d.cradleThickness.mm, b.z + b.depth];
      break;
    }
    case "supportSpacing": {
      const supports = assembly.construction.supports.filter(
        (b) => b.role === "mount",
      );
      start = [
        supports[0].x + supports[0].width / 2,
        supports[0].y + supports[0].height / 2,
        panel.z,
      ];
      end = [supports[1].x + supports[1].width / 2, start[1], panel.z];
      break;
    }
    case "supportWidth": {
      const b = assembly.construction.supports[0];
      start = [b.x, b.y, panel.z];
      end = [b.x, b.y + b.height, panel.z];
      break;
    }
    case "supportInset":
      start = [panel.x, panel.y, panel.z];
      end = [panel.x + d.supportInset.mm, panel.y, panel.z];
      break;
    case "mountWidth":
      [start, end] = axisDimension(mount, "width", mount.width);
      break;
    case "mountHeight":
      [start, end] = axisDimension(mount, "height", mount.height);
      break;
    case "mountOffsetY":
      start = [tvCenter[0], tvCenter[1], mount.z];
      end = [tvCenter[0], tvCenter[1] + d.mountOffsetY.mm, mount.z];
      break;
    case "blockingBottom":
      start = [tvCenter[0], 0, -d.drywallThickness.mm];
      end = [tvCenter[0], d.blockingBottom.mm, -d.drywallThickness.mm];
      break;
    case "blockingWidth":
      start = [
        tvCenter[0] - d.blockingWidth.mm / 2,
        d.blockingBottom.mm,
        -d.drywallThickness.mm,
      ];
      end = [start[0] + d.blockingWidth.mm, start[1], start[2]];
      break;
    case "blockingHeight":
      start = [tvCenter[0], d.blockingBottom.mm, -d.drywallThickness.mm];
      end = [start[0], start[1] + d.blockingHeight.mm, start[2]];
      break;
    case "electricalOffsetX":
      start = [mount.x + mount.width / 2, d.lowerBoxHeight.mm, 0];
      end = [start[0] + d.electricalOffsetX.mm, start[1], 0];
      break;
    case "upperBoxGap":
      start = [boxCenter[0], upper.y + upper.height, 0];
      end = [boxCenter[0], mount.y, 0];
      break;
    case "lowerBoxHeight":
      start = [boxCenter[0], 0, 0];
      end = [boxCenter[0], d.lowerBoxHeight.mm, 0];
      break;
  }
  return {
    id: field,
    label: distanceDefinitions[id].label,
    mm: d[id].mm,
    start,
    end,
    field,
    group: distanceDefinitions[id].group,
    offset: [-45, -32],
  };
}
