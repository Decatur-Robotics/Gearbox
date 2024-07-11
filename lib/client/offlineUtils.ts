import { Competition, SavedCompetition } from "../Types";

export function saveComp(comp: SavedCompetition) {
  localStorage.setItem(`comp-${comp.comp._id}`, JSON.stringify(comp));
}

export function getComp(id: string): SavedCompetition | undefined {
  const stored = localStorage.getItem(`comp-${id}`);
  return stored ? JSON.parse(stored) : undefined;
}

export function getSavedCompIds(): { [name: string]: string } {
  const keys = Object.keys(localStorage);
  const comps: { [name: string]: string } = {};
  keys.forEach((key) => {
    if (key.startsWith("comp-")) {
      comps[key] = localStorage.getItem(key) || "";
    }
  });
  return comps;
}