import type { Assembly } from "../geometry/AssemblyTypes";
import type { Project } from "./DesignerTypes";

export type DesignerSnapshot = Readonly<{
  project: Project;
  assembly: Assembly;
}>;
export type DesignerStore = Readonly<{
  getSnapshot: () => DesignerSnapshot;
  subscribe: (listener: () => void) => () => void;
}>;

/** Freeze the owned snapshot, never the caller's inputs. */
function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export function createDesignerStore(initial: DesignerSnapshot) {
  let snapshot = freeze(structuredClone(initial));
  const listeners = new Set<() => void>();
  const store: DesignerStore = {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  return {
    store,
    publish(next: DesignerSnapshot) {
      snapshot = freeze(structuredClone(next));
      [...listeners].forEach((listener) => listener());
    },
  };
}
