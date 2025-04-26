import { Dot } from "@/components/stats/Heatmap";
import {
	GetMinimum,
	GetMaximum,
	NumericalTotal,
	Round,
} from "../client/StatsMath";
import { ReefscapeEnums, Defense } from "../Enums";
import { getBaseBadges } from "../games";
import { FormLayoutProps, StatsLayout, PitStatsLayout, Badge } from "../Layout";
import {
	QuantData,
	PitReportData,
	Pitreport,
	Game,
	League,
	Report,
} from "../Types";

namespace Reefscape {
	export class QuantitativeData extends QuantData {
		AutoMovedPastStartingline: boolean = false;

		AutoCoralScoredLevelOne: number = 0;
		AutoCoralScoredLevelTwo: number = 0;
		AutoCoralScoredLevelThree: number = 0;
		AutoCoralScoredLevelFour: number = 0;

		AutoAlgaeRemovedFromReef: number = 0;
		AutoAlgaeScoredProcessor: number = 0;
		AutoAlgaeScoredNet: number = 0;

		TeleopCoralScoredLevelOne: number = 0;
		TeleopCoralScoredLevelTwo: number = 0;
		TeleopCoralScoredLevelThree: number = 0;
		TeleopCoralScoredLevelFour: number = 0;

		TeleopAlgaeRemovedFromReef: number = 0;
		TeleopAlgaeScoredProcessor: number = 0;
		TeleopAlgaeScoredNet: number = 0;

		EndgameClimbStatus: ReefscapeEnums.EndgameClimbStatus =
			ReefscapeEnums.EndgameClimbStatus.None;
		EndGameDefenseStatus: Defense = Defense.None;
	}

	export class PitData extends PitReportData {
		CanDriveUnderShallowCage: boolean = false;
		GroundIntake: boolean = false;
		DriveThroughDeepCage: ReefscapeEnums.DriveThroughDeepCage =
			ReefscapeEnums.DriveThroughDeepCage.No;
		AutoCapabilities: ReefscapeEnums.AutoCapabilities =
			ReefscapeEnums.AutoCapabilities.NoAuto;
		CanRemoveAlgae: boolean = false;
		CanScoreAlgaeInProcessor: boolean = false;
		CanScoreAlgaeInNet: boolean = false;
		CanScoreCoral1: boolean = false;
		CanScoreCoral2: boolean = false;
		CanScoreCoral3: boolean = false;
		CanScoreCoral4: boolean = false;
		AlgaeScoredAuto: number = 0;
		CoralScoredAuto: number = 0;
		Climbing: ReefscapeEnums.Climbing = ReefscapeEnums.Climbing.No;
	}

	const pitReportLayout: FormLayoutProps<PitData> = {
		Capabilities: [
			{
				key: "CanDriveUnderShallowCage",
				label: "Can Drive Under Shallow Cage?",
			},
			{ key: "GroundIntake", label: "Has Ground Intake?" },
			{ key: "CanRemoveAlgae", label: "Can Remove Algae?" },
			{
				key: "CanScoreAlgaeInProcessor",
				label: "Can Score Algae in Processor?",
			},
			{ key: "CanScoreAlgaeInNet", label: "Can Score Algae in Net?" },
			{ key: "Climbing", label: "Climbing?" },
			{ key: "CanScoreCoral1", label: "Can Score Coral at L1?" },
			{ key: "CanScoreCoral2", label: "Can Score Coral at L2?" },
			{ key: "CanScoreCoral3", label: "Can Score Coral at L3?" },
			{ key: "CanScoreCoral4", label: "Can Score Coral at L4?" },
		],
		"Auto (Describe more in comments)": [
			{ key: "AutoCapabilities", label: "Auto Capabilities?" },
			{ key: "CoralScoredAuto", label: "Average Coral Scored In Auto" },
			{ key: "AlgaeScoredAuto", label: "Average Algae Scored In Auto" },
		],
	};

