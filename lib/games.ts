import { Defense, FrcDrivetrain } from "./Enums";
import { Badge } from "./Layout";
import { Report, Game, PitReportData, QuantData, Pitreport } from "./Types";
import { GameId } from "./client/GameId";
import { MostCommonValue } from "./client/StatsMath";
import Crescendo from "./games/Crescendo";
import IntoTheDeep from "./games/IntoTheDeep";
import CenterStage from "./games/CenterStage";
import Reefscape from "./games/Reefscape";

export function getBaseBadges(
	pitReport: Pitreport<PitReportData> | undefined,
	quantitativeReports: Report<QuantData>[] | undefined,
) {
	const badges: Badge[] = [];
	const pitData = pitReport?.data;

	const defense = MostCommonValue("Defense", quantitativeReports ?? []);
	const drivetrain = pitData?.drivetrain;
	const motorType = pitData?.motorType;
	const swerveLevel = pitData?.swerveLevel;

	if (defense && defense !== Defense.None) {
		badges.push({
			text: defense + " Defense",
			color: defense === Defense.Full ? "primary" : "info",
		});
	}

	if (pitReport?.submitted && drivetrain) {
		const drivetrainBadge: Badge = { text: drivetrain, color: "info" };

		if (motorType) {
			drivetrainBadge.text += " (" + motorType;
		}

		if (drivetrain === FrcDrivetrain.Swerve) {
			drivetrainBadge.color = "primary";
			drivetrainBadge.text += ", " + swerveLevel;
		} else if (drivetrain === FrcDrivetrain.Mecanum) {
			drivetrainBadge.color = "warning";
		}

		if (drivetrainBadge.text.includes("(")) {
			drivetrainBadge.text += ")";
		}

		badges.push(drivetrainBadge);
	}

	return badges;
}

export const games: { [id in GameId]: Game<any, any> } = Object.freeze({
	[GameId.Reefscape]: Reefscape.game,
	[GameId.IntoTheDeep]: IntoTheDeep.game,
	[GameId.Crescendo]: Crescendo.game,
	[GameId.CenterStage]: CenterStage.game,
});
