import { NumericalTotal, Round } from "../client/StatsMath";
import { CenterStageEnums } from "../Enums";
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

namespace CenterStage {
	export class QuantitativeData extends QuantData {
		AutoScoredBackstage: number = 0;
		AutoScoredBackdrop: number = 0;
		AutoPlacedPixelOnSpikeMark: boolean = false;
		AutoParked: boolean = false;

		TeleopScoredBackstage: number = 0;
		Mosaics: number = 0;
		SetLinesReached: number = 0;

		LandingZoneReached: number = 0;
		EndgameParked: boolean = false;
		EndgameClimbed: boolean = false;
	}

	export class PitData extends PitReportData {
		AutoBackstageSideExists: boolean = false;
		AutoBackstageParkingLocation: CenterStageEnums.CenterStageParkingLocation =
			CenterStageEnums.CenterStageParkingLocation.NotApplicable;
		AutoBackstageCanPlacePurplePixel: boolean = false;
		AutoBackstageCanPlaceYellowPixelOnBackboard: boolean = false;
		AutoBackstageCanPark: boolean = false;
		AutoBackstageWhitePixels: number = 0;
		AutoBackstageAdjustableToFitOurs: CenterStageEnums.AutoAdjustable =
			CenterStageEnums.AutoAdjustable.NoNeed;

		AutoAudienceSideExists: boolean = false;
		AutoAudienceParkingLocation: CenterStageEnums.CenterStageParkingLocation =
			CenterStageEnums.CenterStageParkingLocation.NotApplicable;
		AutoAudienceCanPlacePurplePixel: boolean = false;
		AutoAudienceCanPlaceYellowPixelOnBackboard: boolean = false;
		AutoAudienceCanPark: boolean = false;
		AutoAudienceWhitePixels: number = 0;
		AutoAudienceAdjustableToFitOurs: CenterStageEnums.AutoAdjustable =
			CenterStageEnums.AutoAdjustable.NoNeed;

		AutoSidePreference: CenterStageEnums.AutoSidePreference =
			CenterStageEnums.AutoSidePreference.NoPreference;

		CanPlaceOnBackboard: boolean = false;
		CanPickUpFromStack: boolean = false;
		PixelsMovedAtOnce: number = 0;

		EndgameCanLaunchDrone: boolean = false;
		EndgameCanHang: boolean = false;
		EndgameCanPark: boolean = false;
	}

	const quantitativeReportLayout: FormLayoutProps<QuantitativeData> = {
		Auto: [
			[["AutoScoredBackstage"], ["AutoScoredBackdrop"]],
			"AutoPlacedPixelOnSpikeMark",
			"AutoParked",
		],
		Teleop: [[["TeleopScoredBackstage"], ["Mosaics"], ["SetLinesReached"]]],
		Endgame: [[["LandingZoneReached"]], "EndgameParked", "EndgameClimbed"],
	};

	const pitReportLayout: FormLayoutProps<PitData> = {
		"Backstage Auto": [
			{ key: "AutoBackstageSideExists", label: "Has Auto?" },
			{ key: "AutoBackstageParkingLocation", label: "Parking Location" },
			{
				key: "AutoBackstageCanPlacePurplePixel",
				label: "Can Place Purple Pixel?",
			},
			{
				key: "AutoBackstageCanPlaceYellowPixelOnBackboard",
				label: "Can Place Yellow Pixel on Backboard?",
			},
			{ key: "AutoBackstageCanPark", label: "Can Park?" },
			{ key: "AutoBackstageWhitePixels", label: "White Pixels Place" },
			{
				key: "AutoBackstageAdjustableToFitOurs",
				label: "Adjustable to Fit Our Auto?",
			},
		],
		"Audience Auto": [
			{ key: "AutoAudienceSideExists", label: "Has Auto?" },
			{ key: "AutoAudienceParkingLocation", label: "Parking Location" },
			{
				key: "AutoAudienceCanPlacePurplePixel",
				label: "Can Place Purple Pixel?",
			},
			{
				key: "AutoAudienceCanPlaceYellowPixelOnBackboard",
				label: "Can Place Yellow Pixel on Backboard?",
			},
			{ key: "AutoAudienceCanPark", label: "Can Park?" },
			{ key: "AutoAudienceWhitePixels", label: "White Pixels Place" },
			{
				key: "AutoAudienceAdjustableToFitOurs",
				label: "Adjustable to Fit Our Auto?",
			},
		],
		Auto: ["AutoSidePreference"],
		Teleop: ["CanPlaceOnBackboard", "CanPickUpFromStack", "PixelsMovedAtOnce"],
		Endgame: [
			{ key: "EndgameCanLaunchDrone", label: "Can Launch Drone?" },
			{ key: "EndgameCanHang", label: "Can Hang?" },
			{ key: "EndgameCanPark", label: "Can Park?" },
		],
	};

