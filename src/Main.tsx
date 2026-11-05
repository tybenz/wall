import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { createDesignerController } from "./designer/DesignerController";
import { createInitialProject } from "./designer/InitialProject";

const controller = createDesignerController(createInitialProject());
const root = document.getElementById("root");
if (!root) throw new Error("Root element is missing.");
createRoot(root).render(
  <StrictMode>
    <App controller={controller} />
  </StrictMode>,
);
