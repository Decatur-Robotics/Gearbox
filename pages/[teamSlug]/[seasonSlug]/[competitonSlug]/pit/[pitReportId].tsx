import ClientApi from "@/lib/api/ClientApi";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { FormElement, BlockElement } from "@/lib/Layout";
import {
	AllianceColor,
	FieldPos,
	Game,
	Pitreport,
	PitReportData,
} from "@/lib/Types";
import { useState, useCallback, Fragment, useEffect } from "react";
import { FaRobot } from "react-icons/fa";
import { Analytics } from "@/lib/client/Analytics";
import { camelCaseToTitleCase } from "@/lib/client/ClientUtils";
import { games, detectGameIdFromPitReport } from "@/lib/games";
import Flex from "@/components/Flex";
import Checkbox from "@/components/forms/Checkboxes";
import FieldPositionSelector from "@/components/forms/FieldPositionSelector";
import ImageUpload from "@/components/forms/ImageUpload";
import Card from "@/components/Card";
import Container from "@/components/Container";
import { useRouter } from "next/router";
import Loading from "@/components/Loading";
import toast from "react-hot-toast";

const api = new ClientApi();

enum LoadState {
	WaitingForQuery = "Waiting for query...",
	Fetching = "Fetching...",
	Loaded = "Loaded",
	Failed = "Failed",
}