	const statsLayout: StatsLayout<PitData, QuantitativeData> = {
		sections: {
			Auto: [
				{
					stats: [
						{ label: "Avg Scored Backstage", key: "AutoScoredBackstage" },
						{ label: "Avg Scored Backdrop", key: "AutoScoredBackdrop" },
					],
					label: "Overall Auto Accuracy",
				},
			],
			Teleop: [
				{
					label: "Avg Scored Backstage",
					key: "TeleopScoredBackstage",
				},
				{
					label: "Avg Mosaics",
					key: "Mosaics",
				},
				{
					label: "Avg Set Lines Reached",
					key: "SetLinesReached",
				},
			],
			Endgame: [
				{
					label: "Avg Landing Zone Reached",
					key: "LandingZoneReached",
				},
			],
		},
		getGraphDots: (
			quantReports: Report<QuantitativeData>[],
			pitReport?: Pitreport<PitData>,
		) => {
			return [];
		},
	};

	const pitStatsLayout: PitStatsLayout<PitData, QuantitativeData> = {
		overallSlideStats: [
			{
				label: "Avg Props",
				get: (
					pitReport: Pitreport<PitData> | undefined,
					quantitativeReports: Report<QuantitativeData>[] | undefined,
				) => {
					if (!quantitativeReports) return 0;

					return (
						quantitativeReports.reduce(
							(acc, report) =>
								acc + report.data.HasTeamProp + report.data.HasDrone,
							0,
						) / quantitativeReports.length
					);
				},
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

					const autoBackstage = NumericalTotal(
						"AutoScoredBackstage",
						quantitativeReports,
					);
					const autoBackdrop = NumericalTotal(
						"AutoScoredBackdrop",
						quantitativeReports,
					);

					return (
						Round(autoBackstage + autoBackdrop) / quantitativeReports.length
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

					const teleopBackstage = NumericalTotal(
						"TeleopScoredBackstage",
						quantitativeReports,
					);
					const mosaics = NumericalTotal("Mosaics", quantitativeReports);
					const setLines = NumericalTotal(
						"SetLinesReached",
						quantitativeReports,
					);

					return (
						Round(teleopBackstage + mosaics + setLines) /
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

					const landingZone = NumericalTotal(
						"LandingZoneReached",
						quantitativeReports,
					);

					return Round(landingZone) / quantitativeReports.length;
				},
			},
		],
		robotCapabilities: [
			{
				label: "Has Team Prop",
				key: "HasTeamProp",
			},
			{
				label: "Has Drone",
				key: "HasDrone",
			},
		],
		graphStat: {
			label: "Avg Props",
			get: (
				pitReport: Pitreport<PitData> | undefined,
				quantitativeReports: Report<QuantitativeData>[] | undefined,
			) => {
				if (!quantitativeReports) return 0;

				return (
					quantitativeReports.reduce(
						(acc, report) =>
							acc + report.data.HasTeamProp + report.data.HasDrone,
						0,
					) / quantitativeReports.length
				);
			},
		},
	};

	function getBadges(
		pitReport: Pitreport<PitData> | undefined,
		quantitativeReports: Report<QuantitativeData>[] | undefined,
		card: boolean,
	) {
		const badges: Badge[] = getBaseBadges(pitReport, quantitativeReports);

		if (pitReport?.data?.HasDrone)
			badges.push({ text: "Has Drone", color: "primary" });
		if (pitReport?.data?.HasTeamProp)
			badges.push({ text: "Has Team Prop", color: "info" });
		if (pitReport?.data?.AutoBackstageSideExists)
			badges.push({ text: "Has Auto Backstage", color: "success" });
		if (pitReport?.data?.AutoAudienceSideExists)
			badges.push({ text: "Has Auto Audience", color: "success" });
		if (pitReport?.data?.AutoBackstageCanPlacePurplePixel)
			badges.push({
				text: card
					? "Purple Pixel Backstage Auto"
					: "Can Place Purple Pixel In Backstage Auto",
				color: "accent",
			});
		if (pitReport?.data?.AutoBackstageCanPlaceYellowPixelOnBackboard)
			badges.push({
				text: card
					? "Yellow Pixel Backstage Auto"
					: "Can Place Yellow Pixel On Backboard In Backstage Auto",
				color: "accent",
			});
		if (pitReport?.data?.AutoAudienceCanPlacePurplePixel)
			badges.push({
				text: card
					? "Purple Pixel Audience Auto"
					: "Can Place Purple Pixel In Audience Auto",
				color: "secondary",
			});
		if (pitReport?.data?.AutoAudienceCanPlaceYellowPixelOnBackboard)
			badges.push({
				text: card
					? "Yellow Pixel Audience Auto"
					: "Can Place Yellow Pixel On Backboard In Audience Auto",
				color: "secondary",
			});
		if (pitReport?.data?.AutoBackstageCanPark)
			badges.push({ text: "Can Park In Backstage Auto", color: "accent" });
		if (pitReport?.data?.AutoAudienceCanPark)
			badges.push({ text: "Can Park In Audience Auto", color: "secondary" });
		if (pitReport?.data?.CanPlaceOnBackboard)
			badges.push({ text: "Can Place On Backboard", color: "primary" });
		if (pitReport?.data?.CanPickUpFromStack)
			badges.push({ text: "Can Pick Up From Stack", color: "info" });
		if (pitReport?.data?.EndgameCanLaunchDrone)
			badges.push({ text: "Can Launch Drone", color: "success" });
		if (pitReport?.data?.EndgameCanHang)
			badges.push({ text: "Can Hang", color: "accent" });
		if (pitReport?.data?.EndgameCanPark)
			badges.push({ text: "Can Park", color: "primary" });

		return badges;
	}

	/** NOT ACCURATE, just for demo */
	function getAvgPoints(reports: Report<QuantitativeData>[] | undefined) {
		console.log("Getting avg points");

		if (!reports) return 0;

		const autoBackstage = NumericalTotal("AutoScoredBackstage", reports);
		const autoBackdrop = NumericalTotal("AutoScoredBackdrop", reports);
		const teleopBackstage = NumericalTotal("TeleopScoredBackstage", reports);
		const mosaics = NumericalTotal("Mosaics", reports);
		const setLines = NumericalTotal("SetLinesReached", reports);
		const landingZone = NumericalTotal("LandingZoneReached", reports);

		return (
			Round(
				autoBackstage +
					autoBackdrop +
					teleopBackstage +
					mosaics +
					setLines +
					landingZone,
			) / Math.max(reports.length, 1)
		);
	}

	export const game = new Game(
		"Center Stage",
		2024,
		League.FTC,
		QuantitativeData,
		PitData,
		pitReportLayout,
		quantitativeReportLayout,
		statsLayout,
		pitStatsLayout,
		"CenterStage",
		"https://www.firstinspires.org/sites/default/files/uploads/resource_library/ftc/centerstage/centerstage.png",
		"",
		getBadges,
		getAvgPoints,
	);
}

export default CenterStage;