	const quantitativeReportLayout: FormLayoutProps<QuantitativeData> = {
		Auto: [
			{ key: "AutoMovedPastStartingLine", label: "Moved Past Starting Line" },
			[
				[
					{
						key: "AutoCoralScoredLevelOne",
						label: "Coral Scored Level One (Auto)",
					},
					{
						key: "AutoCoralScoredLevelThree",
						label: "Coral Scored Level Three (Auto)",
					},
				],
				[
					{
						key: "AutoCoralScoredLevelTwo",
						label: "Coral Scored Level Two (Auto)",
					},
					{
						key: "AutoCoralScoredLevelFour",
						label: "Coral Scored Level Four (Auto)",
					},
				],
			],
			[
				[
					{
						key: "AutoAlgaeRemovedFromReef",
						label: "Algae Removed From Reef (Auto)",
					},
				],
				[
					{
						key: "AutoAlgaeScoredProcessor",
						label: "Algae Scored Processor (Auto)",
					},
				],
				[{ key: "AutoAlgaeScoredNet", label: "Algae Scored Net (Auto)" }],
			],
		],
		Teleop: [
			[
				[
					{
						key: "TeleopCoralScoredLevelOne",
						label: "Coral Scored Level One (Teleop)",
					},
					{
						key: "TeleopCoralScoredLevelThree",
						label: "Coral Scored Level Three (Teleop)",
					},
				],
				[
					{
						key: "TeleopCoralScoredLevelTwo",
						label: "Coral Scored Level Two (Teleop)",
					},
					{
						key: "TeleopCoralScoredLevelFour",
						label: "Coral Scored Level Four (Teleop)",
					},
				],
			],
			[
				[
					{
						key: "TeleopAlgaeRemovedFromReef",
						label: "Algae Removed From Reef (Teleop)",
					},
				],
				[
					{
						key: "TeleopAlgaeScoredProcessor",
						label: "Algae Scored Processor (Teleop)",
					},
				],
				[{ key: "TeleopAlgaeScoredNet", label: "Algae Scored Net (Teleop)" }],
			],
		],
		"Post Match": ["EndgameClimbStatus", "Defense"],
	};

