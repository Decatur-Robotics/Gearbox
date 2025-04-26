import { NumericalTotal, Round } from "../client/StatsMath";
import { IntoTheDeepEnums } from "../Enums";
import { getBaseBadges } from "../games";
import { FormLayoutProps, StatsLayout, PitStatsLayout, Badge } from "../Layout";
import {
	QuantData,
	PitReportData,
	FieldPos,
	Pitreport,
	Game,
	League,
	Report,
} from "../Types";

namespace IntoTheDeep {
	export class QuantitativeData extends QuantData {
		StartedWith: IntoTheDeepEnums.StartedWith =
			IntoTheDeepEnums.StartedWith.Nothing;

		AutoScoredNetZone: number = 0;
		AutoScoredLowNet: number = 0;
		AutoScoredHighNet: number = 0;
		AutoScoredLowRung: number = 0;
		AutoScoredHighRung: number = 0;

		TeleopScoredNetZone: number = 0;
		TeleopScoredLowNet: number = 0;
		TeleopScoredHighNet: number = 0;
		TeleopScoredLowRung: number = 0;
		TeleopScoredHighRung: number = 0;

		EndgameLevelClimbed: IntoTheDeepEnums.EndgameLevelClimbed =
			IntoTheDeepEnums.EndgameLevelClimbed.None;
	}

	export class PitData extends PitReportData {
		CanPlaceInLowerBasket: boolean = false;
		CanPlaceInUpperBasket: boolean = false;
		CanPlaceOnLowerRung: boolean = false;
		CanPlaceOnUpperRung: boolean = false;
		HighestHangLevel: IntoTheDeepEnums.EndgameLevelClimbed =
			IntoTheDeepEnums.EndgameLevelClimbed.None;
		SamplesScoredInAuto: number = 0;
		SpecimensScoredInAuto: number = 0;
		AutonomousStrategy: string = "";
		AutoStartPreferred: FieldPos = FieldPos.Zero;
		AutoEndPreferred: FieldPos = FieldPos.Zero;
		GameStrategy: string = "";
	}

	const pitReportLayout: FormLayoutProps<PitData> = {
		Capabilities: [
			{ key: "CanPlaceInLowerBasket", label: "Can Place in Lower Basket?" },
			{ key: "CanPlaceInUpperBasket", label: "Can Place in Upper Basket?" },
			{ key: "CanPlaceOnLowerRung", label: "Can Place on Lower Rung?" },
			{ key: "CanPlaceOnUpperRung", label: "Can Place on Upper Rung?" },
			{ key: "HighestHangLevel", label: "Highest Hang Level" },
		],
		Auto: [
			{ key: "SamplesScoredInAuto", label: "Samples Scored in Auto" },
			{ key: "SpecimensScoredInAuto", label: "Specimens Scored in Auto" },
			{ key: "AutonomousStrategy", label: "Autonomous Strategy" },
			{ key: "AutoStartPreferred", label: "Preferred Auto Start Position" },
			{ key: "AutoEndPreferred", label: "Preferred Auto End Position" },
		],
		General: [{ key: "GameStrategy", label: "Game Strategy" }],
	};

	const quantitativeReportLayout: FormLayoutProps<QuantitativeData> = {
		"Pre-Match": ["StartedWith"],
		Auto: [
			[["AutoScoredNetZone"], ["AutoScoredLowNet"], ["AutoScoredHighNet"]],
			[["AutoScoredLowRung"], ["AutoScoredHighRung"]],
		],
		"Teleop & Endgame": [
			[
				["TeleopScoredNetZone"],
				["TeleopScoredLowNet"],
				["TeleopScoredHighNet"],
			],
			[["TeleopScoredLowRung"], ["TeleopScoredHighRung"]],
			"EndgameLevelClimbed",
		],
	};

	const statsLayout: StatsLayout<PitData, QuantitativeData> = {
		sections: {
			Auto: [
				{
					key: "AutoScoredNetZone",
					label: "Avg Scored Net Zone",
				},
				{
					stats: [
						{ label: "Avg Scored Low Net", key: "AutoScoredLowNet" },
						{ label: "Avg Scored High Net", key: "AutoScoredHighNet" },
					],
					label: "Overall Auto % in Low Net",
				},
				{
					stats: [
						{ label: "Avg Scored Low Rung", key: "AutoScoredLowRung" },
						{ label: "Avg Scored High Rung", key: "AutoScoredHighRung" },
					],
					label: "Overall Auto % on Low Rung",
				},
			],
			Teleop: [
				{
					key: "TeleopScoredNetZone",
					label: "Avg Scored Net Zone",
				},
				{
					stats: [
						{ label: "Avg Scored Low Net", key: "TeleopScoredLowNet" },
						{ label: "Avg Scored High Net", key: "TeleopScoredHighNet" },
					],
					label: "Overall Teleop % in Low Net",
				},
				{
					stats: [
						{ label: "Avg Scored Low Rung", key: "TeleopScoredLowRung" },
						{ label: "Avg Scored High Rung", key: "TeleopScoredHighRung" },
					],
					label: "Overall Teleop % on Low Rung",
				},
			],
			Endgame: [
				{
					label: "Avg Level Climbed",
					key: "EndgameLevelClimbed",
				},
			],
		},
		getGraphDots: (
			quantReports: Report<QuantitativeData>[],
			pitReport?: Pitreport<PitData>,
		) => {
			return [
				{
					...pitReport?.data?.AutoStartPreferred,
					color: { r: 255, g: 0, b: 0, a: 255 },
					size: 10,
					label: "Red dot is preferred auto start",
				},
				{
					...pitReport?.data?.AutoEndPreferred,
					color: { r: 0, g: 0, b: 255, a: 255 },
					size: 10,
					label: "Blue dot is preferred auto end",
				},
			];
		},
	};

