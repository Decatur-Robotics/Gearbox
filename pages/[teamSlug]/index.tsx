import UrlResolver, {
	serializeDatabaseObject,
	serializeDatabaseObjects,
} from "@/lib/UrlResolver";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";

import ClientApi from "@/lib/api/ClientApi";
import { Competition, League, Season, Team, User } from "@/lib/Types";
import Container from "@/components/Container";
import { useCurrentSession } from "@/lib/client/useCurrentSession";
import Link from "next/link";

import { MdOutlineOpenInNew, MdOutlinePersonRemove } from "react-icons/md";
import { getDatabase } from "@/lib/MongoDB";
import CollectionId from "@/lib/client/CollectionId";
import { ObjectId } from "bson";
import Flex from "@/components/Flex";
import Card from "@/components/Card";
import {
	FaRobot,
	FaSlack,
	FaSync,
	FaUserFriends,
	FaUserPlus,
	FaUserTimes,
} from "react-icons/fa";
import CompetitionCard from "@/components/CompetitionCard";
import SeasonCard from "@/components/SeasonCard";
import Avatar from "@/components/Avatar";
import Loading from "@/components/Loading";
import { validName } from "@/lib/client/InputVerification";
import { BsSlack } from "react-icons/bs";
import { games } from "@/lib/games";
import { defaultGameId } from "@/lib/client/GameId";
import AddToSlack from "@/components/AddToSlack";
import { Analytics } from "@/lib/client/Analytics";
import { redirect } from "next/dist/server/api-utils";
import { makeObjSerializeable } from "../../lib/client/ClientUtils";
import { useRouter } from "next/router";

const api = new ClientApi();

type TeamPageProps = {
	team: Team | undefined;
	currentSeason: Season | undefined;
	currentCompetition: Competition | undefined;
	pastSeasons: Season[] | undefined;
	users: User[] | undefined;
	isManager: boolean;
};

function Overview(props: TeamPageProps) {
	return (
		<Card
			title="Overview"
			className="h-fit"
		>
			<Flex
				mode="row"
				className=" min-h-[12rem] mb-8 max-sm:flex-col"
			>
				<div className="w-full md:w-1/2">
					<h1 className="font-semibold text-lg mb-2">Latest Competition:</h1>
					{props.currentCompetition ? (
						<Link
							href={`/${props.team?.slug}/${props.currentSeason?.slug}/${props.currentCompetition?.slug}`}
						>
							<CompetitionCard
								comp={props.currentCompetition}
							></CompetitionCard>
						</Link>
					) : (
						<p>
							No competitions.{" "}
							<Link
								href={`/${props.team?.slug}/createSeason`}
								className="link link-accent"
							>
								Create a season
							</Link>{" "}
							to get started.
						</p>
					)}
				</div>
				<div className="divider divider-horizontal max-sm:divider-vertical"></div>
				<div className="w-full md:w-1/2">
					<h1 className="font-semibold text-lg mb-2">Current Season:</h1>
					{!props.currentSeason ? (
						<Link href={`/${props.team?.slug}/createSeason`}>
							<button className="btn btn-primary btn-wide">
								Create a Season
							</button>
						</Link>
					) : (
						<Flex
							mode="col"
							className="space-y-4"
						>
							<Link href={`/${props.team?.slug}/${props.currentSeason?.slug}`}>
								<SeasonCard season={props.currentSeason}></SeasonCard>
							</Link>
							<div>
								<h1 className="text-md font-semibold">Past Seasons:</h1>
								<ul className="list-disc ml-8">
									{props.pastSeasons?.map((season) => (
										<li key={season._id}>
											<Link
												href={`/${props.team?.slug}/${season.slug}`}
												className="text-accent"
											>
												{season?.name} - {season.year} (
												{games[season.gameId ?? defaultGameId]?.name},{" "}
												{games[season.gameId ?? defaultGameId]?.league})
											</Link>
										</li>
									))}
									{props.isManager && (
										<li>
											<Link
												href={`/${props.team?.slug}/createSeason`}
												className="link link-secondary"
											>
												Create a season
											</Link>
										</li>
									)}
								</ul>
							</div>
						</Flex>
					)}
				</div>
			</Flex>
		</Card>
	);
}