	const statsLayout: StatsLayout<PitData, QuantitativeData> = {
		sections: {
			Auto: [
				{
					key: "AutoCoralScoredLevelOne",
					label: "Avg Amt Of Coral Scored Level One Auto",
				},
				{
					label: "> Min Auto L1 Coral",
					get(pitData, quantitativeReports) {
						return GetMinimum(quantitativeReports!, "AutoCoralScoredLevelOne");
					},
				},
				{
					label: "> Max Auto L1 Coral",
					get(pitData, quantitativeReports) {
						return GetMaximum(quantitativeReports!, "AutoCoralScoredLevelOne");
					},
				},
				{
					key: "AutoCoralScoredLevelTwo",
					label: "Avg Amt Of Coral Scored Level Two Auto",
				},
				{
					label: "> Min Auto L2 Coral",
					get(pitData, quantitativeReports) {
						return GetMinimum(quantitativeReports!, "AutoCoralScoredLevelTwo");
					},
				},
				{
					label: "> Max Auto L2 Coral",
					get(pitData, quantitativeReports) {
						return GetMaximum(quantitativeReports!, "AutoCoralScoredLevelTwo");
					},
				},
				{
					key: "AutoCoralScoredLevelThree",
					label: "Avg Amt Of Coral Scored Level Three Auto",
				},
				{
					label: "> Min Auto L3 Coral",
					get(pitData, quantitativeReports) {
						return GetMinimum(
							quantitativeReports!,
							"AutoCoralScoredLevelThree",
						);
					},
				},
				{
					label: "> Max Auto L3 Coral",
					get(pitData, quantitativeReports) {
						return GetMaximum(
							quantitativeReports!,
							"AutoCoralScoredLevelThree",
						);
					},
				},
				{
					key: "AutoCoralScoredLevelFour",
					label: "Avg Amt Of Coral Scored Level Four Auto",
				},
				{
					label: "> Min Auto L4 Coral",
					get(pitData, quantitativeReports) {
						return GetMinimum(quantitativeReports!, "AutoCoralScoredLevelFour");
					},
				},
				{
					label: "> Max Auto L4 Coral",
					get(pitData, quantitativeReports) {
						return GetMaximum(quantitativeReports!, "AutoCoralScoredLevelFour");
					},
				},
				{
					label: "Avg Auto Coral",
					get(pitData, quantitativeReports) {
						if (!quantitativeReports) return 0;

						return (
							quantitativeReports?.reduce(
								(acc, report) =>
									acc +
									report.data.AutoCoralScoredLevelOne +
									report.data.AutoCoralScoredLevelTwo +
									report.data.AutoCoralScoredLevelThree +
									report.data.AutoCoralScoredLevelFour,
								0,
							) / quantitativeReports?.length
						);
					},
				},
				{
					key: "AutoAlgaeRemovedFromReef",
					label: "Avg Amt of Algae Removed From Reef",
				},
				{
					label: "> Min Algae Removed From Reef",
					get(pitData, quantitativeReports) {
						return GetMinimum(quantitativeReports!, "AutoAlgaeRemovedFromReef");
					},
				},
				{
					label: "> Max Algae Removed From Reef",
					get(pitData, quantitativeReports) {
						return GetMaximum(quantitativeReports!, "AutoAlgaeRemovedFromReef");
					},
				},
				{
					key: "AutoAlgaeScoredProcessor",
					label: "Avg Amt of Algae Scored Processor Auto",
				},
				{
					label: "> Min Algae Scored In Processor",
					get(pitData, quantitativeReports) {
						return GetMinimum(quantitativeReports!, "AutoAlgaeScoredProcessor");
					},
				},
				{
					label: "> Max Algae Scored In Processor",
					get(pitData, quantitativeReports) {
						return GetMaximum(quantitativeReports!, "AutoAlgaeScoredProcessor");
					},
				},
				{
					key: "AutoAlgaeScoredNet",
					label: "Avg Amt of Algae Scored Net Auto",
				},
				{
					label: "> Min Algae Scored In Net",
					get(pitData, quantitativeReports) {
						return GetMinimum(quantitativeReports!, "AutoAlgaeScoredNet");
					},
				},
				{
					label: "> Max Algae Scored In Net",
					get(pitData, quantitativeReports) {
						return GetMaximum(quantitativeReports!, "AutoAlgaeScoredNet");
					},
				},
			],
			Teleop: [
				{
					key: "TeleopCoralScoredLevelOne",
					label: "Avg Amt Of Coral Scored Level One Teleop",
				},
				{
					label: "> Min L1 Coral Scored",
					get(pitData, quantitativeReports) {
						return GetMinimum(
							quantitativeReports!,
							"TeleopCoralScoredLevelOne",
						);
					},
				},
				{
					label: "> Max L1 Coral Scored",
					get(pitData, quantitativeReports) {
						return GetMaximum(
							quantitativeReports!,
							"TeleopCoralScoredLevelOne",
						);
					},
				},
				{
					key: "TeleopCoralScoredLevelTwo",
					label: "Avg Amt Of Coral Scored Level Two Teleop",
				},
				{
					label: "> Min L2 Coral Scored",
					get(pitData, quantitativeReports) {
						return GetMinimum(
							quantitativeReports!,
							"TeleopCoralScoredLevelTwo",
						);
					},
				},
				{
					label: "> Max L2 Coral Scored",
					get(pitData, quantitativeReports) {
						return GetMaximum(
							quantitativeReports!,
							"TeleopCoralScoredLevelTwo",
						);
					},
				},
				{
					key: "TeleopCoralScoredLevelThree",
					label: "Avg Amt Of Coral Scored Level Three Teleop",
				},
				{
					label: "> Min L3 Coral Scored",
					get(pitData, quantitativeReports) {
						return GetMinimum(
							quantitativeReports!,
							"TeleopCoralScoredLevelThree",
						);
					},
				},
				{
					label: "> Max L3 Coral Scored",
					get(pitData, quantitativeReports) {
						return GetMaximum(
							quantitativeReports!,
							"TeleopCoralScoredLevelThree",
						);
					},
				},
				{
					key: "TeleopCoralScoredLevelFour",
					label: "Avg Amt Of Coral Scored Level Four Teleop",
				},
				{
					label: "> Min L4 Coral Scored",
					get(pitData, quantitativeReports) {
						return GetMinimum(
							quantitativeReports!,
							"TeleopCoralScoredLevelFour",
						);
					},
				},
				{
					label: "> Max L4 Coral Scored",
					get(pitData, quantitativeReports) {
						return GetMaximum(
							quantitativeReports!,
							"TeleopCoralScoredLevelFour",
						);
					},
				},
				{
					label: "Avg Teleop Coral",
					get(pitData, quantitativeReports) {
						if (!quantitativeReports) return 0;

						return (
							quantitativeReports?.reduce(
								(acc, report) =>
									acc +
									report.data.TeleopCoralScoredLevelOne +
									report.data.TeleopCoralScoredLevelTwo +
									report.data.TeleopCoralScoredLevelThree +
									report.data.TeleopCoralScoredLevelFour,
								0,
							) / quantitativeReports?.length
						);
					},
				},
				{
					key: "TeleopAlgaeRemovedFromReef",
					label: "Avg Amt of Algae Removed From Reef",
				},
				{
					label: "> Min Algae Removed From Reef",
					get(pitData, quantitativeReports) {
						return GetMinimum(
							quantitativeReports!,
							"TeleopAlgaeRemovedFromReef",
						);
					},
				},
				{
					label: "> Max Algae Removed From Reef",
					get(pitData, quantitativeReports) {
						return GetMaximum(
							quantitativeReports!,
							"TeleopAlgaeRemovedFromReef",
						);
					},
				},
				{
					key: "TeleopAlgaeScoredProcessor",
					label: "Avg Amt of Algae Scored Processor Teleop",
				},
				{
					label: "> Min Algae Scored In Processor",
					get(pitData, quantitativeReports) {
						return GetMinimum(
							quantitativeReports!,
							"TeleopAlgaeScoredProcessor",
						);
					},
				},
				{
					label: "> Max Algae Scored In Processor",
					get(pitData, quantitativeReports) {
						return GetMaximum(
							quantitativeReports!,
							"TeleopAlgaeScoredProcessor",
						);
					},
				},
				{
					key: "TeleopAlgaeScoredNet",
					label: "Avg Amt of Algae Scored Net Teleop",
				},
				{
					label: "> Min Algae Scored In Net",
					get(pitData, quantitativeReports) {
						return GetMinimum(quantitativeReports!, "TeleopAlgaeScoredNet");
					},
				},
				{
					label: "> Max Algae Scored In Net",
					get(pitData, quantitativeReports) {
						return GetMaximum(quantitativeReports!, "TeleopAlgaeScoredNet");
					},
				},
			],
		},
		getGraphDots: function (
			quantitativeReports: Report<QuantitativeData>[],
			pitReport?: Pitreport<PitData> | undefined,
		): Dot[] {
			return [];
		},
	};

