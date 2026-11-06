import { fieldIsFact, fieldVerified } from "../../designer/FieldCatalog";
import type { OrthographicCamera } from "three";
import type { Assembly } from "../../geometry/AssemblyTypes";
import type { Project } from "../../designer/DesignerTypes";
import { projectPoint } from "../Projection";
import type { ViewController, ViewSnapshot } from "../ViewStore";
import { formatInches } from "../../shared/Units";
import { getPreviewDimensions } from "./MountDimensions";
import type { MountPreview } from "../../geometry/MountMotion";
import { DimensionAnnotation } from "./DimensionAnnotation";
export function DimensionOverlay({
  project,
  assembly,
  camera,
  width,
  height,
  view,
  state,
  preview,
}: {
  project: Project;
  assembly: Assembly;
  camera: OrthographicCamera;
  width: number;
  height: number;
  view: ViewController;
  state: ViewSnapshot;
  preview: MountPreview;
}) {
  const placed: { x: number; y: number; width: number }[] = [];
  return (
    <svg
      className="dimension-overlay"
      width={width}
      height={height}
      aria-label="Interactive drawing dimensions"
    >
      {getPreviewDimensions(project, assembly, state, preview).map(
        (dimension) => {
          const start = projectPoint(dimension.start, camera, width, height),
            end = projectPoint(dimension.end, camera, width, height);
          const value =
            state.units === "in"
              ? formatInches(dimension.mm)
              : `${Number(dimension.mm.toFixed(1))} mm`;
          const label = `${dimension.label} ${value}`,
            labelWidth = Math.max(100, label.length * 6.1 + 36);
          const x = Math.max(
            labelWidth / 2 + 8,
            Math.min(
              width - labelWidth / 2 - 8,
              (start[0] + end[0]) / 2 + (dimension.offset?.[0] ?? 0),
            ),
          );
          let y = Math.max(
            20,
            Math.min(
              height - 20,
              (start[1] + end[1]) / 2 + (dimension.offset?.[1] ?? 0),
            ),
          );
          for (
            let tries = 0;
            tries < 12 &&
            placed.some(
              (item) =>
                Math.abs(item.x - x) < (item.width + labelWidth) / 2 + 4 &&
                Math.abs(item.y - y) < 32,
            );
            tries++
          )
            y = y + 34 > height - 20 ? Math.max(20, y - 68) : y + 34;
          placed.push({ x, y, width: labelWidth });
          return (
            <DimensionAnnotation
              key={dimension.id}
              intent={
                dimension.explanation
                  ? "Calculated"
                  : fieldIsFact(dimension.field)
                    ? `Physical fact · ${fieldVerified(project, dimension.field) ? "verified" : "needs verification"}`
                    : "Layout"
              }
              dimension={dimension}
              start={start}
              end={end}
              labelPosition={[x, y]}
              label={label}
              active={
                (state.hoveredField ?? state.activeField) === dimension.field
              }
              view={view}
            />
          );
        },
      )}
    </svg>
  );
}
