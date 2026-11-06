import type { Project } from "../designer/DesignerTypes";
import type { ProjectStorage } from "../project/ProjectPersistence";
import { parseProject } from "../project/ProjectSchema";
export type Alternative = Readonly<{ name: string; project: Project }>;
export function createAlternativeController(storage: ProjectStorage) {
  let snapshot: readonly Alternative[] = [];
  let loadError: string | null = null;
  try {
    const text = storage.read();
    if (text !== null) {
      if (text.length > 5000000)
        throw new Error("Saved alternatives are too large.");
      const raw: unknown = JSON.parse(text);
      if (!Array.isArray(raw) || raw.length > 12)
        throw new Error("Invalid saved alternatives.");
      snapshot = raw.map((entry: unknown) => {
        if (
          typeof entry !== "object" ||
          entry === null ||
          !("name" in entry) ||
          typeof entry.name !== "string" ||
          !entry.name.trim() ||
          entry.name.length > 80 ||
          !("project" in entry)
        )
          throw new Error("Invalid saved alternative.");
        return {
          name: entry.name.trim(),
          project: parseProject(entry.project),
        };
      });
      if (new Set(snapshot.map((s) => s.name)).size !== snapshot.length)
        throw new Error("Duplicate alternative names.");
    }
  } catch (error) {
    snapshot = [];
    loadError =
      error instanceof Error ? error.message : "Could not read alternatives.";
  }
  const listeners = new Set<() => void>();
  const publish = (next: readonly Alternative[]) => {
    if (loadError)
      throw new Error(
        `Saved alternatives could not be read; existing storage was kept. ${loadError}`,
      );
    storage.write(JSON.stringify(next));
    snapshot = next;
    listeners.forEach((l) => l());
  };
  return {
    store: {
      getSnapshot: () => snapshot,
      subscribe: (listener: () => void) => {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
    },
    getLoadError: () => loadError,
    save(name: string, project: Project) {
      const clean = name.trim();
      if (!clean || clean.length > 80)
        throw new Error("Use a layout name between 1 and 80 characters.");
      if (snapshot.length >= 12)
        throw new Error("Up to 12 alternatives can be saved in this browser.");
      if (snapshot.some((s) => s.name === clean))
        throw new Error(
          "That name is already saved. Choose another name or update the saved layout.",
        );
      publish([...snapshot, { name: clean, project: parseProject(project) }]);
    },
    replace(name: string, project: Project) {
      if (!snapshot.some((s) => s.name === name))
        throw new Error("Saved layout was not found.");
      publish(
        snapshot.map((s) =>
          s.name === name ? { name, project: parseProject(project) } : s,
        ),
      );
    },
  };
}