	const pitStatsLayout: PitStatsLayout<PitData, QuantitativeData> = {
		overallSlideStats: [
			{
				label: "Average Algae Scored In Auto",
				key: "AlgaeScoredAuto",
			},
			{
				label: "Average Coral Scored In Auto",
				key: "CoralScoredAuto",
			},
		],
		individualSlideStats: [
			{
				label: "Average Auto Points",
				get: (
					pitReport: Pitreport<PitData> | undefined,
					quantitativeReports: Report<QuantitativeData>[] | undefined,
				) => {
					if (!quantitativeReports) return 0;

					const CoralLvlOne = NumericalTotal(
						"AutoCoralScoredLevelOne",
						quantitativeReports,
					);

					const CoralLvlTwo = NumericalTotal(
						"AutoCoralScoredLevelTwo",
						quantitativeReports,
					);

					const CoralLvlThree = NumericalTotal(
						"AutoCoralScoredLevelThree",
						quantitativeReports,
					);

					const CoralLvlFour = NumericalTotal(
						"AutoCoralScoredLevelFour",
						quantitativeReports,
					);

					const AlgaeNet = NumericalTotal(
						"AutoAlgaeScoredNet",
						quantitativeReports,
					);

					const AlgaeProcessor = NumericalTotal(
						"AutoAlgaeScoredProcessor",
						quantitativeReports,
					);

					return (
						(CoralLvlOne +
							CoralLvlTwo +
							CoralLvlThree +
							CoralLvlFour +
							AlgaeNet +
							AlgaeProcessor) /
						quantitativeReports.length
					);
				},
			},
			{
				label: "Average Teleop Points",
				get: (
					pitReport: Pitreport<PitData> | undefined,
					quantitativeReports: Report<QuantitativeData>[] | undefined,
				) => {
					if (!quantitativeReports) return 0;

					const CoralLvlOne = NumericalTotal(
						"TeleopCoralScoredLevelOne",
						quantitativeReports,
					);

					const CoralLvlTwo = NumericalTotal(
						"TeleopCoralScoredLevelTwo",
						quantitativeReports,
					);

					const CoralLvlThree = NumericalTotal(
						"TeleopCoralScoredLevelThree",
						quantitativeReports,
					);

					const CoralLvlFour = NumericalTotal(
						"TeleopCoralScoredLevelFour",
						quantitativeReports,
					);

					const AlgaeNet = NumericalTotal(
						"TeleopAlgaeScoredNet",
						quantitativeReports,
					);

					const AlgaeProcessor = NumericalTotal(
						"TeleopAlgaeScoredProcessor",
						quantitativeReports,
					);

					return (
						(CoralLvlOne +
							CoralLvlTwo +
							CoralLvlThree +
							CoralLvlFour +
							AlgaeNet +
							AlgaeProcessor) /
						quantitativeReports.length
					);
				},
			},
			{
				label: "Avg Endgame Points",
				get: (
					pitReport: Pitreport<PitData> | undefined,
					quantitativeReports: Report<QuantitativeData>[] | undefined,
				) => {
					if (!quantitativeReports) return 0;

					const climbed = NumericalTotal(
						"EndgameClimbStatus",
						quantitativeReports,
					);

					return Round(climbed) / quantitativeReports.length;
				},
			},
		],
		robotCapabilities: [
			{
				key: "CanDriveUnderShallowCage",
				label: "Can Drive Under Shallow Cage?",
			},
			{ key: "CanRemoveAlgae", label: "Can Remove Algae?" },
			{
				key: "CanScoreAlgaeInProcessor",
				label: "Can Score Algae in Processor?",
			},
			{ key: "CanScoreAlgaeInNet", label: "Can Score Algae in Net?" },
			{ key: "Climbing", label: "Climbing?" },
		],
		graphStat: {
			label: "Average Algae Scored In The Net During Teleop",
			key: "TeleopAlgaeScoredNet",
		},
	};

