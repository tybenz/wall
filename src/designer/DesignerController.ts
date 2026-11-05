import { resolveAssembly } from "../geometry/ResolveAssembly";
import { createDesignerStore } from "./DesignerStore";
import type { DistanceId, Project } from "./DesignerTypes";

export function createDesignerController(initial: Project) {
  const { store, publish } = createDesignerStore({
    project: initial,
    assembly: resolveAssembly(initial),
  });
  return {
    store,
    setDistance(id: DistanceId, mm: number): void {
      if (!Number.isFinite(mm) || mm < 0 || mm > 100_000)
        throw new RangeError(
          "Distance must be finite and between 0 and 100,000 mm.",
        );
      if (
        mm === 0 &&
        [
          "wallWidth",
          "wallHeight",
          "panelWidth",
          "panelHeight",
          "drywallThickness",
          "studDepth",
        ].includes(id)
      )
        throw new RangeError("This dimension must be greater than zero.");
      const current = store.getSnapshot().project;
      if (current.distances[id].mm === mm) return;
      const project: Project = {
        ...current,
        distances: {
          ...current.distances,
          [id]: { ...current.distances[id], mm },
        },
      };
      publish({ project, assembly: resolveAssembly(project) });
    },
  };
}

export type DesignerController = ReturnType<typeof createDesignerController>;