	const pitStatsLayout: PitStatsLayout<PitData, QuantitativeData> = {
		overallSlideStats: [
			{
				label: "Avg Samples Scored in Auto",
				key: "SamplesScoredInAuto",
			},
			{
				label: "Avg Specimens Scored in Auto",
				key: "SpecimensScoredInAuto",
			},
		],
		individualSlideStats: [
			{
				label: "Avg Auto Points",
				get: (
					pitReport: Pitreport<PitData> | undefined,
					quantitativeReports: Report<QuantitativeData>[] | undefined,
				) => {
					if (!quantitativeReports) return 0;

					const netZone = NumericalTotal(
						"AutoScoredNetZone",
						quantitativeReports,
					);
					const lowNet = NumericalTotal(
						"AutoScoredLowNet",
						quantitativeReports,
					);
					const highNet = NumericalTotal(
						"AutoScoredHighNet",
						quantitativeReports,
					);
					const lowRung = NumericalTotal(
						"AutoScoredLowRung",
						quantitativeReports,
					);
					const highRung = NumericalTotal(
						"AutoScoredHighRung",
						quantitativeReports,
					);

					return (
						Round(netZone + lowNet + highNet + lowRung + highRung) /
						quantitativeReports.length
					);
				},
			},
			{
				label: "Avg Teleop Points",
				get: (
					pitReport: Pitreport<PitData> | undefined,
					quantitativeReports: Report<QuantitativeData>[] | undefined,
				) => {
					if (!quantitativeReports) return 0;

					const netZone = NumericalTotal(
						"TeleopScoredNetZone",
						quantitativeReports,
					);
					const lowNet = NumericalTotal(
						"TeleopScoredLowNet",
						quantitativeReports,
					);
					const highNet = NumericalTotal(
						"TeleopScoredHighNet",
						quantitativeReports,
					);
					const lowRung = NumericalTotal(
						"TeleopScoredLowRung",
						quantitativeReports,
					);
					const highRung = NumericalTotal(
						"TeleopScoredHighRung",
						quantitativeReports,
					);

					return (
						Round(netZone + lowNet + highNet + lowRung + highRung) /
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
						"EndgameLevelClimbed",
						quantitativeReports,
					);

					return Round(climbed) / quantitativeReports.length;
				},
			},
		],
		robotCapabilities: [
			{
				label: "Can Place in Lower Basket",
				key: "CanPlaceInLowerBasket",
			},
			{
				label: "Can Place in Upper Basket",
				key: "CanPlaceInUpperBasket",
			},
			{
				label: "Can Place on Lower Rung",
				key: "CanPlaceOnLowerRung",
			},
			{
				label: "Can Place on Upper Rung",
				key: "CanPlaceOnUpperRung",
			},
		],
		graphStat: {
			label: "Avg Samples Scored in Auto",
			key: "SamplesScoredInAuto",
		},
	};

	function getBadges(
		pitReport: Pitreport<PitData> | undefined,
		quantitativeReports: Report<QuantitativeData>[] | undefined,
		card: boolean,
	) {
		const badges: Badge[] = getBaseBadges(pitReport, quantitativeReports);

		if (pitReport?.data?.CanPlaceInLowerBasket)
			badges.push({ text: "Can Place in Lower Basket", color: "primary" });
		if (pitReport?.data?.CanPlaceInUpperBasket)
			badges.push({ text: "Can Place in Upper Basket", color: "info" });
		if (pitReport?.data?.CanPlaceOnLowerRung)
			badges.push({ text: "Can Place on Lower Rung", color: "success" });
		if (pitReport?.data?.CanPlaceOnUpperRung)
			badges.push({ text: "Can Place on Upper Rung", color: "warning" });

		return badges;
	}

	function getAvgPoints(reports: Report<QuantitativeData>[] | undefined) {
		if (!reports) return 0;

		let totalPoints = 0;
		for (const report of reports.map((r) => r.data)) {
			switch (report.EndgameLevelClimbed) {
				case IntoTheDeepEnums.EndgameLevelClimbed.Parked:
				case IntoTheDeepEnums.EndgameLevelClimbed.TouchedLowRung:
					totalPoints += 3;
					break;
				case IntoTheDeepEnums.EndgameLevelClimbed.LowLevelClimb:
					totalPoints += 15;
					break;
				case IntoTheDeepEnums.EndgameLevelClimbed.HighLevelClimb:
					totalPoints += 30;
					break;
			}

			totalPoints +=
				(report.AutoScoredNetZone + report.TeleopScoredNetZone) * 2;
			totalPoints += (report.AutoScoredLowNet + report.TeleopScoredLowNet) * 4;
			totalPoints +=
				(report.AutoScoredHighNet + report.TeleopScoredHighNet) * 8;
			totalPoints +=
				(report.AutoScoredLowRung + report.TeleopScoredLowRung) * 6;
			totalPoints +=
				(report.AutoScoredHighRung + report.TeleopScoredHighRung) * 10;
		}

		// Avoid divide by 0!
		return totalPoints / Math.max(reports.length, 1);
	}

	export const game = new Game(
		"Into the Deep",
		2025,
		League.FTC,
		QuantitativeData,
		PitData,
		pitReportLayout,
		quantitativeReportLayout,
		statsLayout,
		pitStatsLayout,
		"IntoTheDeep",
		"https://info.firstinspires.org/hubfs/Dive/into-the-deep.svg",
		"invert",
		getBadges,
		getAvgPoints,
	);
}

export default IntoTheDeep;
