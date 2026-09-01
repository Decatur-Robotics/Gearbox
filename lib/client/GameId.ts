export enum GameId {
	Crescendo = "Crescendo",
	CenterStage = "CenterStage",
	IntoTheDeep = "IntoTheDeep",
	Reefscape = "Reefscape",
	Rebuilt = "Rebuilt",
	Decode = "Decode",
}

// Creates a named set of constant values (game identifiers) and
// makes that list available for other files to import and use.

export const defaultGameId = GameId.Rebuilt;
