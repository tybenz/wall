import { useSyncExternalStore } from "react";
import type { DesignerStore } from "./DesignerStore";

export function useDesigner(store: DesignerStore) {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
