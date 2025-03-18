import Container from "@/components/Container";
import BarGraph from "@/components/stats/Graph";
import {
	Competition,
	PitReportData,
	Pitreport,
	QuantData,
	Report,
} from "@/lib/Types";
import { serializeDatabaseObject } from "@/lib/UrlResolver";

import { GetServerSideProps } from "next";
import { BsGearFill } from "react-icons/bs";

import ClientApi from "@/lib/api/ClientApi";
import { useCallback, useEffect, useRef, useState } from "react";
import { getDatabase } from "@/lib/MongoDB";
import {
	MostCommonValue,
	NumericalAverage,
	StandardDeviation,
} from "@/lib/client/StatsMath";

import { TheBlueAlliance } from "@/lib/TheBlueAlliance";
import { NotLinkedToTba } from "@/lib/client/ClientUtils";
import { games } from "@/lib/games";
import { PitStatsLayout, Badge } from "@/lib/Layout";
import CollectionId from "@/lib/client/CollectionId";
import { matchesMiddleware } from "next/dist/shared/lib/router/router";
import { Round } from "../../../../lib/client/StatsMath";

const api = new ClientApi();

type PitReportPair = { [team: number]: Pitreport };

function TeamSlide(props: {
	teamNumber: number;
	pitReport: Pitreport;
	matchReports: Report[];
	ranking: TheBlueAlliance.SimpleRank | undefined;
	maxRanking: number;
	layout: PitStatsLayout<PitReportData, QuantData>;
	getBadges: (
		pitReport: Pitreport<PitReportData> | undefined,
		quantitativeReports: Report<QuantData>[] | undefined,
		card: boolean,
	) => Badge[];
	stats: {
		label: string;
		value: number;
		mean: number;
		stDev: number;
		rank: number;
		maxRanking: number;
	}[];
}) {
	const [visible, setVisible] = useState(false);
	const pit = props.pitReport;

	useEffect(() => {
		setVisible(true);
		return () => {
			setVisible(false);
		};
	}, []);

	function Graph() {
		const stat = props.layout.graphStat;

		if (!stat) return <></>;

		const data = [];
		if (stat.get) {
			data.push(stat.get(props.pitReport, props.matchReports));
		} else if (stat.key) {
			if (props.matchReports.length && stat.key in props.matchReports[0].data) {
				for (const report of props.matchReports) {
					data.push(report.data[stat.key as string]);
				}
			} else if (props.pitReport.data) {
				data.push(props.pitReport.data[stat.key as string]);
			}
		}

		return (
			<BarGraph
				label={stat.label}
				xlabels={props.matchReports.map((r, i) => String(i + 1))}
				data={data}
			/>
		);
	}

	function RobotCapabilities() {
		const robotCapabilities = props.layout.robotCapabilities;

		if (!robotCapabilities) return <></>;

		const elements = robotCapabilities.map((cap, index) => {
			let value: any = cap.get?.call(cap, pit, props.matchReports);

			if (!value && cap.key) {
				if (props.matchReports.length > 0 && cap.key in props.matchReports[0]) {
					value = MostCommonValue(cap.key as string, props.matchReports);
				} else if (pit.data && cap.key in pit.data) {
					value = pit.data[cap.key as string];
				}
			}

			return (
				<p
					key={index}
					className="text-lg"
				>
					{cap.label}: <span className="text-accent">{value}</span>
				</p>
			);
		});

		return (
			<div>
				<h1 className="mt-4 text-lg font-semibold">Robot Capabilities:</h1>
				{elements}
			</div>
		);
	}

	function IndividualStats() {
		const elements = props.stats.map((stat, index) => {
			const diff = stat.value - stat.mean;

			return (
				<div key={index}>
					<p className="text-lg">
						{stat.label}:{" "}
						<span className="text-accent">{Round(stat.value)}</span>{" "}
						<span className="text-primary">
							(Ranked #{stat.rank}/{stat.maxRanking})
						</span>
					</p>
					<p className="text-sm ml-4">
						{Math.abs(diff).toFixed(2)}{" "}
						{stat.value - stat.mean >= 0 ? "above" : "below"} comp average of{" "}
						{stat.mean.toFixed(2)}
						<br />
						{Math.abs(diff / stat.stDev).toFixed(2)} standard deviations{" "}
						{diff / stat.stDev >= 0 ? "above" : "below"} average (StDev ={" "}
						{stat.stDev.toFixed(2)})
					</p>
				</div>
			);
		});

		return <div className="mt-4 text-lg">{elements}</div>;
	}

	return (
		<div
			key={props.teamNumber}
			className={`w-full h-[85%] bg-base-200 rounded-xl flex flex-row p-8 transition ease-in ${
				visible ? "translate-x-0" : "translate-x-96"
			}`}
		>
			<div className="w-1/2">
				<h1 className="font-bold text-5xl text-accent">
					Team {props.teamNumber} (#{props.ranking?.rank ?? "?"}/
					{props.maxRanking})
				</h1>
				<h2 className="font-mono">
					Scouting + Pit-scouting data
					<br />
					Record: {props.ranking?.record.wins}-{props.ranking?.record.losses}-
					{props.ranking?.record.ties}
				</h2>

				{props
					.getBadges(props.pitReport, props.matchReports, false)
					.map((badge, index) => (
						<div
							key={index}
							className={`badge badge-${badge.color} mt-2`}
						>
							{badge.text}
						</div>
					))}

				<div className="divider w-1/2" />
				<div className="mt-4 text-lg">
					<IndividualStats />
					<RobotCapabilities />
				</div>
			</div>
			<div className="w-1/2 flex flex-col items-center">
				{pit ? (
					pit.submitted ? (
						<img
							src={pit.data?.image}
							className="rounded-xl w-1/3 h-auto"
							alt={pit.teamNumber.toString()}
						></img>
					) : (
						<></>
					)
				) : (
					<></>
				)}
				<Graph />
			</div>
		</div>
	);
}

export default function Pitstats(props: { competition: Competition }) {
	const comp = props.competition;
	const [reports, setReports] = useState<
		| { [teamNumber: number]: { pit: Pitreport | undefined; quant: Report[] } }
		| undefined
	>();

	const [slides, setSlides] = useState<React.JSX.Element[]>([]);
	const slidesRef = useRef<React.JSX.Element[]>(slides);
	slidesRef.current = slides;

	const [currentSlide, setCurrentSlide] = useState(-1);
	const [addedKeyListeners, setAddedKeyListeners] = useState(false);
	const [cycleSlidesAutomatically, setCycleSlidesAutomatically] =
		useState(true);

	const [usePublicData, setUsePublicData] = useState(true);

	const layout = games[comp.gameId].pitStatsLayout;

	const loadReports = useCallback(async () => {
		const newReports = (await api.competitionReports(
			comp._id!,
			true,
			usePublicData,
		)) as Report[];

		const rankings = await api.compRankings(comp.tbaId!);

		const allReports: typeof reports = {};

		newReports.forEach((report) => {
			const n = report.robotNumber;

			if (!Object.keys(allReports).includes(n.toString())) {
				allReports[n] = { pit: undefined, quant: [] };
			}

			allReports[n].quant.push(report);
		});

		const newPits: PitReportPair = {};
		for (const id of comp?.pitReports) {
			const pitReport = await api.findPitreportById(id);
			if (!pitReport) continue;

			newPits[pitReport.teamNumber] = pitReport;

			if (!Object.keys(allReports).includes(pitReport.teamNumber.toString())) {
				allReports[pitReport.teamNumber] = { pit: pitReport, quant: [] };
			} else {
				allReports[pitReport.teamNumber].pit = pitReport;
			}
		}

		const newReportDict = Object.fromEntries(
			Object.entries(allReports)
				.filter(
					([key, value]) => value.pit?.submitted || value.quant.length > 0,
				)
				.map(([key, value]) => [Number(key), value]),
		);
		setReports(newReportDict);

		const stats = layout.individualSlideStats.map((stat) => {
			const entries = Object.entries(newReportDict)
				.map(([team, reports]) => {
					if (stat.get) {
						return [team, stat.get(reports.pit, reports.quant)];
					}

					if (!stat.key) return [team, undefined];

					if (reports.quant.length > 0 && stat.key in reports.quant[0]) {
						return [team, NumericalAverage(stat.key as string, reports.quant)];
					} else if (reports.pit?.data && stat.key in reports.pit?.data) {
						return [team, reports.pit.data[stat.key as string]];
					}

					return [team, 0];
				})
				.filter((v) => v[1] !== undefined && !isNaN(v[1])) as [
				string,
				number,
			][];
			const values = entries.map((e) => e[1] as number);
			const teams = entries.map((e) => e[0]);

			const mean = values.reduce((a, b) => a + b, 0) / values.length;
			const stDev = StandardDeviation(values);

			return {
				label: stat.label,
				values: values.map((v, i) => ({ team: teams[i], value: v })),
				mean,
				stDev,
				rankings: values
					.map((val, index) => ({ value: val, team: teams[index] }))
					.sort((a, b) => a.value - b.value)
					.map((v) => v.team),
			};
		});

		var newSlides = Object.keys(newReportDict).map((key) => {
			return (
				<TeamSlide
					key={key}
					teamNumber={Number(key)}
					pitReport={newPits[Number(key)]}
					matchReports={newReports.filter((r) => r.robotNumber === Number(key))}
					ranking={rankings?.find((r) => r.team_key === `frc${key}`)}
					maxRanking={rankings?.length}
					layout={layout}
					getBadges={games[comp.gameId].getBadges}
					stats={stats.map((stat) => ({
						label: stat.label,
						value: stat.values.filter((v) => v.team == key)[0]?.value,
						mean: stat.mean,
						stDev: stat.stDev,
						rank: stat.rankings.indexOf(key) + 1,
						maxRanking: rankings?.length,
					}))}
				/>
			);
		});
		setSlides(newSlides);
	}, [
		comp._id,
		comp.gameId,
		comp.pitReports,
		comp.tbaId,
		layout,
		usePublicData,
	]);

	useEffect(() => {
		loadReports();
	}, [usePublicData, loadReports]);

	useEffect(() => {
		const i = setInterval(() => {
			loadReports();
		}, 60 * 1000);
		return () => clearInterval(i);
	}, [usePublicData, loadReports]);

	function changeSlide(
		nextSlide: (prev: number) => number,
		automatic: boolean = false,
	) {
		if (!automatic) setCycleSlidesAutomatically(false);

		setCurrentSlide((n) => {
			return nextSlide(n);
		});
	}

	const nextSlide = useCallback(
		(automatic: boolean = false) => {
			changeSlide(
				(n) => (n < slidesRef.current.length - 1 ? n + 1 : -1),
				automatic,
			);
		},
		[slidesRef],
	);

	const prevSlide = useCallback(
		async (automatic: boolean = false) => {
			changeSlide(
				(n) => (n >= 0 ? n - 1 : slidesRef.current.length - 1),
				automatic,
			);
		},
		[slidesRef],
	);

	useEffect(() => {
		if (slides.length > 0 && cycleSlidesAutomatically) {
			const timer = setInterval(() => nextSlide(true), 5000);
			return () => clearInterval(timer);
		}
	}, [slides, cycleSlidesAutomatically, nextSlide]);

	useEffect(() => {
		if (!addedKeyListeners) {
			window.addEventListener("keydown", (e) => {
				if (e.key === "ArrowRight") {
					nextSlide();
				} else if (e.key === "ArrowLeft") {
					prevSlide();
				}
			});
			setAddedKeyListeners(true);
		}
	}, [addedKeyListeners, nextSlide, prevSlide]);

	useEffect(() => {
		const msg =
			"Would you like to include public data? (Ok = Yes, Cancel = No)";
		setUsePublicData(comp.tbaId !== NotLinkedToTba && confirm(msg));
	}, [comp.tbaId]);

	function OverallSlide() {
		const graphs = layout.overallSlideStats.map((stat) => {
			if (!reports) return "No reports";

			const data = Object.entries(reports).map(([team, reports]) => {
				if (stat.get) {
					return stat.get(reports.pit, reports.quant);
				}

				if (!stat.key) return undefined;

				if (reports.pit?.data && stat.key in reports.pit?.data) {
					return reports.pit.data[stat.key as string];
				}

				return NumericalAverage(stat.key as string, reports.quant);
			});

			return (
				<BarGraph
					key={JSON.stringify(stat)}
					label={stat.label}
					xlabels={Object.keys(reports)}
					data={data}
				/>
			);
		});

		return (
			<div className="w-full h-full bg-base-200 grid grid-cols-2 grid-rows-2 gap-0 rounded-xl">
				{graphs}
			</div>
		);
	}

	return (
		<Container
			hideMenu={true}
			requireAuthentication={true}
			notForMobile={true}
			title={`Pit Stats | ${props.competition.name}`}
		>
			<div className="w-full h-full flex flex-col items-center bg-base-300">
				<h1 className="text-4xl font-bold text-center mt-2 ">
					<BsGearFill className="inline animate-spin-slow"></BsGearFill> Gearbox
					Pit-Stats
				</h1>
				<p className="font-mono font-semibold">
					Showing <span className="text-accent">live</span>
					{usePublicData && (
						<>
							, <span className="text-secondary">publicly-available</span>
						</>
					)}{" "}
					data
					<div className="w-4 h-4 rounded-full bg-green-500 animate-pulse inline-block mx-2 translate-y-1"></div>
				</p>

				<progress
					className="progress progress-primary h-4 w-2/3 mt-2"
					value={(currentSlide / slides.length) * 100}
					max="100"
				></progress>

				{!reports ? (
					<h1>Loading...</h1>
				) : Object.keys(reports).length === 0 ? (
					<h1>
						No data (try creating pit reports for your event&apos;s teams then
						try again).
					</h1>
				) : (
					<div className="w-3/4 h-2/3 flex flex-row p-2">
						{currentSlide === -1 ? <OverallSlide /> : slides[currentSlide]}
					</div>
				)}
			</div>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = async (context) => {
	const db = await getDatabase();
	const compSlug = context.resolvedUrl.split("/")[3];
	const comp = await db.findObjectBySlug(CollectionId.Competitions, compSlug);

	return {
		props: { competition: serializeDatabaseObject(comp) },
	};
};