export default function PitReportForm() {
	const { session } = useCurrentSession();
	const router = useRouter();

	const [loadStatus, setLoadStatus] = useState<LoadState>(
		LoadState.WaitingForQuery,
	);

	const [pitReport, setPitReport] = useState<Pitreport>();
	const [compName, setCompName] = useState<string>();
	const [usersTeamNumber, setTeamNumber] = useState<number>();
	const [game, setGame] = useState<Game>();

	const username = session?.user?.name;

	useEffect(() => {
		// Fetch page data
		setLoadStatus(LoadState.Fetching);

		const pitReportId = router.query.pitReportId as string;
		if (!pitReportId) {
			return;
		}

		let teamNumber: number | undefined = undefined;

		const promise = api
			.getPitReportPageData(pitReportId as string)
			.then((data) => {
				if (!data) {
					setLoadStatus(LoadState.Failed);
					throw new Error("No data returned from API");
				}

				if (!data.pitReport) {
					setLoadStatus(LoadState.Failed);
					throw new Error("No pit report found");
				}

				const gameId = detectGameIdFromPitReport(data.pitReport);
				if (!gameId) {
					setLoadStatus(LoadState.Failed);
					throw new Error("No game found for pit report");
				}

				teamNumber = data.pitReport?.teamNumber;

				setLoadStatus(LoadState.Loaded);

				setPitReport(data.pitReport);
				setCompName(data.compName);
				setTeamNumber(data.usersTeamNumber);
				setGame(gameId ? games[gameId] : undefined);

				console.log("data:", data);
			});

		toast.promise(promise, {
			loading: "Loading pit report...",
			success: () => {
				return `Loaded pit report for team ${teamNumber}`;
			},
			error: (err) => {
				return `Failed to load pit report: ${err}`;
			},
		});
	}, [router.query]);

	const setCallback = useCallback(
		(key: any, value: boolean | string | number | object) => {
			setPitReport((old) => {
				let copy = structuredClone(old);
				//@ts-expect-error
				copy.data[key] = value;
				return copy;
			});
		},
		[],
	);

	async function submit() {
		if (!pitReport) return;

		// Remove _id from object
		const { _id, ...report } = pitReport;

		const promise = api
			.updatePitreport(router.query.pitReportId as string, {
				...report,
				submitted: true,
				submitter: session?.user?._id,
			})
			.then(() => {
				Analytics.pitReportSubmitted(
					pitReport.teamNumber,
					usersTeamNumber ?? -1,
					compName ?? "Unknown",
					username ?? "Unknown",
				);

				// Redirect to the comp page
				location.href = location.href.substring(
					0,
					location.href.lastIndexOf("/pit"),
				);
			});

		toast.promise(promise, {
			loading: "Submitting pit report...",
			success: () => {
				return `Submitted pit report for team ${pitReport.teamNumber}`;
			},
			error: (err) => {
				return `Failed to submit pit report: ${err}`;
			},
		});
	}

	function getComponent(
		element: FormElement<PitReportData>,
		isLastInHeader: boolean,
		index: number,
	) {
		const key = element.key as string;

		if (element.type === "image")
			return (
				<ImageUpload
					key={index}
					report={pitReport!}
					callback={setCallback}
				/>
			);

		if (element.type === "boolean")
			return (
				<Checkbox
					key={index}
					label={element.label ?? (element.key as string)}
					dataKey={key}
					data={pitReport!}
					callback={setCallback}
					divider={!isLastInHeader}
				/>
			);

		if (element.type === "number")
			// <Fragement> lets us the key attribute on a <> element
			return (
				<Fragment key={index}>
					<h1
						key={key + "h"}
						className="font-semibold text-lg"
					>
						{element.label}
					</h1>
					<input
						key={key + "i"}
						value={pitReport!.data?.[key]}
						onChange={(e) => setCallback(key, e.target.value)}
						type="number"
						className="input input-bordered"
						placeholder={element.label}
					/>
				</Fragment>
			);

		if (element.type === "string")
			return (
				<textarea
					key={key}
					value={pitReport!.data?.comments}
					className="textarea textarea-primary w-[90%]"
					placeholder={element.label}
					onChange={(e) => {
						setCallback("comments", e.target.value);
					}}
				/>
			);

		if (element.type === "startingPos")
			return (
				<Fragment key={index}>
					<h1
						key={key + "h"}
						className="font-semibold text-lg"
					>
						{element.label}
					</h1>
					<div className="w-full h-full flex justify-center">
						<FieldPositionSelector
							alliance={AllianceColor.Blue}
							fieldImagePrefix={game!.fieldImagePrefix}
							initialPos={pitReport!.data?.[key] as FieldPos}
							callback={(_, v) => setCallback(key, v)}
						/>
					</div>
				</Fragment>
			);

		if (Object.keys(element.type!).length > 3) {
			// Dropdown
			const options = Object.entries(element.type!).map((entry) => {
				return (
					<option
						key={entry[0]}
						value={entry[1]}
					>
						{camelCaseToTitleCase(entry[0])}
					</option>
				);
			});

			return (
				<Fragment key={index}>
					<h1
						key={key + "h"}
						className="font-semibold text-lg"
					>
						{element.label}
					</h1>
					<select
						key={key + "s"}
						className="select select-bordered"
						onChange={(e) => setCallback(key, e.target.value)}
						value={pitReport!.data?.[key]}
					>
						{options}
					</select>
				</Fragment>
			);
		}

		const entries = Object.entries(element.type!).map((entry, index) => {
			const color = ["primary", "accent", "secondary"][index % 3];

			return (
				<Fragment key={index}>
					<span key={key + index + "s"}>{camelCaseToTitleCase(entry[0])}</span>
					<input
						key={key + index + "i"}
						type="radio"
						className={`radio radio-${color}`}
						onChange={() =>
							setCallback(key, entry[1] as boolean | string | number)
						}
						checked={pitReport!.data?.[element.key as string] === entry[1]}
					/>
				</Fragment>
			);
		});

		return (
			<Fragment key={index}>
				<h1
					key={key + "h"}
					className="font-semibold text-lg"
				>
					{element.label}
				</h1>
				<div
					key={key + "d"}
					className="grid grid-cols-2 translate-x-6 space-y-1"
				>
					{entries}
				</div>
			</Fragment>
		);
	}

	const components = Object.entries(game?.pitReportLayout ?? []).map(
		([header, elements]) => {
			const inputs = elements.map((element, index) => {
				if (!Array.isArray(element))
					return getComponent(
						element as FormElement<PitReportData>,
						index === elements.length - 1,
						index,
					);

				const block = element as BlockElement<PitReportData>;
				return block?.map((row) =>
					row.map((element, elementIndex) =>
						getComponent(element, elementIndex === row.length - 1, index),
					),
				);
			});

			return (
				<div key={header}>
					<h1
						key={header + "h"}
						className="font-semibold text-lg"
					>
						{header}
					</h1>
					<div
						key={header + "d"}
						className="translate-x-10"
					>
						{inputs}
					</div>
				</div>
			);
		},
	);

	if (!pitReport || !game || loadStatus !== LoadState.Loaded)
		return (
			<Container
				requireAuthentication={true}
				title="Loading pit report..."
			>
				<div className="flex flex-col items-center justify-center w-screen h-[80%]">
					<Card title={`Loading pit report - ${loadStatus}`}>
						<Loading />
					</Card>
				</div>
			</Container>
		);

	return (
		<Container
			requireAuthentication={true}
			title={`${pitReport!.teamNumber} | Pit Scouting`}
		>
			<Flex
				mode="col"
				className="items-center w-screen h-full space-y-4"
			>
				<Card
					className="w-1/4"
					coloredTop="bg-accent"
				>
					<Flex
						center={true}
						mode="col"
					>
						<h1 className="text-4xl font-semibold">Pitscouting</h1>
						<div className="divider"></div>
						<h1 className="font-semibold text-2xl">
							<FaRobot
								className="inline mr-2"
								size={30}
							></FaRobot>
							Team <span className="text-accent">{pitReport!.teamNumber}</span>
						</h1>
					</Flex>
				</Card>
				<Card>
					{components}
					<button
						className="btn btn-primary "
						onClick={submit}
					>
						Submit
					</button>
				</Card>
			</Flex>
		</Container>
	);
}
