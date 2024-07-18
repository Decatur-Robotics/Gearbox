import { Competition, Match, Pitreport, Report, SavedCompetition } from "../Types";
import { removeDuplicates } from "../client/ClientUtils";

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

function mergeMatches(original: { [_id: string]: Match }, incoming: { [_id: string]: Match }) {
  const merged: { [_id: string]: Match } = { ...original };

  for (const id in incoming) {
    if (!merged[id]) {
      merged[id] = incoming[id];
    }
    else {
      const originalMatch = merged[id];
      const incomingMatch = incoming[id];
      
      const newMatch = { ...originalMatch };

      newMatch.subjectiveReports = removeDuplicates([...originalMatch.subjectiveReports, ...incomingMatch.subjectiveReports]);

      newMatch.assignedSubjectiveScouterHasSubmitted = 
        originalMatch.assignedSubjectiveScouterHasSubmitted || incomingMatch.assignedSubjectiveScouterHasSubmitted;

      merged[id] = newMatch;
    }
  }

  return merged;
}

function mergeQuantReports(incoming: { [_id: string]: Report }, original: { [_id: string]: Report }) {
  const merged: { [_id: string]: Report } = { ...original };

  for (const id in incoming) {
    if (merged[id] === undefined) {
      merged[id] = incoming[id];
    }
    else {
      const originalReport = merged[id];
      const incomingReport = incoming[id];

      let newReport = { ...originalReport };
      
      if (originalReport.submitted && !incomingReport.submitted) {
        newReport = { ...incomingReport };
      }
      
      newReport.submitted = originalReport.submitted || incomingReport.submitted;
      newReport.data.comments = `${originalReport.data.comments}<br/>${incomingReport.data.comments}`;

      merged[id] = newReport;
    }
  }

  return merged;
}

function mergePitReports(incoming: { [_id: string]: Pitreport }, original: { [_id: string]: Pitreport }) {
  const merged = { ...original };

  for (const id in incoming) {
    if (merged[id] === undefined) {
      merged[id] = incoming[id];
    }
    else {
      const originalReport = merged[id];
      const incomingReport = incoming[id];

      let newReport = { ...originalReport };

      if (originalReport.submitted && !incomingReport.submitted) {
        newReport = { ...incomingReport };
      }

      newReport.submitted = originalReport.submitted || incomingReport.submitted;

      merged[id] = newReport;
    }
  }

  return merged;
}

export function mergeSavedComps(original: SavedCompetition, incoming: SavedCompetition) {
  original.matches = mergeMatches(original.matches, incoming.matches);
  original.comp.matches = removeDuplicates([...original.comp.matches, ...incoming.comp.matches]);

  original.quantReports = mergeQuantReports(incoming.quantReports, original.quantReports);

  original.pitReports = mergePitReports(incoming.pitReports, original.pitReports);
  original.comp.pitReports = removeDuplicates([...original.comp.pitReports, ...incoming.comp.pitReports]);

  original.users = { ...original.users, ...incoming.users };
  original.subjectiveReports = { ...original.subjectiveReports, ...incoming.subjectiveReports };
}