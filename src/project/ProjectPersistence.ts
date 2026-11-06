import { decodeProject } from "./ProjectSchema";
import type { Project } from "../designer/DesignerTypes";
export interface ProjectStorage {
  read(): string | null;
  write(text: string): void;
}
export const encodeProject = (project: Project) =>
  JSON.stringify(project, null, 2);
export function loadProject(storage: ProjectStorage): Project {
  const text = storage.read();
  if (text === null)
    throw new Error("No project has been saved in this browser yet.");
  return decodeProject(text);
}
export function browserProjectStorage(): ProjectStorage {
  return {
    read: () => localStorage.getItem("wall-project-v2"),
    write: (text) => localStorage.setItem("wall-project-v2", text),
  };
}
