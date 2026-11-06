import { resolveAssembly } from "../geometry/ResolveAssembly";
import { createDesignerStore } from "./DesignerStore";
import { createInitialProject } from "./InitialProject";
import { distanceDefinitions } from "./DistanceDefinitions";
import { decodeProject, parseProject } from "../project/ProjectSchema";
import {
  encodeProject,
  loadProject,
  type ProjectStorage,
} from "../project/ProjectPersistence";
import type {
  DistanceId,
  Project,
  ProductId,
  ProductAxis,
} from "./DesignerTypes";
export function createDesignerController(
  initial: Project,
  storage?: ProjectStorage,
) {
  const validated = parseProject(initial);
  const { store, publish } = createDesignerStore({
    project: validated,
    assembly: resolveAssembly(validated),
  });
  const update = (project: Project) => {
    const next = parseProject(project);
    publish({ project: next, assembly: resolveAssembly(next) });
  };
  return {
    store,
    setMountSwivel(degrees: number) {
      if (!Number.isFinite(degrees) || degrees < 0 || degrees > 70)
        throw new RangeError("Swivel must be between 0 and 70 degrees.");
      update({ ...store.getSnapshot().project, mountSwivelDegrees: degrees });
    },
    setDistance(id: DistanceId, mm: number): void {
      const { min, max } = distanceDefinitions[id];
      if (!Number.isFinite(mm) || mm < min || mm > max)
        throw new RangeError(`Enter a distance between ${min} and ${max} mm.`);
      const current = store.getSnapshot().project;
      if (current.distances[id].mm === mm) return;
      update({
        ...current,
        distances: {
          ...current.distances,
          [id]: { ...current.distances[id], mm },
        },
      });
    },
    confirmDistance(id: DistanceId, confirmed: boolean) {
      const current = store.getSnapshot().project;
      update({
        ...current,
        distances: {
          ...current.distances,
          [id]: {
            ...current.distances[id],
            confidence: confirmed ? "confirmed" : "provisional",
          },
        },
      });
    },
    setProductDimension(id: ProductId, axis: ProductAxis, mm: number) {
      if (!Number.isFinite(mm) || mm < 1 || mm > 10000)
        throw new RangeError(
          "Part dimensions must be between 1 and 10,000 mm.",
        );
      const current = store.getSnapshot().project;
      const product = current.products[id];
      update({
        ...current,
        products: {
          ...current.products,
          [id]: {
            ...product,
            [axis]: {
              mm,
              evidence: {
                kind: "user-listing",
                source: "user-entered",
                note: "User edited dimension; verify against the actual part.",
              },
            },
          },
        },
      });
    },
    setFinish(id: ProductId, color: string) {
      const current = store.getSnapshot().project;
      update({
        ...current,
        products: {
          ...current.products,
          [id]: {
            ...current.products[id],
            appearance: { ...current.products[id].appearance, color },
          },
        },
      });
    },
    setStuds(positions: readonly number[], confirmed: boolean) {
      update({
        ...store.getSnapshot().project,
        studs: { positions: [...positions].sort((a, b) => a - b), confirmed },
      });
    },
    setSoundbarOrientation(
      soundbarOrientation: Project["soundbarOrientation"],
    ) {
      update({ ...store.getSnapshot().project, soundbarOrientation });
    },
    reset() {
      update(createInitialProject());
    },
    saveLocal() {
      if (!storage)
        throw new Error(
          "Local storage is unavailable. Export a project file instead.",
        );
      storage.write(encodeProject(store.getSnapshot().project));
    },
    loadLocal() {
      if (!storage)
        throw new Error(
          "Local storage is unavailable. Import a project file instead.",
        );
      update(loadProject(storage));
    },
    importProject(text: string) {
      update(decodeProject(text));
    },
    exportProject() {
      return encodeProject(store.getSnapshot().project);
    },
  };
}
export type DesignerController = ReturnType<typeof createDesignerController>;
