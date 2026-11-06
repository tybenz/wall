import type { ElectricalPartId } from "../electrical/ElectricalTypes";
import { fieldGroup } from "../designer/FieldCatalog";
import type { ConstructionView } from "../construction/ConstructionSections";
import type { MountPreset } from "../geometry/MountMotion";
import type { FieldId } from "../designer/DesignerTypes";
import type { EditorGroup } from "../designer/DistanceDefinitions";
export type CameraPreset = "front" | "side" | "isometric";
export type ViewSnapshot = Readonly<{
  workspace: "assembly" | "construction";
  constructionView: ConstructionView;
  preset: CameraPreset;
  mountPreset: MountPreset;
  level: number;
  zoom: number;
  dimensions: boolean;
  units: "in" | "mm";
  electricalPart: ElectricalPartId;
  drawerOpen: boolean;
  group: EditorGroup;
  focusField: FieldId | null;
  focusRequest: number;
  hoveredField: FieldId | null;
  activeField: FieldId | null;
  explanation: string | null;
  showElectrical: boolean;
  showSupports: boolean;
  screenOn: boolean;
  notice: string | null;
}>;
export function createViewController() {
  let snapshot: ViewSnapshot = Object.freeze({
    workspace: "assembly",
    constructionView: "framing",
    preset: "front",
    mountPreset: "parked",
    level: 0,
    zoom: 1,
    dimensions: true,
    units: "in",
    electricalPart: "upperPower",
    drawerOpen: false,
    group: "tv",
    focusField: null,
    focusRequest: 0,
    hoveredField: null,
    activeField: null,
    explanation: null,
    showElectrical: true,
    showSupports: true,
    screenOn: true,
    notice: null,
  });
  const listeners = new Set<() => void>();
  const update = (patch: Partial<ViewSnapshot>) => {
    snapshot = Object.freeze({ ...snapshot, ...patch });
    [...listeners].forEach((listener) => listener());
  };
  const store = {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  return {
    store,
    setWorkspace: (workspace: ViewSnapshot["workspace"]) =>
      update({ workspace }),
    setConstructionView: (constructionView: ConstructionView) =>
      update({ constructionView }),
    setMountPreset: (mountPreset: MountPreset) => update({ mountPreset }),
    setPreset: (preset: CameraPreset) => update({ preset }),
    setLevel: (level: number) =>
      update({ level: Math.max(0, Math.min(4, level)) }),
    setZoom: (zoom: number) =>
      update({ zoom: Math.max(0.6, Math.min(2, zoom)) }),
    setUnits: (units: ViewSnapshot["units"]) => update({ units }),
    toggle: (
      key: "dimensions" | "showElectrical" | "showSupports" | "screenOn",
    ) => update({ [key]: !snapshot[key] }),
    openEditor: (
      group: EditorGroup = "tv",
      focusField: FieldId | null = null,
      explanation: string | null = null,
    ) =>
      update({
        drawerOpen: true,
        ...(focusField?.startsWith("electrical:")
          ? { electricalPart: focusField.split(":")[1] as ElectricalPartId }
          : {}),
        group: focusField ? fieldGroup(focusField) : group,
        focusField,
        explanation,
        focusRequest: snapshot.focusRequest + 1,
      }),
    setElectricalPart: (electricalPart: ElectricalPartId) =>
      update({ electricalPart, focusField: null, activeField: null }),
    setGroup: (group: EditorGroup) =>
      update({ group, focusField: null, explanation: null }),
    closeEditor: () =>
      update({
        drawerOpen: false,
        focusField: null,
        activeField: null,
        explanation: null,
      }),
    hover: (hoveredField: FieldId | null) => update({ hoveredField }),
    focus: (activeField: FieldId | null) => update({ activeField }),
    notify: (notice: string | null) => update({ notice }),
  };
}
export type ViewController = ReturnType<typeof createViewController>;
