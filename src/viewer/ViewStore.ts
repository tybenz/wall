import type { MountPreset } from "../geometry/MountMotion";
import type { FieldId } from "../designer/DesignerTypes";
import type { EditorGroup } from "../designer/DistanceDefinitions";
export type CameraPreset = "front" | "side" | "isometric";
export type ViewSnapshot = Readonly<{
  preset: CameraPreset;
  mountPreset: MountPreset;
  level: number;
  zoom: number;
  dimensions: boolean;
  units: "in" | "mm";
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
    preset: "front",
    mountPreset: "parked",
    level: 0,
    zoom: 1,
    dimensions: true,
    units: "in",
    drawerOpen: false,
    group: "placement",
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
      group: EditorGroup = "placement",
      focusField: FieldId | null = null,
      explanation: string | null = null,
    ) =>
      update({
        drawerOpen: true,
        group,
        focusField,
        explanation,
        focusRequest: snapshot.focusRequest + 1,
      }),
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
