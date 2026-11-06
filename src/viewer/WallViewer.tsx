import type { MountPreview } from "../geometry/MountMotion";
import { Component, Suspense, lazy, useMemo, type ReactNode } from "react";
import type { Assembly } from "../geometry/AssemblyTypes";
import type { Project } from "../designer/DesignerTypes";
import { createCamera } from "./Projection";
import { useElementSize } from "./UseElementSize";
import type { ViewController, ViewSnapshot } from "./ViewStore";
import { DimensionOverlay } from "./annotations/DimensionOverlay";
const SceneCanvas = lazy(() => import("./SceneCanvas"));
class RenderBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="canvas-fallback">
        The 3D view could not start. Enable WebGL or try another browser. Your
        project inputs and export remain available.
      </div>
    ) : (
      this.props.children
    );
  }
}
export function WallViewer({
  project,
  assembly,
  view,
  state,
  preview,
}: {
  project: Project;
  assembly: Assembly;
  view: ViewController;
  state: ViewSnapshot;
  preview: MountPreview;
}) {
  const { ref, width, height } = useElementSize();
  const camera = useMemo(
    () =>
      createCamera(
        state.level < 2 ? preview.assembly : assembly,
        width,
        height,
        state.preset,
        state.zoom,
      ),
    [preview, assembly, width, height, state.preset, state.zoom, state.level],
  );
  return (
    <div
      ref={ref}
      className="viewport"
      aria-label={`${state.preset} view of the wall assembly`}
    >
      <RenderBoundary>
        <Suspense
          fallback={
            <div className="canvas-fallback">Preparing the assembly…</div>
          }
        >
          <SceneCanvas
            camera={camera}
            project={project}
            assembly={assembly}
            state={state}
            preview={preview}
          />
        </Suspense>
      </RenderBoundary>
      {state.dimensions && (
        <DimensionOverlay
          project={project}
          assembly={assembly}
          camera={camera}
          width={width}
          height={height}
          view={view}
          state={state}
          preview={preview}
        />
      )}
      <div className="viewport-caption">
        <span>
          {state.preset === "isometric"
            ? "ORTHOGRAPHIC ISOMETRIC"
            : state.preset.toUpperCase() + " ELEVATION"}
        </span>
        <span>All positions provisional · no freeform camera</span>
      </div>
      {state.level === 4 && state.showElectrical && (
        <div className="cable-legend">
          <span className="power-key" />
          Power <span className="signal-key" />
          Low voltage <small>Schematic routing</small>
        </div>
      )}
    </div>
  );
}