function Roster(props: TeamPageProps) {
	const { session, status } = useCurrentSession();

	const [team, setTeam] = useState(props.team);
	const [users, setUsers] = useState(props.users ?? []);

	const [loadingRequests, setLoadingRequests] = useState(true);
	const [requests, setRequests] = useState<User[]>([]);

	const owner = team?.owners.includes(session.user?._id as string);

	useEffect(() => {
		const loadRequests = async () => {
			setLoadingRequests(true);
			var newData: User[] = [];
			for (const i in team?.requests) {
				const user = await api.findUserById(team?.requests[Number(i)]);
				if (user) newData.push(user);
			}
			setRequests(newData);
			setLoadingRequests(false);
		};

		loadRequests();
	}, [team?.requests]);

	const handleTeamRequest = async (userId: string, accept: boolean) => {
		await api.handleTeamJoinRequest(
			accept,
			team?._id.toString() ?? "",
			userId as string,
		);

		const reqClone = structuredClone(requests);
		const userIndex = reqClone.findIndex((user) => userId === user._id);
		const user = structuredClone(requests[userIndex]);
		reqClone.splice(userIndex, 1);
		setRequests(reqClone);

		if (accept) {
			setUsers([...users, user]);
		}

		Analytics.teamJoinRequestHandled(
			team?.number ?? -1,
			team?.league ?? League.FRC,
			user.name ?? "Unknown User",
			session.user?.name ?? "Unknown User",
			accept,
		);
	};

	const updateScouter = async (userId: string) => {
		var teamClone = structuredClone(team);
		var scouters = teamClone?.scouters;
		if (scouters?.includes(userId)) {
			scouters.splice(scouters.indexOf(userId), 1);
		} else {
			scouters?.push(userId);
		}

		await api.updateTeam({ scouters }, team?._id.toString()!);
		setTeam(teamClone);
	};

	const updateSubjectiveScouter = async (userId: string) => {
		var teamClone = structuredClone(team);
		if (!teamClone) return;

		teamClone.subjectiveScouters ??= [];
		var scouters = teamClone?.subjectiveScouters;
		if (scouters?.includes(userId)) {
			scouters.splice(scouters.indexOf(userId), 1);
		} else {
			scouters?.push(userId);
		}

		await api.updateTeam(
			{ subjectiveScouters: scouters },
			team?._id.toString()!,
		);
		setTeam(teamClone);
	};

	const updateOwner = async (userId: string) => {
		var teamClone = structuredClone(team);
		var owners = teamClone?.owners;
		if (owners?.includes(userId)) {
			owners.splice(owners.indexOf(userId), 1);
		} else {
			owners?.push(userId);
		}

		await api.updateTeam({ owners }, team?._id.toString()!);
		setTeam(teamClone);
	};

	const removeUser = async (userId: string) => {
		if (!confirm("Are you sure you want to remove this user?")) {
			return;
		}

		const { team: newTeam } = await api.removeUserFromTeam(
			team?._id.toString() ?? "",
			userId,
		);
		setTeam(newTeam);
		setUsers(users.filter((user) => user._id !== userId));
	};

	return (
		<Card
			title={team?.alliance ? "Alliance Roster" : "Team Roster"}
			className="h-full "
		>
			<h1 className="text-lg font-semibold">
				View and Manage your {team?.alliance ? "Alliance" : "Team"}
			</h1>
			<h1>
				<span className="text-accent">{users?.length}</span> total members
			</h1>

			{owner ? (
				<div className="w-full collapse collapse-arrow bg-base-300">
					<input type="checkbox" />
					<div className="collapse-title text-lg font-medium">
						Join Requests{" "}
						{requests.length > 0 ? (
							<div className="badge badge-primary ml-4">New</div>
						) : (
							<></>
						)}
					</div>
					<div className="collapse-content">
						{loadingRequests ? (
							<Loading></Loading>
						) : (
							<div className="w-full grid grid-cols-2 grid-rows-1">
								{requests.map((user) => (
									<Card
										className=""
										key={user._id}
									>
										<Flex
											mode="col"
											className="space-x-2"
										>
											<div className="flex flex-row space-x-4 items-center">
												<img
													src={user.image}
													className="w-10 h-10 rounded-lg"
													alt={user.name}
												></img>
												<h1>{user.name}</h1>
											</div>
											<div className="divider"></div>
											<Flex
												mode="row"
												className="space-x-4"
											>
												<button
													className="btn btn-success btn-outline"
													onClick={() => {
														handleTeamRequest(String(user._id), true);
													}}
												>
													Accept <FaUserPlus></FaUserPlus>
												</button>
												<button
													className="btn btn-error btn-outline"
													onClick={() => {
														handleTeamRequest(String(user._id), false);
													}}
												>
													Decline <FaUserTimes></FaUserTimes>
												</button>
											</Flex>
										</Flex>
									</Card>
								))}
							</div>
						)}
					</div>
				</div>
			) : (
				<></>
			)}

			<div className="divider"></div>
			<kbd className="kbd md:hidden">← Scroll →</kbd>
			<div className="w-full overflow-x-scroll overflow-y-hidden">
				<table className="table">
					<thead>
						<tr>
							<th>Index</th>
							<th>Profile</th>
							<th>Name</th>
							<th>Scouter</th>
							<th>Subjective Scouter</th>
							<th>Manager</th>
							<th>Kick</th>
						</tr>
					</thead>
					<tbody className="">
						{users.map((user, index) => (
							<tr
								key={user._id}
								className="p-0 h-20 even:bg-base-100 odd:bg-base-200 max-sm:text-xs"
							>
								<th className="w-10">{index + 1}</th>
								<td className="absolute -translate-x-10 -translate-y-8">
									<Avatar
										user={user}
										scale="scale-50"
									></Avatar>
								</td>
								<td className="font-semibold">{user.name}</td>
								<td>
									<input
										type="checkbox"
										className="toggle toggle-secondary"
										checked={team?.scouters.includes(user._id as string)}
										disabled={!owner}
										onChange={() => {
											updateScouter(user._id as string);
										}}
									/>
								</td>
								<td>
									<input
										type="checkbox"
										className="toggle toggle-accent"
										checked={team?.subjectiveScouters?.includes(
											user._id as string,
										)}
										disabled={!owner}
										onChange={() => {
											updateSubjectiveScouter(user._id as string);
										}}
									/>
								</td>
								<td>
									<input
										type="checkbox"
										className="toggle toggle-primary"
										checked={team?.owners.includes(user._id as string)}
										disabled={!owner}
										onChange={() => {
											updateOwner(user._id as string);
										}}
									/>
								</td>
								<td>
									<button
										className="btn btn-outline btn-error"
										disabled={!owner}
										onClick={() => {
											removeUser(user._id as string);
										}}
									>
										<MdOutlinePersonRemove size={20}></MdOutlinePersonRemove>
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Card>
	);
}

function Settings(props: TeamPageProps) {
	const [teamName, setTeamName] = useState(props.team?.name as string);
	const [error, setError] = useState("");

	const updateTeam = async () => {
		setError("");
		if (!validName(teamName, true)) {
			{
				props.team?.alliance
					? setError("Invalid Alliance Name")
					: setError("Invalid Team Name");
			}
			return;
		}

		await api.updateTeam({ name: teamName }, props.team?._id.toString()!);
		location.reload();
	};

	return (
		<Card title="Settings">
			<h1 className="font-semibold text-lg">
				Edit your {props.team?.alliance ? "Alliance's" : "Team's"} configuration
			</h1>
			<h1 className="text-md text-error">{error}</h1>
			<div className="divider"></div>
			<p>Set your {props.team?.alliance ? "Alliance" : "Team"}&apos;s Name:</p>
			<input
				value={teamName}
				maxLength={100}
				onChange={(e) => {
					setTeamName(e.target.value);
				}}
				type="text"
				placeholder={props.team?.alliance ? "Team Name" : "Team Name"}
				className="input input-bordered w-full max-w-xs"
			/>
			<div className="divider"></div>
			<button
				className="btn btn-primary md:w-1/4"
				onClick={updateTeam}
			>
				<FaSync></FaSync>
				{props.team?.alliance ? "Update Alliance" : "Update Team"}
			</button>
		</Card>
	);
}

export default function TeamIndex() {
	const { session, status } = useCurrentSession();
	const router = useRouter();

	const [team, setTeam] = useState<Team>();

	const isFrc = team?.tbaId || team?.league === League.FRC;

	const [page, setPage] = useState(0);

	const isManager = team?.owners.includes(session?.user?._id as string);

	useEffect(() => {
		if (!router.query.teamSlug) return;

		api.findTeamBySlug(router.query.teamSlug as string).then((team) => {
			if (!team) return;

			setTeam(team);
		});
	}, [router.query]);

	const tabProps: TeamPageProps = {
		team,
		currentSeason: team?.seasons[team.seasons.length - 1],
	};

	return (
		<Container
			requireAuthentication={true}
			hideMenu={false}
			title={team ? `${team.number} - ${team.name}` : "Team Loading..."}
		>
			<Flex
				mode={"col"}
				className="h-fit space-y-6 my-8 items-center"
			>
				<Card
					title={team?.name}
					coloredTop={"bg-secondary"}
				>
					<Flex
						mode="row"
						className="md:space-x-4 max-sm:flex-col"
					>
						<h1 className="font-semibold text-lg">
							<FaRobot
								size={30}
								className="inline-block mr-2"
							></FaRobot>
							{team?.alliance ? "Alliance" : "Team"}{" "}
							<span className="text-accent">{team?.number}</span>
						</h1>
						<div className="divider divider-horizontal max-sm:divider-vertical"></div>
						<h1 className="font-semibold text-xg">
							<FaUserFriends
								className="inline-block mr-2"
								size={30}
							></FaUserFriends>
							<span className="text-accent">{team?.users.length}</span> Active
							Members
						</h1>
					</Flex>

					<div className="divider"></div>
					<Flex
						mode="row"
						className="space-x-4"
					>
						<div className="badge badge-secondary md:badge-lg">
							{isFrc ? "FRC" : "FTC"}
						</div>
						{team?.alliance ? (
							<></>
						) : (
							<Link
								href={`https://www.thebluealliance.com/team/${team?.number}`}
								rel="noopener noreferrer"
								target="_blank"
							>
								<div className="badge badge-primary text-white underline md:badge-lg">
									<MdOutlineOpenInNew />
									TBA
								</div>
							</Link>
						)}
					</Flex>
					<div className="flex flex-row items-center space-x-2">
						<BsSlack color={team?.slackWebhook ? "green" : "red"} />
						{team?.slackWebhook ? (
							<div>
								Linked to Slack. Notifications are available for team members
								who sign in with Slack.
							</div>
						) : (
							<div>Not linked to Slack.</div>
						)}
						{team?.owners.includes(session?.user?._id ?? "") && (
							<AddToSlack
								edit={team?.slackWebhook !== undefined}
								teamId={team._id.toString()}
							/>
						)}
					</div>
				</Card>

				<div className="flex flex-row justify-start w-2/3 max-sm:w-11/12 ">
					<div className="w-full join grid grid-cols-3">
						<button
							className={
								"join-item btn btn-outline normal-case " +
								(page === 0 ? "btn-active" : "")
							}
							onClick={() => {
								setPage(0);
							}}
						>
							Overview
						</button>
						<button
							className={
								"join-item btn btn-outline normal-case inline " +
								(page === 1 ? "btn-active" : "")
							}
							onClick={() => {
								setPage(1);
							}}
						>
							Roster{" "}
						</button>

						<button
							className={
								"join-item btn btn-outline normal-case " +
								(page === 2 ? "btn-active" : "")
							}
							onClick={() => {
								setPage(2);
							}}
							disabled={!isManager}
						>
							Settings
						</button>
					</div>
				</div>

				{page === 0 ? (
					<Overview
						{...tabProps}
						isManager={isManager ?? false}
					></Overview>
				) : (
					<></>
				)}
				{page === 1 ? <Roster {...tabProps}></Roster> : <></>}
				{page === 2 ? <Settings {...tabProps}></Settings> : <></>}
			</Flex>
		</Container>
	);
}

// export const getServerSideProps: GetServerSideProps = async (context) => {
// 	const db = await getDatabase();
// 	const resolved = await UrlResolver(context, 1);
// 	if ("redirect" in resolved) {
// 		return resolved;
// 	}

// 	const seasonIds = resolved.team?.seasons.map(
// 		(seasonId) => new ObjectId(seasonId),
// 	);
// 	const userIds = resolved.team?.users.map((userId) => new ObjectId(userId));
// 	const seasons = await db.findObjects(CollectionId.Seasons, {
// 		_id: { $in: seasonIds },
// 	});

// 	var users = await db.findObjects(CollectionId.Users, {
// 		_id: { $in: userIds },
// 	});

// 	users = users.map((user) => {
// 		var c = structuredClone(user);
// 		c._id = user?._id?.toString();
// 		c.teams = user.teams.map((id) => String(id));
// 		return c;
// 	});

// 	const currentSeason = seasons[seasons.length - 1];
// 	var comp = undefined;
// 	if (currentSeason) {
// 		comp = await db.findObjectById(
// 			CollectionId.Competitions,
// 			new ObjectId(
// 				currentSeason.competitions[currentSeason.competitions.length - 1],
// 			),
// 		);
// 	}

// 	return {
// 		props: {
// 			team: resolved.team,
// 			users: makeObjSerializeable(users),
// 			currentCompetition: serializeDatabaseObject(comp),
// 			currentSeason: serializeDatabaseObject(currentSeason),
// 			pastSeasons: serializeDatabaseObjects(seasons),
// 		},
// 	};
// };
