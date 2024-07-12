import { Competition, SavedCompetition } from "../Types";

export function saveCompToLocalStorage(comp: SavedCompetition) {
  localStorage.setItem(`comp-${comp.comp._id}`, JSON.stringify(comp));
}

export function getCompFromLocalStorage(id: string): SavedCompetition | undefined {
  const stored = localStorage.getItem(`comp-${id}`);
  return stored ? JSON.parse(stored) : undefined;
}

export function getAllCompsFromLocalStorage(): SavedCompetition[] {
  return Object.keys(localStorage)
    .filter(k => k.startsWith("comp-"))
    .map(k => getCompFromLocalStorage(k.replace("comp-", "")))
    .filter(c => c !== undefined) as SavedCompetition[];
}

export function updateCompInLocalStorage(compId: string, update: (comp: SavedCompetition) => void) {
  const comp = getCompFromLocalStorage(compId);
  if (comp) {
    update(comp);
    saveCompToLocalStorage(comp);
  }
}