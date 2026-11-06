import { useRef, useState } from "react";
import type { DesignerController } from "./DesignerController";
import type { ViewController } from "../viewer/ViewStore";
export function ProjectToolbar({
  controller,
  view,
}: {
  controller: DesignerController;
  view: ViewController;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [resetting, setResetting] = useState(false);
  const act = (action: () => void, message: string) => {
    try {
      action();
      view.notify(message);
    } catch (error) {
      view.notify(
        error instanceof Error ? error.message : "Could not complete action.",
      );
    }
  };
  return (
    <div className="project-actions">
      <button
        onClick={() =>
          act(() => controller.saveLocal(), "Project saved in this browser.")
        }
        title="Save this design in your browser"
      >
        Save locally
      </button>
      <button
        onClick={() =>
          act(() => controller.loadLocal(), "Saved project loaded.")
        }
        title="Restore your last local save"
      >
        Load
      </button>
      <button
        onClick={() => {
          const url = URL.createObjectURL(
            new Blob([controller.exportProject()], {
              type: "application/json",
            }),
          );
          const link = document.createElement("a");
          link.href = url;
          link.download = "WallProject.json";
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          view.notify("Project exported.");
        }}
      >
        Export
      </button>
      <button onClick={() => input.current?.click()}>Import</button>
      <input
        ref={input}
        className="visually-hidden"
        aria-label="Import project file"
        type="file"
        accept=".json,application/json"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          try {
            if (file.size > 500000)
              throw new Error("Project file is too large.");
            controller.importProject(await file.text());
            view.notify(
              "Project imported. Save locally to keep it for next time.",
            );
          } catch (error) {
            view.notify(
              error instanceof Error ? error.message : "Import failed.",
            );
          }
          event.target.value = "";
        }}
      />
      <button onClick={() => setResetting(true)}>Reset</button>
      {resetting && (
        <div
          className="reset-popover"
          role="dialog"
          aria-label="Reset current design"
        >
          <p>
            Replace the current design with the starting layout? Your last local
            save is kept.
          </p>
          <button
            className="primary"
            onClick={() => {
              controller.reset();
              setResetting(false);
              view.notify("Starting layout restored.");
            }}
          >
            Reset design
          </button>
          <button onClick={() => setResetting(false)}>Keep design</button>
        </div>
      )}
    </div>
  );
}
