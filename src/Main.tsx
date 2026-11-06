import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { createDesignerController } from "./designer/DesignerController";
import { createInitialProject } from "./designer/InitialProject";
import {
  browserProjectStorage,
  loadProject,
} from "./project/ProjectPersistence";
const storage = browserProjectStorage();
let initial = createInitialProject();
try {
  initial = loadProject(storage);
} catch {
  /* Missing or invalid local data never prevents opening the editor. */
}
const controller = createDesignerController(initial, storage);
const root = document.getElementById("root");
if (!root) throw new Error("Root element is missing.");
createRoot(root).render(
  <StrictMode>
    <App controller={controller} />
  </StrictMode>,
);
