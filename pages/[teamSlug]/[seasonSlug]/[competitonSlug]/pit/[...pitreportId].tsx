import ClientApi from "@/lib/api/ClientApi";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import { FormLayout, FormElement, BlockElement } from "@/lib/Layout";
import {
	AllianceColor,
	FieldPos,
	Game,
	Pitreport,
	PitReportData,
} from "@/lib/Types";
import { useState, useCallback, Fragment } from "react";
import { FaRobot } from "react-icons/fa";
import { Analytics } from "@/lib/client/Analytics";
import {
	camelCaseToTitleCase,
	makeObjSerializeable,
} from "@/lib/client/ClientUtils";
import { GameId } from "@/lib/client/GameId";
import CollectionId from "@/lib/client/CollectionId";
import { games } from "@/lib/games";
import { getDatabase } from "@/lib/MongoDB";
import UrlResolver, { SerializeDatabaseObject } from "@/lib/UrlResolver";
import { ObjectId } from "bson";
import { GetServerSideProps } from "next";
import Flex from "@/components/Flex";
import Checkbox from "@/components/forms/Checkboxes";
import FieldPositionSelector from "@/components/forms/FieldPositionSelector";
import ImageUpload from "@/components/forms/ImageUpload";
import Card from "@/components/Card";
import Container from "@/components/Container";

const api = new ClientApi();

export default function PitReportForm(props: {
	pitReport: Pitreport;
	layout: FormLayout<PitReportData>;
	compId?: string;
	usersteamNumber?: number;
	compName?: string;
	username?: string;
	game: Game;
}) {
	const { session } = useCurrentSession();

	const [pitreport, setPitreport] = useState(props.pitReport);

	const setCallback = useCallback(
		(key: any, value: boolean | string | number | object) => {
			setPitreport((old) => {
				let copy = structuredClone(old);
				//@ts-expect-error
				copy.data[key] = value;
				return copy;
			});
		},
		[],
	);

	async function submit() {
		// Remove _id from object
		const { _id, ...report } = pitreport;

		console.log("Submitting pitreport", report);
		api
			.updatePitreport(props.pitReport?._id!, {
				...report,
				submitted: true,
				submitter: session?.user?._id,
			})
			.then(() => {
				Analytics.pitReportSubmitted(
					pitreport.teamNumber,
					props.usersteamNumber ?? -1,
					props.compName ?? "Unknown",
					props.username ?? "Unknown",
				);
			})
			.finally(() => {
				location.href = location.href.substring(
					0,
					location.href.lastIndexOf("/pit"),
				);
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
					report={pitreport}
					callback={setCallback}
				/>
			);

		if (element.type === "boolean")
			return (
				<Checkbox
					key={index}
					label={element.label ?? (element.key as string)}
					dataKey={key}
					data={pitreport}
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
						value={pitreport.data?.[key]}
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
					value={pitreport.data?.comments}
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
							fieldImagePrefix={props.game.fieldImagePrefix}
							initialPos={pitreport.data?.[key] as FieldPos}
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
						value={pitreport.data?.[key]}
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
						checked={pitreport.data?.[element.key as string] === entry[1]}
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

	const components = Object.entries(props.layout).map(([header, elements]) => {
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
	});

	return (
		<Container
			requireAuthentication={true}
			title={`${props.pitReport.teamNumber} | Pit Scouting`}
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
							Team <span className="text-accent">{pitreport.teamNumber}</span>
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

async function getPitreport(id: string) {
	const db = await getDatabase();
	return await db.findObjectById(CollectionId.PitReports, new ObjectId(id));
}

export const getServerSideProps: GetServerSideProps = async (context) => {
	const id = context.resolvedUrl.split("/pit/")[1];
	const pitreport = await getPitreport(id);

	const resolved = await UrlResolver(context, 4);
	if ("redirect" in resolved) {
		return resolved;
	}

	const game = games[resolved.season?.gameId ?? GameId.Crescendo];

	return {
		props: {
			pitReport: makeObjSerializeable(SerializeDatabaseObject(pitreport)),
			layout: makeObjSerializeable(game.pitReportLayout),
			teamNumber: resolved.team?.number,
			compName: resolved.competition?.name,
			game: makeObjSerializeable(game),
		},
	};
};