	function getBadges(
		pitReport: Pitreport<PitData> | undefined,
		quantitativeReports: Report<QuantitativeData>[] | undefined,
		card: boolean,
	) {
		const badges: Badge[] = getBaseBadges(pitReport, quantitativeReports);

		if (pitReport?.data?.CanRemoveAlgae)
			badges.push({ text: "Can Remove Algae", color: "primary" });
		if (pitReport?.data?.GroundIntake)
			badges.push({ text: "Ground Intake", color: "primary" });
		if (pitReport?.data?.CanScoreAlgaeInNet)
			badges.push({ text: "Can Score Algae Net", color: "secondary" });
		if (pitReport?.data?.CanScoreAlgaeInProcessor)
			badges.push({ text: "Can Score Algae Processor", color: "success" });
		if (pitReport?.data?.CanDriveUnderShallowCage)
			badges.push({ text: "Can Drive Under Shallow Cage", color: "info" });

		if (pitReport?.data?.CanScoreCoral1)
			badges.push({ text: "L1 Coral", color: "info" });
		if (pitReport?.data?.CanScoreCoral2)
			badges.push({ text: "L2 Coral", color: "secondary" });
		if (pitReport?.data?.CanScoreCoral3)
			badges.push({ text: "L3 Coral", color: "primary" });
		if (pitReport?.data?.CanScoreCoral4)
			badges.push({ text: "L4 Coral", color: "accent" });
		if (
			!(
				pitReport?.data?.CanScoreCoral1 ||
				pitReport?.data?.CanScoreCoral2 ||
				pitReport?.data?.CanScoreCoral3 ||
				pitReport?.data?.CanScoreCoral4
			)
		)
			badges.push({ text: "No Coral", color: "warning" });
		if (pitReport?.data?.Climbing === ReefscapeEnums.Climbing.Deep)
			badges.push({ text: "Deep Climb", color: "secondary" });
		else if (pitReport?.data?.Climbing === ReefscapeEnums.Climbing.Shallow)
			badges.push({ text: "Shallow Climb", color: "primary" });

		return badges;
	}

	function getAvgPoints(reports: Report<QuantitativeData>[] | undefined) {
		if (!reports) return 0;

		let totalPoints = 0;

		for (const report of reports.map((r) => r.data)) {
			switch (report.EndgameClimbStatus) {
				case ReefscapeEnums.EndgameClimbStatus.None:
					break;
				case ReefscapeEnums.EndgameClimbStatus.Park:
					totalPoints += 2;
					break;
				case ReefscapeEnums.EndgameClimbStatus.High:
					totalPoints += 6;
					break;
				case ReefscapeEnums.EndgameClimbStatus.Low:
					totalPoints += 12;
					break;
			}

			totalPoints +=
				(report.TeleopCoralScoredLevelOne + report.TeleopAlgaeScoredProcessor) *
				2;
			totalPoints +=
				(report.AutoCoralScoredLevelOne + report.TeleopCoralScoredLevelTwo) * 3;
			totalPoints +=
				(report.AutoCoralScoredLevelTwo +
					report.TeleopCoralScoredLevelThree +
					report.AutoAlgaeScoredNet +
					report.TeleopAlgaeScoredNet) *
				4;
			totalPoints += report.TeleopCoralScoredLevelFour * 5;
			totalPoints +=
				(report.AutoAlgaeScoredProcessor + report.AutoCoralScoredLevelThree) *
				6;
			totalPoints += report.AutoCoralScoredLevelFour * 7;
		}

		return totalPoints / Math.max(reports.length, 1);
	}

	export const game = new Game(
		"Reefscape",
		2025,
		League.FRC,
		QuantitativeData,
		PitData,
		pitReportLayout,
		quantitativeReportLayout,
		statsLayout,
		pitStatsLayout,
		"Reefscape",
		"https://info.firstinspires.org/hubfs/Dive/reef-scape.svg",
		"invert",
		getBadges,
		getAvgPoints,
	);
}

export default Reefscape;
