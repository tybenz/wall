import type { MountPreview } from "../../geometry/MountMotion";
import { MotionGroup } from "./MotionGroup";
import type { Assembly } from "../../geometry/AssemblyTypes";
import { getPart } from "../../geometry/AssemblyTypes";
import type { Project } from "../../designer/DesignerTypes";
import type { ViewSnapshot } from "../ViewStore";
import { FlutedPaneling } from "./FlutedPaneling";
import { PanelSlab } from "./PanelSlab";
import { Television } from "./Television";
import { MediaConsole } from "./MediaConsole";
import { Soundbar } from "./Soundbar";
import { SolidPart } from "./SolidPart";
import { ConstructionDrawing } from "./ConstructionDrawing";
import { MountAssembly } from "./MountAssembly";
export function AssemblyDrawing({
  assembly,
  project,
  state,
  preview,
}: {
  assembly: Assembly;
  project: Project;
  state: ViewSnapshot;
  preview: MountPreview;
}) {
  const p = project.products,
    d = project.distances;
  const panel = getPart(assembly, "featurePanel");
  return (
    <group>
      {state.level < 4 && (
        <SolidPart bounds={getPart(assembly, "beam").bounds} color="#796044" />
      )}
      {state.level < 4 && (
        <PanelSlab
          bounds={getPart(assembly, "drywall").bounds}
          openings={getPart(assembly, "drywall").openings}
          topProfile={assembly.wallProfile}
          color="#e5e1d6"
        />
      )}
      <ConstructionDrawing assembly={assembly} state={state} />
      {state.level < 3 && (
        <FlutedPaneling
          part={getPart(assembly, "slats")}
          color={p.slats.appearance.color}
          pitch={d.slatPitch.mm}
        />
      )}
      {state.level < 2 && (
        <PanelSlab
          bounds={panel.bounds}
          openings={panel.openings}
          color={p.featurePanel.appearance.color}
        />
      )}
      {state.level < 2 && (
        <MountAssembly assembly={assembly} preview={preview} />
      )}
      {state.level === 0 && (
        <MotionGroup transform={preview.transform}>
          <Television
            bounds={getPart(assembly, "tv").bounds}
            screenOn={state.screenOn}
            color={p.tv.appearance.color}
          />
          {assembly.construction.cradle.map((bounds, index) => (
            <SolidPart
              key={`cradle-${index}`}
              bounds={bounds}
              color="#3c4140"
              radius={1}
            />
          ))}
          <Soundbar
            bounds={getPart(assembly, "soundbar").bounds}
            color={p.soundbar.appearance.color}
          />
        </MotionGroup>
      )}
      {state.level === 0 && (
        <MediaConsole
          bounds={getPart(assembly, "console").bounds}
          color={p.console.appearance.color}
          pitch={d.cabinetRibPitch.mm}
        />
      )}
      <SolidPart
        bounds={{
          x: -150,
          y: -20,
          z: -150,
          width: d.wallWidth.mm + 300,
          height: 20,
          depth: p.console.depth.mm + 650,
        }}
        color="#e3dfd5"
      />
    </group>
  );
}
