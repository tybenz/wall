import type { DesignerController } from "../designer/DesignerController";
import { DesignerContext } from "../designer/DesignerContext";
import { DesignerWorkspace } from "../designer/DesignerWorkspace";
import "./App.css";

export function App({ controller }: { controller: DesignerController }) {
  return (
    <DesignerContext.Provider value={controller}>
      <DesignerWorkspace />
    </DesignerContext.Provider>
  );
}
