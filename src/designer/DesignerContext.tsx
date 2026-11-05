import { createContext, useContext } from "react";
import type { DesignerController } from "./DesignerController";

export const DesignerContext = createContext<DesignerController | null>(null);

export function useDesignerController(): DesignerController {
  const controller = useContext(DesignerContext);
  if (!controller) throw new Error("DesignerContext provider is missing.");
  return controller;
}
