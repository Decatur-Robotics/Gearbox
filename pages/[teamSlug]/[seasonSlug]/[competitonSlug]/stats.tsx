import ClientApi from "@/lib/api/ClientApi";
import { NotLinkedToTba } from "@/lib/client/ClientUtils";
import { defaultGameId } from "@/lib/client/GameId";
import {
	Competition,
	Pitreport,
	SubjectiveReport,
	Report,
	CompPicklistGroup,
} from "@/lib/Types";
import { useState, useEffect, useCallback } from "react";
import Container from "@/components/Container";
import { games } from "@/lib/games";
import CollectionId from "@/lib/client/CollectionId";
import { getDatabase } from "@/lib/MongoDB";
import UrlResolver, {
	SerializeDatabaseObjects,
	SerializeDatabaseObject,
} from "@/lib/UrlResolver";
import { ObjectId } from "bson";
import { GetServerSideProps } from "next";
import PicklistScreen from "@/components/stats/Picklist";
import PredictionScreen from "@/components/stats/PredictionScreen";
import TeamPage from "@/components/stats/TeamPage";

const api = new ClientApi();

export default function Stats(props: {
	reports: Report[];
	pitReports: Pitreport[];
	subjectiveReports: SubjectiveReport[];
	competition: Competition;
	picklists: CompPicklistGroup;
}) {
	const [update, setUpdate] = useState(Date.now());
	const [updating, setUpdating] = useState(false);
	const [reports, setReports] = useState(props.reports);
	const [pitReports, setPitReports] = useState<Pitreport[]>(props.pitReports);
	const [subjectiveReports, setSubjectiveReports] = useState<
		SubjectiveReport[]
	>(props.subjectiveReports);
	const [page, setPage] = useState(0);
	const [usePublicData, setUsePublicData] = useState(true);

	useEffect(() => {
		const i = setInterval(() => {
			resync();
		}, 15000);
		return () => {
			clearInterval(i);
		};
	});

	const resync = useCallback(async () => {
		console.log("Resyncing...");
		setUpdating(true);

		const promises = [
			api
				.competitionReports(props.competition._id!, true, usePublicData)
				.then((data) => setReports(data)),
			pitReports.length === 0 &&
				props.competition._id &&
				api.getPitReports(props.competition._id).then((data) => {
					setPitReports(data);
				}),
			api
				.getSubjectiveReportsForComp(props.competition._id!)
				.then(setSubjectiveReports),
		].flat();

		await Promise.all(promises);

		setUpdate(Date.now());
		setUpdating(false);
	}, [pitReports.length, props.competition._id, usePublicData]);

	useEffect(() => {
		resync();
	}, [usePublicData, resync]);

	const teams: Set<number> = new Set();
	reports.forEach((r) => teams.add(r.robotNumber));
	pitReports.forEach((r) => teams.add(r.teamNumber));
	subjectiveReports.forEach((r) =>
		Object.keys(r.robotComments).forEach((c) => teams.add(+c)),
	); //+str converts to number

	return (
		<Container
			requireAuthentication={false}
			hideMenu={true}
			title="Stats"
		>
			<div className="flex flex-row items-center p-1 pl-2 space-x-2 bg-base-200">
				{props.competition?.tbaId !== NotLinkedToTba && (
					<button
						className="btn btn-ghost w-full"
						onClick={() => setUsePublicData(!usePublicData)}
					>
						{usePublicData ? (
							<div className="text-secondary">Using public data</div>
						) : (
							<div>Not using public data</div>
						)}
						<div className=" animate-pulse">(Click to toggle)</div>
					</button>
				)}
				{/* <h1 className="text-xl">
          Use public data?
        </h1>
        <input className="toggle toggle-primary" type="checkbox" defaultChecked={usePublicData} onChange={(e) => setUsePublicData(e.target.checked)} /> */}
			</div>
			<div
				role="tablist"
				className="tabs tabs-boxed"
			>
				<a
					role="tab"
					className={`tab tab-md ${page === 0 ? "tab-active" : ""}`}
					onClick={() => {
						setPage(0);
					}}
				>
					Teams
				</a>
				<a
					role="tab"
					className={`tab tab-md ${page === 1 ? "tab-active" : ""}`}
					onClick={() => {
						setPage(1);
					}}
				>
					Picklist (Beta)
				</a>
				<a
					role="tab"
					className={`tab tab-md ${page === 2 ? "tab-active" : ""}`}
					onClick={() => {
						setPage(2);
					}}
				>
					Prediction (Beta)
				</a>
				{/* <a role="tab" className={`tab tab-md `} onClick={resync}>
          Resync {" "}
          <span className={`ml-2 ${updating ? "animate-spin" : ""}`}>
            <FaSync></FaSync>
          </span>{" "}
          <span className="italic text-sm ml-2">
            (Last Updated: {TimeString(update)})
          </span>
        </a> */}
			</div>

			{page === 0 && (
				<TeamPage
					reports={reports}
					pitReports={pitReports}
					subjectiveReports={subjectiveReports}
					gameId={props.competition?.gameId ?? defaultGameId}
				/>
			)}
			{page === 1 && (
				<PicklistScreen
					teams={Array.from(teams)}
					reports={reports}
					expectedTeamCount={props.competition.pitReports.length}
					picklist={props.picklists}
					compId={props.competition._id ?? ""}
				/>
			)}
			{page === 2 && (
				<PredictionScreen
					reports={reports}
					teams={Array.from(teams)}
					game={games[props.competition.gameId]}
				/>
			)}
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = async (context) => {
	const db = await getDatabase();
	const resolved = await UrlResolver(context, 3);
	if ("redirect" in resolved) {
		return resolved;
	}

	const reports = await db.findObjects(CollectionId.Reports, {
		match: { $in: resolved.competition?.matches },
		submitted: true,
	});

	const pitReports = await db.findObjects(CollectionId.PitReports, {
		_id: { $in: resolved.competition?.pitReports },
	});

	const subjectiveReports = await db.findObjects(
		CollectionId.SubjectiveReports,
		{
			match: { $in: resolved.competition?.matches },
		},
	);

	const picklists = await db.findObjectById(
		CollectionId.Picklists,
		new ObjectId(resolved.competition?.picklist),
	);

	return {
		props: {
			reports: SerializeDatabaseObjects(reports),
			pitReports: SerializeDatabaseObjects(pitReports),
			subjectiveReports: SerializeDatabaseObjects(subjectiveReports),
			picklists: SerializeDatabaseObject(picklists),
			competition: resolved.competition,
		},
	};
};
