import { useSyncExternalStore } from "react";
import type { ViewController } from "./ViewStore";
export function useView(controller: ViewController) {
  return useSyncExternalStore(
    controller.store.subscribe,
    controller.store.getSnapshot,
  );
}
