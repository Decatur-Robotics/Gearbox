import { ObjectId } from "bson";
import CollectionId from "../client/CollectionId";
import AccessLevels from "./AccessLevels";
import ApiDependencies from "./ApiDependencies";
import {
	Alliance,
	Competition,
	CompetitonNameIdPair,
	CompPicklistGroup,
	League,
	Match,
	MatchType,
	Pitreport,
	QuantData,
	Season,
	SubjectiveReport,
	SubjectiveReportSubmissionType,
	Team,
	User,
	LeaderboardUser,
	LeaderboardTeam,
	LinkedList,
} from "@/lib/Types";
import { NotLinkedToTba, removeDuplicates } from "../client/ClientUtils";
import {
	addXp,
	deleteComp,
	deleteSeason,
	generatePitReports,
	getSeasonFromComp,
	getTeamFromMatch,
	getTeamFromReport,
	onTeam,
	ownsTeam,
} from "./ApiUtils";
import { TheOrangeAlliance } from "../TheOrangeAlliance";
import { GenerateSlug, isDeveloper, mentionUserInSlack } from "../Utils";
import { fillTeamWithFakeUsers } from "../dev/FakeData";
import { GameId } from "../client/GameId";
import {
	assignScoutersToCompetitionMatches,
	generateReportsForMatch,
} from "../CompetitionHandling";
import { CenterStage, Crescendo, games, IntoTheDeep } from "../games";
import { Statbotics } from "../Statbotics";
import { TheBlueAlliance } from "../TheBlueAlliance";
import { SlackNotLinkedError } from "./Errors";
import { _id } from "@next-auth/mongodb-adapter";
import toast from "react-hot-toast";
import { RequestHelper } from "unified-api";
import { createNextRoute, NextApiTemplate } from "unified-api-nextjs";
import { Report } from "../Types";
import Logger from "../client/Logger";
import getRollbar, { RollbarInterface } from "../client/RollbarUtils";

const requestHelper = new RequestHelper(
	process.env.NEXT_PUBLIC_API_URL ?? "", // Replace undefined when env is not present (ex: for testing builds)
	(url) =>
		toast.error(
			`Failed API request: ${url}. If this is an error, please contact the developers.`,
		),
);

const logger = new Logger(["API"]);

/**
 * @tested_by tests/lib/api/ClientApi.test.ts
 */
export default class ClientApi extends NextApiTemplate<ApiDependencies> {
	constructor() {
		super(requestHelper, false);
		this.init();
	}

	hello = createNextRoute<
		[],
		{ message: string; db: string; data: any },
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, { db }, authData, args) => {
			res.status(200).send({
				message: "howdy there partner",
				db: (await db) ? "connected" : "disconnected",
				data: args,
			});
		},
	});

	requestToJoinTeam = createNextRoute<
		[ObjectId],
		{ result: string },
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.IfSignedIn,
		handler: async (
			req,
			res,
			{ db, userPromise, rollbar },
			authData,
			[teamId],
		) => {
			let team = await (
				await db
			).findObjectById(CollectionId.Teams, teamId);

			if (!team) {
				rollbar.warn("Team not found (API: requestToJoinTeam)", { teamId });
				return res.error(404, "Team not found");
			}

			const user = await userPromise;
			if (team.users.includes(user!._id!)) {
				return res.status(200).send({ result: "Already on team" });
			}

			await (
				await db
			).updateObjectById(CollectionId.Teams, teamId, {
				requests: removeDuplicates([
					...team.requests,
					(await userPromise)?._id,
				]),
			});

			return res.status(200).send({ result: "Success" });
		},
	});

	handleTeamJoinRequest = createNextRoute<
		[boolean, ObjectId, ObjectId],
		Team,
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.IfSignedIn,
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise, rollbar },
			authData,
			[accept, teamId, userId],
		) => {
			const db = await dbPromise;

			const teamPromise = db.findObjectById(
				CollectionId.Teams,
				teamId,
			);

			const joineePromise = db.findObjectById(
				CollectionId.Users,
				userId,
			);

			const userOnTeam = await userPromise;
			const team = await teamPromise;

			if (!team) {
				rollbar.warn("Team not found (API: handleTeamJoinRequest)", {
					teamId,
					userId,
				});
				return res.error(404, "Team not found");
			}

			if (!ownsTeam(team, userOnTeam)) {
				rollbar.warn("User does not own team (API: handleTeamJoinRequest)", {
					teamId,
					userId,
				});
				return res.error(403, "You do not own this team");
			}

			const joinee = await joineePromise;

			if (!joinee) {
				rollbar.warn("Joinee not found (API: handleTeamJoinRequest)", {
					teamId,
					userId,
				});
				return res.error(404, "User not found");
			}

			team.requests.splice(team.requests.indexOf(userId), 1);

			if (accept) {
				team.users = removeDuplicates(...team.users, userId);
				team.scouters = removeDuplicates(...team.scouters, userId);

				joinee.teams = removeDuplicates(...joinee.teams, teamId);
			}

			await Promise.all([
				db.updateObjectById(CollectionId.Users, new ObjectId(userId), joinee),
				db.updateObjectById(CollectionId.Teams, new ObjectId(teamId), team),
			]);

			return res.status(200).send(team);
		},
	});

	getTeamAutofillData = createNextRoute<
		[number, League],
		Team | undefined,
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, { tba, db }, authData, [number, league]) => {
			if (number <= 0) {
				return res.status(200).send(undefined);
			}

			res
				.status(200)
				.send(
					league === League.FTC
						? await TheOrangeAlliance.getTeam(number, await db)
						: await tba.getTeamAutofillData(number),
				);
		},
	});

	competitionAutofill = createNextRoute<
		[string],
		Competition | undefined,
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, { tba }, authData, [tbaId]) => {
			res.status(200).send(await tba.getCompetitionAutofillData(tbaId));
		},
	});

	competitionMatches = createNextRoute<
		[string],
		Match | undefined,
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, { tba }, authData, [tbaId]) => {
			res.status(200).send(await tba.getMatchAutofillData(tbaId));
		},
	});

	createTeam = createNextRoute<
		[string, string, number, League, boolean],
		Team | undefined,
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.IfSignedIn,
		handler: async (
			req,
			res,
			{ db: dbPromise, resend, userPromise, rollbar },
			authData,
			[name, tbaId, number, league, alliance],
		) => {
			const user = (await userPromise)!;
			const db = await dbPromise;

			// Find if team already exists
			const existingTeam = await db.findObject(CollectionId.Teams, {
				number,
				...(league === League.FRC
					? { $or: [{ league: League.FRC }, { league: undefined }] }
					: { league: league }),
			});

			if (existingTeam) {
				rollbar.warn("Team already exists (API: createTeam)", {
					name,
					tbaId,
					number,
					league,
					alliance,
					user,
				});
				return res.error(400, "Team already exists");
			}

			const newTeamObj = new Team(
				name,
				await GenerateSlug(db, CollectionId.Teams, name),
				tbaId,
				number,
				league,
				alliance,
				[user._id!],
				[user._id!],
				[user._id!],
			);
			const team = await db.addObject(CollectionId.Teams, newTeamObj);

			user.teams = removeDuplicates(...user.teams, team._id!);
			user.owner = removeDuplicates(...user.owner, team._id!);

			await db.updateObjectById(
				CollectionId.Users,
				new ObjectId(user._id),
				user,
			);

			resend.emailDevelopers(
				`New team created: ${team.name}`,
				`A new team has been created by ${user.name}: ${team.league} ${team.number}, ${team.name}.`,
			);

			if (process.env.FILL_TEAMS === "true") {
				fillTeamWithFakeUsers(20, team._id, db);
			}

			return res.status(200).send(team);
		},
	});

	createSeason = createNextRoute<
		[string, number, ObjectId, GameId],
		Season,
		ApiDependencies,
		Team
	>({
		isAuthorized: (req, res, deps, [name, year, teamId]) =>
			AccessLevels.IfTeamOwner(req, res, deps, teamId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise, rollbar },
			team,
			[name, year, teamId, gameId],
		) => {
			const db = await dbPromise;

			if (!ownsTeam(team, await userPromise)) {
				rollbar.warn("User does not own team (API: createSeason)", {
					name,
					year,
					teamId,
					gameId,
				});
				return res.status(403).send({ error: "Unauthorized" });
			}

			const season = await db.addObject(
				CollectionId.Seasons,
				new Season(
					name,
					await GenerateSlug(db, CollectionId.Seasons, name),
					year,
					gameId,
				),
			);

			const { _id, ...updatedTeam } = team;
			updatedTeam.seasons = [...team.seasons, new ObjectId(season._id)];

			await db.updateObjectById(
				CollectionId.Teams,
				new ObjectId(teamId),
				updatedTeam!,
			);

			return res.status(200).send(season);
		},
	});

	reloadCompetition = createNextRoute<
		[ObjectId],
		{ result: string },
		ApiDependencies,
		{ comp: Competition; team: Team }
	>({
		isAuthorized: (req, res, deps, [compId]) =>
			AccessLevels.IfCompOwner(req, res, deps, compId),
		handler: async (
			req,
			res,
			{ db: dbPromise, tba },
			{ comp, team },
			[compId],
		) => {
			if (!comp.tbaId || comp.tbaId === NotLinkedToTba) {
				return res.status(400).send({ result: "not linked to TBA" });
			}

			const matches = await tba.getCompetitionQualifyingMatches(comp.tbaId);
			if (!matches || matches.length <= 0) {
				res.status(404).send({ result: "No matches in TBA" });
				return;
			}

			const db = await dbPromise;

			matches.map(
				async (match) => (await db.addObject(CollectionId.Matches, match))._id,
			);

			comp.matches = matches.map((match) => match._id);
			await db.updateObjectById(
				CollectionId.Competitions,
				new ObjectId(compId),
				comp,
			);

			// Create reports
			const reportCreationPromises = matches.map((match) =>
				generateReportsForMatch(db, match, comp.gameId),
			);
			await Promise.all(reportCreationPromises);

			res.status(200).send({ result: "success" });
		},
	});

	createCompetition = createNextRoute<
		[string, number, number, string, string, boolean],
		Competition,
		ApiDependencies,
		{ team: Team; season: Season }
	>({
		isAuthorized: (req, res, deps, [tbaId, start, end, name, seasonId]) =>
			AccessLevels.IfSeasonOwner(req, res, deps, new ObjectId(seasonId)),
		handler: async (
			req,
			res,
			{ db: dbPromise, tba },
			{ team, season },
			[tbaId, start, end, name, seasonId, publicData],
		) => {
			const db = await dbPromise;

			const matches = await tba.getCompetitionQualifyingMatches(tbaId);
			matches.map(
				async (match) => (await db.addObject(CollectionId.Matches, match))._id,
			);

			const pitReports = await generatePitReports(
				tba,
				db,
				tbaId,
				season.gameId,
			);

			const picklist = await db.addObject(CollectionId.Picklists, {
				picklists: {},
				strikethroughs: [],
			});

			const comp = await db.addObject(
				CollectionId.Competitions,
				new Competition(
					name,
					await GenerateSlug(db, CollectionId.Competitions, name),
					tbaId,
					start,
					end,
					pitReports,
					matches.map((match) => match._id),
					picklist._id,
					publicData,
					season?.gameId,
				),
			);

			const { _id, ...updatedSeason } = season;

			updatedSeason.competitions = [...season.competitions, String(comp._id)];

			await db.updateObjectById(
				CollectionId.Seasons,
				new ObjectId(season._id),
				updatedSeason,
			);

			// Create reports
			const reportCreationPromises = matches.map((match) =>
				generateReportsForMatch(db, match, comp.gameId),
			);
			await Promise.all(reportCreationPromises);

			return res.status(200).send(comp);
		},
	});

	createMatch = createNextRoute<
		[ObjectId, number, number, MatchType, Alliance, Alliance],
		Match,
		ApiDependencies,
		{ team: Team; comp: Competition }
	>({
		isAuthorized: (req, res, deps, [compId]) =>
			AccessLevels.IfCompOwner(req, res, deps, compId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			{ team, comp },
			[compId, number, time, type, redAlliance, blueAlliance],
		) => {
			const db = await dbPromise;

			const match = await db.addObject(
				CollectionId.Matches,
				new Match(
					number,
					await GenerateSlug(db, CollectionId.Matches, number.toString()),
					undefined,
					time,
					type,
					blueAlliance,
					redAlliance,
				),
			);
			comp.matches.push(match._id);

			const reportPromise = generateReportsForMatch(db, match, comp.gameId);

			await Promise.all([
				db.updateObjectById(
					CollectionId.Competitions,
					new ObjectId(comp._id),
					comp,
				),
				reportPromise,
			]);

			return res.status(200).send(match);
		},
	});

	searchCompetitionByName = createNextRoute<
		[string],
		{ value: number; pair: CompetitonNameIdPair }[],
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, { tba }, authData, [name]) => {
			res.status(200).send(await tba.searchCompetitionByName(name));
		},
	});

	assignScouters = createNextRoute<
		[ObjectId, boolean],
		{ result: string },
		ApiDependencies,
		{ team: Team; comp: Competition }
	>({
		isAuthorized: (req, res, deps, [compId]) =>
			AccessLevels.IfCompOwner(req, res, deps, compId),
		handler: async (
			req,
			res,
			{ db: dbPromise, rollbar },
			{ team },
			[compId],
		) => {
			const db = await dbPromise;

			if (!team?._id) {
				rollbar.error("Team not found (API: assignScouters)", { team });
				return res.status(400).send({ error: "Team not found" });
			}

			const result = await assignScoutersToCompetitionMatches(
				db,
				team._id,
				new ObjectId(compId),
			);

			return res.status(200).send({ result: result });
		},
	});

	submitForm = createNextRoute<
		[ObjectId, QuantData],
		{ result: string },
		ApiDependencies,
		{ team: Team; report: Report }
	>({
		isAuthorized: (req, res, deps, [reportId]) =>
			AccessLevels.IfOnTeamThatOwnsReport(req, res, deps, reportId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise, rollbar },
			{ team, report },
			[reportId, formData],
		) => {
			const db = await dbPromise;

			const user = await userPromise;
			if (!onTeam(team, user) || !user?._id) {
				rollbar.warn("User not on team (API: submitForm)", {
					team,
					user,
					reportId,
					formData,
				});
				return res.status(403).send({ error: "Unauthorized" });
			}

			report.data = formData;
			report.submitted = true;
			report.submitter = user._id;

			await db.updateObjectById(
				CollectionId.Reports,
				new ObjectId(reportId),
				report,
			);

			addXp(db, user._id, 10);

			await db.updateObjectById(
				CollectionId.Users,
				user._id,
				user,
			);

			return res.status(200).send({ result: "success" });
		},
	});

	competitionReports = createNextRoute<
		[ObjectId, boolean, boolean],
		Report[],
		ApiDependencies,
		{ team: Team; comp: Competition }
	>({
		isAuthorized: (req, res, deps, [compId]) =>
			AccessLevels.IfOnTeamThatOwnsComp(req, res, deps, compId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			{ team, comp },
			[compId, submitted, usePublicData],
		) => {
			const db = await dbPromise;

			const usedComps =
				usePublicData && comp.tbaId !== NotLinkedToTba
					? await db.findObjects(CollectionId.Competitions, {
							publicData: true,
							tbaId: comp.tbaId,
							gameId: comp.gameId,
						})
					: [comp];

			if (usePublicData && !comp.publicData) usedComps.push(comp);

			const reports = (
				await db.findObjects(CollectionId.Reports, {
					match: { $in: usedComps.flatMap((m) => m.matches) },
					submitted: submitted ? true : { $exists: true },
				})
			)
				// Filter out comments from other competitions
				.map((report) =>
					comp.matches.includes(report.match)
						? report
						: { ...report, data: { ...report.data, comments: "" } },
				);
			return res.status(200).send(reports);
		},
	});

	allCompetitionMatches = createNextRoute<
		[ObjectId],
		Match[],
		ApiDependencies,
		{ team: Team; comp: Competition }
	>({
		isAuthorized: (req, res, deps, [compId]) =>
			AccessLevels.IfOnTeamThatOwnsComp(req, res, deps, compId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			{ team, comp },
			[compId],
		) => {
			const db = await dbPromise;

			const matches = await db.findObjects(CollectionId.Matches, {
				_id: { $in: comp.matches.map((matchId) => new ObjectId(matchId)) },
			});
			return res.status(200).send(matches);
		},
	});

	matchReports = createNextRoute<
		[string],
		Report[],
		ApiDependencies,
		{ team: Team; match: Match }
	>({
		isAuthorized: (req, res, deps, [matchId]) =>
			AccessLevels.IfOnTeamThatOwnsMatch(req, res, deps, new ObjectId(matchId)),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			{ team, match },
			[matchId],
		) => {
			const db = await dbPromise;

			const reports = await db.findObjects(CollectionId.Reports, {
				_id: { $in: match.reports.map((reportId) => new ObjectId(reportId)) },
			});
			return res.status(200).send(reports);
		},
	});

	changePFP = createNextRoute<
		[string],
		{ result: string },
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.IfSignedIn,
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise, rollbar },
			authData,
			[newImage],
		) => {
			const db = await dbPromise;
			const user = await userPromise;

			if (!user?._id) {
				rollbar.error("User not found (API: changePFP)", { newImage });
				return res.status(403).send({ error: "Unauthorized" });
			}

			await db.updateObjectById(CollectionId.Users, new ObjectId(user._id), {
				image: newImage,
			});

			return res.status(200).send({ result: "success" });
		},
	});

	checkInForReport = createNextRoute<
		[ObjectId],
		{ result: string },
		ApiDependencies,
		{ team: Team; report: Report }
	>({
		isAuthorized: (req, res, deps, [reportId]) =>
			AccessLevels.IfOnTeamThatOwnsReport(req, res, deps, reportId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			{ team, report },
			[reportId],
		) => {
			const db = await dbPromise;

			await db.updateObjectById(CollectionId.Reports, new ObjectId(reportId), {
				checkInTimestamp: new Date().toISOString(),
			});

			return res.status(200).send({ result: "success" });
		},
	});

	checkInForSubjectiveReport = createNextRoute<
		[string],
		{ result: string },
		ApiDependencies,
		{ match: Match }
	>({
		isAuthorized: (req, res, deps, [matchId]) =>
			AccessLevels.IfOnTeamThatOwnsMatch(req, res, deps, new ObjectId(matchId)),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			{ match },
			[matchId],
		) => {
			const db = await dbPromise;

			const user = await userPromise;

			const update: { [key: string]: any } = {};
			update[`subjectiveReportsCheckInTimestamps.${user?._id}`] =
				new Date().toISOString();
			await db.updateObjectById(
				CollectionId.Matches,
				new ObjectId(matchId),
				update,
			);

			return res.status(200).send({ result: "success" });
		},
	});

	remindSlack = createNextRoute<
		[ObjectId, ObjectId],
		{ result: string },
		ApiDependencies,
		Team
	>({
		isAuthorized: (req, res, deps, [teamId]) =>
			AccessLevels.IfTeamOwner(req, res, deps, teamId),
		handler: async (
			req,
			res,
			{ db: dbPromise, slackClient, userPromise, rollbar },
			team,
			[teamId, targetUserId],
		) => {
			const db = await dbPromise;
			const targetUserPromise = db.findObjectById(
				CollectionId.Users,
				new ObjectId(targetUserId),
			);

			if (!team.slackWebhook) throw new SlackNotLinkedError(res);

			const webhookHolder = await db.findObjectById(
				CollectionId.Webhooks,
				new ObjectId(team.slackWebhook),
			);
			if (!webhookHolder) throw new SlackNotLinkedError(res);

			const user = (await userPromise)!;
			const targetUser = await targetUserPromise;

			if (
				!targetUser ||
				team.users.indexOf(targetUser._id) === -1
			) {
				rollbar.warn("User not found (API: remindSlack)", {
					teamId,
					targetUserId,
				});
				return res.status(400).send({ error: "User not found" });
			}

			await slackClient.sendMsg(
				webhookHolder.url,
				`${mentionUserInSlack(targetUser)}, please report to our section and prepare for scouting. Sent by ${mentionUserInSlack(user)}.`,
			);

			return res.status(200).send({ result: "success" });
		},
	});

	setSlackWebhook = createNextRoute<
		[ObjectId, string],
		{ result: string },
		ApiDependencies,
		Team
	>({
		isAuthorized: (req, res, deps, [teamId]) =>
			AccessLevels.IfTeamOwner(req, res, deps, teamId),
		handler: async (
			req,
			res,
			{ db, userPromise, slackClient },
			team,
			[teamId, webhookUrl],
		) => {
			const user = (await userPromise)!;

			// Check that the webhook works
			slackClient
				.sendMsg(
					webhookUrl,
					`Gearbox integration for ${team.name} was added by ${mentionUserInSlack(user)}.`,
				)
				.catch(() => {
					return res.status(400).send({ error: "Invalid webhook" });
				});

			if (team.slackWebhook) {
				(await db).updateObjectById(
					CollectionId.Webhooks,
					new ObjectId(team.slackWebhook),
					{ url: webhookUrl },
				);
			} else {
				const webhook = await (
					await db
				).addObject(CollectionId.Webhooks, { url: webhookUrl });
				team.slackWebhook = webhook._id;
				(await db).updateObjectById(
					CollectionId.Teams,
					new ObjectId(teamId),
					team,
				);
			}

			return res.status(200).send({ result: "success" });
		},
	});

	setSlackId = createNextRoute<
		[string],
		{ result: string },
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.IfSignedIn,
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise, rollbar },
			authData,
			[slackId],
		) => {
			const db = await dbPromise;
			const user = await userPromise;

			if (!user?._id) {
				rollbar.error("User not found (API: setSlackId)", {
					slackId,
				});
				return res.status(403).send({ error: "Unauthorized" });
			}

			await db.updateObjectById(CollectionId.Users, new ObjectId(user._id), {
				slackId: slackId,
			});

			return res.status(200).send({ result: "success" });
		},
	});

	initialEventData = createNextRoute<
		[string],
		{
			firstRanking: TheBlueAlliance.SimpleRank[];
			comp: Competition;
			oprRanking: TheBlueAlliance.OprRanking;
		},
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, { tba }, authData, [eventKey]) => {
			const compRankingsPromise = tba.req.getCompetitonRanking(eventKey);
			const eventInformationPromise = tba.getCompetitionAutofillData(eventKey);
			const tbaOPRPromise = tba.req.getCompetitonOPRS(eventKey);

			return res.status(200).send({
				firstRanking: (await compRankingsPromise)?.rankings,
				comp: await eventInformationPromise,
				oprRanking: await tbaOPRPromise,
			});
		},
	});

	compRankings = createNextRoute<
		[string],
		TheBlueAlliance.SimpleRank[],
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, { tba }, authData, [tbaId]) => {
			const compRankings = await tba.req.getCompetitonRanking(tbaId);
			return res.status(200).send(compRankings?.rankings);
		},
	});

	statboticsTeamEvent = createNextRoute<
		[string, string],
		Statbotics.TeamEvent,
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, { tba }, authData, [eventKey, team]) => {
			const teamEvent = await Statbotics.getTeamEvent(eventKey, team);
			return res.status(200).send(teamEvent);
		},
	});

	getMainPageCounterData = createNextRoute<
		[],
		{
			teams: number | undefined;
			users: number | undefined;
			datapoints: number | undefined;
			competitions: number | undefined;
		},
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, { db: dbPromise }, authData, args) => {
			const db = await dbPromise;

			const teamsPromise = db.countObjects(CollectionId.Teams, {});
			const usersPromise = db.countObjects(CollectionId.Users, {});
			const reportsPromise = db.countObjects(CollectionId.Reports, {});
			const pitReportsPromise = db.countObjects(CollectionId.PitReports, {});
			const subjectiveReportsPromise = db.countObjects(
				CollectionId.SubjectiveReports,
				{},
			);
			const competitionsPromise = db.countObjects(
				CollectionId.Competitions,
				{},
			);

			const quantReportTypes = [
				Crescendo.QuantitativeData,
				CenterStage.QuantitativeData,
				IntoTheDeep.QuantitativeData,
			];
			const pitReportTypes = [
				Crescendo.PitData,
				CenterStage.PitData,
				IntoTheDeep.PitData,
			];

			const dataPointsPerReport =
				Reflect.ownKeys(QuantData).length +
				quantReportTypes.reduce(
					(acc, game) => acc + Reflect.ownKeys(game).length,
					0,
				) /
					quantReportTypes.length;

			const dataPointsPerPitReports =
				Reflect.ownKeys(Pitreport).length +
				pitReportTypes.reduce(
					(acc, game) => acc + Reflect.ownKeys(game).length,
					0,
				) /
					pitReportTypes.length;
			const dataPointsPerSubjectiveReport =
				Reflect.ownKeys(SubjectiveReport).length + 5;

			await Promise.all([
				teamsPromise,
				usersPromise,
				reportsPromise,
				pitReportsPromise,
				subjectiveReportsPromise,
				competitionsPromise,
			]);

			return res.status(200).send({
				teams: await teamsPromise,
				users: await usersPromise,
				datapoints:
					((await reportsPromise) ?? 0) * dataPointsPerReport +
					((await pitReportsPromise) ?? 0) * dataPointsPerPitReports +
					((await subjectiveReportsPromise) ?? 0) *
						dataPointsPerSubjectiveReport,
				competitions: await competitionsPromise,
			});
		},
	});

	exportCompAsCsv = createNextRoute<
		[ObjectId],
		{ csv: string },
		ApiDependencies,
		{ team: Team; comp: Competition }
	>({
		isAuthorized: (req, res, deps, [compId]) =>
			AccessLevels.IfCompOwner(req, res, deps, compId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			{ team, comp },
			[compId],
		) => {
			const db = await dbPromise;

			const matches = await db.findObjects(CollectionId.Matches, {
				_id: { $in: comp.matches.map((matchId) => new ObjectId(matchId)) },
			});
			const allReports = await db.findObjects(CollectionId.Reports, {
				match: { $in: matches.map((match) => match?._id) },
			});
			const reports = allReports.filter((report) => report.submitted);

			if (reports.length == 0) {
				return res
					.status(200)
					.send({ error: "No reports found for competition" });
			}

			interface Row extends QuantData {
				timestamp: number | undefined;
				team: number;
			}

			const rows: Row[] = [];
			for (const report of reports) {
				const row = {
					...report.data,
					timestamp: report.timestamp,
					team: report.robotNumber,
				};
				rows.push(row);
			}

			const headers = Object.keys(rows[0]);

			let csv = headers.join(",") + "\n";

			for (const row of rows) {
				const data = headers.map((header) => row[header]);

				csv += data.join(",") + "\n";
			}

			res.status(200).send({ csv });
		},
	});

	teamCompRanking = createNextRoute<
		[string, number],
		{ place: number | string; max: number | string },
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, { tba }, authData, [tbaId, team]) => {
			const tbaResult = await tba.req.getCompetitonRanking(tbaId);
			if (!tbaResult || !tbaResult.rankings) {
				return res.status(200).send({ place: "?", max: "?" });
			}

			const { rankings } = tbaResult;

			const rank = rankings?.find(
				(ranking) => ranking.team_key === `frc${team}`,
			)?.rank;

			if (!rank) {
				return res.status(200).send({
					place: "?",
					max: rankings?.length,
				});
			}

			return res.status(200).send({
				place:
					rankings?.find((ranking) => ranking.team_key === `frc${team}`)
						?.rank ?? "?",
				max: rankings?.length,
			});
		},
	});

	getPitReports = createNextRoute<
		[ObjectId],
		Pitreport[],
		ApiDependencies,
		{ team: Team; comp: Competition }
	>({
		isAuthorized: (req, res, deps, [compId]) =>
			AccessLevels.IfOnTeamThatOwnsComp(req, res, deps, compId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			{ team, comp },
			[compId],
		) => {
			const db = await dbPromise;

			const pitReports = await db.findObjects(CollectionId.PitReports, {
				_id: { $in: comp.pitReports.map((id) => new ObjectId(id)) },
			});

			return res.status(200).send(pitReports);
		},
	});

	changeScouterForReport = createNextRoute<
		[ObjectId, string],
		{ result: string },
		ApiDependencies,
		any
	>({
		isAuthorized: (req, res, deps, [reportId]) =>
			AccessLevels.IfReportOwner(req, res, deps, reportId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			authData,
			[reportId, scouterId],
		) => {
			const db = await dbPromise;

			await db.updateObjectById(CollectionId.Reports, new ObjectId(reportId), {
				user: new ObjectId(scouterId),
			});

			return res.status(200).send({ result: "success" });
		},
	});

	changeTeamNumberForReport = createNextRoute<
		[ObjectId, ObjectId, number],
		{ result: string },
		ApiDependencies,
		any
	>({
		isAuthorized: (req, res, deps, [matchId, reportId]) =>
			AccessLevels.IfReportOwner(req, res, deps, reportId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			authData,
			[matchId, reportId, teamNumber],
		) => {
			const db = await dbPromise;

			const oldReport = await db.findObjectById(
				CollectionId.Reports,
				new ObjectId(reportId),
			);

			if (!oldReport) {
				return res.status(400).send({ result: "report not found" });
			}

			await db.updateObjectById(CollectionId.Reports, new ObjectId(reportId), {
				robotNumber: teamNumber,
			});

			// Update match
			const match = await db.findObjectById(
				CollectionId.Matches,
				new ObjectId(matchId),
			);
			if (!match) {
				return res.status(400).send({ result: "match not found" });
			}

			for (
				let i = 0;
				i < match.blueAlliance.length + match.redAlliance.length;
				i++
			) {
				const arr =
					i < match.blueAlliance.length
						? match.blueAlliance
						: match.redAlliance;
				if (arr[i % arr.length] === oldReport.robotNumber) {
					arr[i % arr.length] = teamNumber;
					break;
				}
			}

			await db.updateObjectById(CollectionId.Matches, new ObjectId(matchId), {
				blueAlliance: match.blueAlliance,
				redAlliance: match.redAlliance,
			});

			return res.status(200).send({ result: "success" });
		},
	});

	getCompReports = createNextRoute<
		[ObjectId],
		Report[],
		ApiDependencies,
		{ team: Team; comp: Competition }
	>({
		isAuthorized: (req, res, deps, [compId]) =>
			AccessLevels.IfOnTeamThatOwnsComp(req, res, deps, compId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			{ team, comp },
			[compId],
		) => {
			const db = await dbPromise;

			const reports = await db.findObjects(CollectionId.Reports, {
				match: { $in: comp.matches },
			});

			return res.status(200).send(reports);
		},
	});

	findScouterManagementData = createNextRoute<
		[ObjectId],
		{
			scouters: User[];
			matches: Match[];
			quantitativeReports: Report[];
			pitReports: Pitreport[];
			subjectiveReports: SubjectiveReport[];
		},
		ApiDependencies,
		{ team: Team; comp: Competition }
	>({
		isAuthorized: (req, res, deps, [compId]) =>
			AccessLevels.IfCompOwner(req, res, deps, compId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			{ team, comp },
			[compId],
		) => {
			const db = await dbPromise;

			const promises: Promise<any>[] = [];

			const scouters: User[] = [];
			const matches: Match[] = [];
			const quantitativeReports: Report[] = [];
			const pitReports: Pitreport[] = [];
			const subjectiveReports: SubjectiveReport[] = [];

			for (const scouterId of team?.scouters) {
				promises.push(
					db
						.findObjectById(CollectionId.Users, new ObjectId(scouterId))
						.then((scouter) => scouter && scouters.push(scouter)),
				);
			}

			for (const matchId of comp.matches) {
				promises.push(
					db
						.findObjectById(CollectionId.Matches, new ObjectId(matchId))
						.then((match) => match && matches.push(match)),
				);
			}

			promises.push(
				db
					.findObjects(CollectionId.Reports, {
						match: { $in: comp.matches },
					})
					.then((r) => quantitativeReports.push(...r)),
			);

			promises.push(
				db
					.findObjects(CollectionId.PitReports, {
						_id: { $in: comp.pitReports.map((id) => new ObjectId(id)) },
						submitted: true,
					})
					.then((r) => pitReports.push(...r)),
			);

			promises.push(
				db
					.findObjects(CollectionId.SubjectiveReports, {
						match: { $in: comp.matches },
					})
					.then((r) => subjectiveReports.push(...r)),
			);

			await Promise.all(promises);

			return res.status(200).send({
				scouters,
				matches,
				quantitativeReports,
				pitReports,
				subjectiveReports,
			});
		},
	});

	getPicklistFromComp = createNextRoute<
		[ObjectId],
		CompPicklistGroup | undefined,
		ApiDependencies,
		{ comp: Competition }
	>({
		isAuthorized: (req, res, deps, [compId]) =>
			AccessLevels.IfOnTeamThatOwnsComp(req, res, deps, compId),
		handler: async (req, res, { db: dbPromise }, { comp }, [compId]) => {
			const db = await dbPromise;

			const picklist = await db.findObjectById(
				CollectionId.Picklists,
				new ObjectId(comp.picklist),
			);

			if (picklist) picklist.strikethroughs ??= [];

			return res.status(200).send(picklist);
		},
	});

	getPicklistGroup = createNextRoute<
		[ObjectId],
		CompPicklistGroup | undefined,
		ApiDependencies,
		{ picklist: CompPicklistGroup }
	>({
		isAuthorized: (req, res, deps, [picklistId]) =>
			AccessLevels.IfOnTeamThatOwnsPicklist(req, res, deps, new ObjectId(picklistId)),
		handler: async (req, res, deps, { picklist }, [picklistId]) => {
			return res.status(200).send(picklist);
		},
	});

	updatePicklist = createNextRoute<
		[CompPicklistGroup],
		{ result: string },
		ApiDependencies,
		{ picklist: CompPicklistGroup }
	>({
		isAuthorized: (req, res, deps, [picklist]) =>
			AccessLevels.IfOnTeamThatOwnsPicklist(req, res, deps, picklist._id),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			{ picklist: oldPicklist },
			[newPicklist],
		) => {
			const db = await dbPromise;

			const { _id, ...picklistData } = newPicklist;
			await db.updateObjectById(
				CollectionId.Picklists,
				new ObjectId(oldPicklist._id),
				picklistData,
			);
			return res.status(200).send({ result: "success" });
		},
	});

	setCompPublicData = createNextRoute<
		[ObjectId, boolean],
		{ result: string },
		ApiDependencies,
		{ team: Team; comp: Competition }
	>({
		isAuthorized: (req, res, deps, [compId]) =>
			AccessLevels.IfCompOwner(req, res, deps, compId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			{ team, comp },
			[compId, publicData],
		) => {
			const db = await dbPromise;

			await db.updateObjectById(
				CollectionId.Competitions,
				new ObjectId(compId),
				{ publicData: publicData },
			);
			return res.status(200).send({ result: "success" });
		},
	});

	setOnboardingCompleted = createNextRoute<
		[ObjectId],
		{ result: string },
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.IfSignedIn,
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise, rollbar },
			authData,
			[userId],
		) => {
			const db = await dbPromise;
			const user = await userPromise;
			if (!user?._id) {
				rollbar.error("User not found (API: setOnboardingCompleted)", {
					userId,
				});
				return res.status(403).send({ error: "Unauthorized" });
			}

			await db.updateObjectById(CollectionId.Users, new ObjectId(user._id), {
				onboardingComplete: true,
			});
			return res.status(200).send({ result: "success" });
		},
	});

	submitSubjectiveReport = createNextRoute<
		[SubjectiveReport, string],
		{ result: string },
		ApiDependencies,
		{ team: Team; match: Match }
	>({
		isAuthorized: (req, res, deps, [report, matchId]) =>
			AccessLevels.IfOnTeamThatOwnsMatch(req, res, deps, new ObjectId(matchId)),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise, rollbar },
			{ team, match },
			[report],
		) => {
			const db = await dbPromise;
			const rawReport = report as SubjectiveReport;

			const user = await userPromise;

			if (!onTeam(team, user)) {
				rollbar.warn("User not on team (API: submitSubjectiveReport)", {
					team,
					user,
					report,
				});
				return res.status(403).send({ error: "Unauthorized" });
			}

			const newReport: SubjectiveReport = {
				...report,
				_id: new ObjectId(),
				submitter: user!._id!,
				submitted:
					match.subjectiveScouter === user!._id!
						? SubjectiveReportSubmissionType.ByAssignedScouter
						: team!.subjectiveScouters.find(
									(id) => id === user!._id!,
							  )
							? SubjectiveReportSubmissionType.BySubjectiveScouter
							: SubjectiveReportSubmissionType.ByNonSubjectiveScouter,
			};

			const update: Partial<Match> = {
				subjectiveReports: [
					...(match.subjectiveReports ?? []),
					newReport._id!,
				],
			};

			if (match.subjectiveScouter === user!._id)
				update.assignedSubjectiveScouterHasSubmitted = true;

			const insertReportPromise = db.addObject(
				CollectionId.SubjectiveReports,
				newReport,
			);
			const updateMatchPromise = db.updateObjectById(
				CollectionId.Matches,
				new ObjectId(match._id),
				update,
			);

			addXp(
				db,
				user!._id!,
				match.subjectiveScouter === user!._id ? 10 : 5,
			);

			await Promise.all([insertReportPromise, updateMatchPromise]);
			return res.status(200).send({ result: "success" });
		},
	});

	getSubjectiveReportsForComp = createNextRoute<
		[ObjectId],
		SubjectiveReport[],
		ApiDependencies,
		{ team: Team; comp: Competition }
	>({
		isAuthorized: (req, res, deps, [compId]) =>
			AccessLevels.IfOnTeamThatOwnsComp(req, res, deps, compId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			{ team, comp },
			[compId],
		) => {
			const db = await dbPromise;

			const reports = await db.findObjects(CollectionId.SubjectiveReports, {
				match: { $in: comp.matches },
			});

			return res.status(200).send(reports);
		},
	});

	updateSubjectiveReport = createNextRoute<
		[SubjectiveReport],
		{ result: string },
		ApiDependencies,
		{ report: SubjectiveReport }
	>({
		isAuthorized: (req, res, deps, [report]) =>
			AccessLevels.IfOnTeamThatOwnsSubjectiveReport(
				req,
				res,
				deps,
				report._id,
			),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			{ report: oldRepor },
			[newReport],
		) => {
			const db = await dbPromise;

			await db.updateObjectById(
				CollectionId.SubjectiveReports,
				new ObjectId(oldRepor._id),
				newReport,
			);
			return res.status(200).send({ result: "success" });
		},
	});

	setSubjectiveScouterForMatch = createNextRoute<
		[ObjectId, string],
		{ result: string },
		ApiDependencies,
		{ team: Team; match: Match }
	>({
		isAuthorized: (req, res, deps, [matchId]) =>
			AccessLevels.IfMatchOwner(req, res, deps, matchId),
		handler: async (
			req,
			res,
			{ db: dbPromise },
			{ team, match },
			[matchId, scouterId],
		) => {
			const db = await dbPromise;

			const scouter = team?.users.find((id) => id === new ObjectId(scouterId));

			if (!scouter)
				return res.status(400).send({ error: "Scouter not on team" });

			await db.updateObjectById(CollectionId.Matches, new ObjectId(matchId), {
				subjectiveScouter: scouter,
			});
			return res.status(200).send({ result: "success" });
		},
	});

	regeneratePitReports = createNextRoute<
		[ObjectId],
		{ result: string; pitReports: ObjectId[] },
		ApiDependencies,
		{ team: Team; comp: Competition }
	>({
		isAuthorized: (req, res, deps, [compId]) =>
			AccessLevels.IfCompOwner(req, res, deps, compId),
		handler: async (
			req,
			res,
			{ db: dbPromise, tba, userPromise },
			{ team, comp },
			[compId],
		) => {
			const db = await dbPromise;

			if (!comp.tbaId)
				return res.status(200).send({ error: "not linked to TBA" });

			const pitReports = await generatePitReports(
				tba,
				db,
				comp.tbaId,
				comp.gameId,
			);

			await db.updateObjectById(
				CollectionId.Competitions,
				new ObjectId(compId),
				{ pitReports: pitReports },
			);

			return res.status(200).send({ result: "success", pitReports });
		},
	});

	createPitReportForTeam = createNextRoute<
		[number, ObjectId],
		{ result: string },
		ApiDependencies,
		{ team: Team; comp: Competition }
	>({
		isAuthorized: (req, res, deps, [teamNumber, compId]) =>
			AccessLevels.IfCompOwner(req, res, deps, compId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise, rollbar },
			{ team, comp },
			[teamNumber, compId],
		) => {
			const db = await dbPromise;

			const pitReport = new Pitreport(
				teamNumber,
				games[comp.gameId].createPitReportData(),
			);
			const pitReportId = (
				await db.addObject(CollectionId.PitReports, pitReport)
			)._id;

			if (!pitReportId) {
				rollbar.error("Failed to create pit report", { pitReport, comp, team });
				return res.status(500).send({ error: "Failed to create pit report" });
			}

			comp.pitReports.push(new ObjectId(pitReportId));

			await db.updateObjectById(
				CollectionId.Competitions,
				new ObjectId(compId),
				{
					pitReports: comp.pitReports,
				},
			);

			return res.status(200).send({ result: "success" });
		},
	});

	updateCompNameAndTbaId = createNextRoute<
		[ObjectId, string, string],
		{ result: string },
		ApiDependencies,
		{ team: Team; comp: Competition }
	>({
		isAuthorized: (req, res, deps, [compId]) =>
			AccessLevels.IfCompOwner(req, res, deps, compId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			{ team, comp },
			[compId, name, tbaId],
		) => {
			const db = await dbPromise;

			await db.updateObjectById(
				CollectionId.Competitions,
				new ObjectId(compId),
				{
					name,
					tbaId,
				},
			);

			return res.status(200).send({ result: "success" });
		},
	});

	getFtcTeamAutofillData = createNextRoute<
		[number],
		Team | undefined,
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, { tba, db }, authData, [teamNumber]) => {
			const team = await TheOrangeAlliance.getTeam(teamNumber, await db);
			return res.status(200).send(team);
		},
	});

	ping = createNextRoute<[], { result: string }, ApiDependencies, void>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, authData, args) => {
			return res.status(200).send({ result: "success" });
		},
	});

	getSubjectiveReportsFromMatches = createNextRoute<
		[ObjectId, Match[]],
		SubjectiveReport[],
		ApiDependencies,
		{ team: Team; comp: Competition }
	>({
		isAuthorized: (req, res, deps, [compId]) =>
			AccessLevels.IfOnTeamThatOwnsComp(req, res, deps, compId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise, rollbar },
			{ team, comp },
			[compId, matches],
		) => {
			const db = await dbPromise;

			for (const match of matches) {
				if (!comp.matches.find((id) => id === match._id)) {
					rollbar.error(
						"Match not in competition (API: getSubjectiveReports)",
						{
							comp,
							match,
						},
					);
					return res.status(400).send({ error: "Match not in competition" });
				}
			}

			const matchIds = matches.map((match) => match._id);
			const reports = await db.findObjects(CollectionId.SubjectiveReports, {
				match: { $in: matchIds },
			});

			return res.status(200).send(reports);
		},
	});

	removeUserFromTeam = createNextRoute<
		[ObjectId, ObjectId],
		{ result: string; team: Team },
		ApiDependencies,
		Team
	>({
		isAuthorized: (req, res, deps, [teamId]) =>
			AccessLevels.IfTeamOwner(req, res, deps, teamId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise, rollbar },
			team,
			[teamId, userId],
		) => {
			const db = await dbPromise;

			const removedUserPromise = db.findObjectById(
				CollectionId.Users,
				new ObjectId(userId),
			);

			const { _id, ...newTeam } = {
				...team,
				users: team.users.filter((id) => id != new ObjectId(userId)),
				owners: team.owners.filter((id) => id != new ObjectId(userId)),
				scouters: team.scouters.filter((id) => id != new ObjectId(userId)),
				subjectiveScouters: team.subjectiveScouters.filter(
					(id) => id != new ObjectId(userId),
				),
			};

			const teamPromise = db.updateObjectById(
				CollectionId.Teams,
				new ObjectId(teamId),
				newTeam,
			);

			const removedUser = await removedUserPromise;
			if (!removedUser) {
				rollbar.error("User not found (API: removeUserFromTeam)", {
					team,
					userId,
				});
				return res.status(404).send({ error: "User not found" });
			}

			const newUserData: User = {
				...removedUser,
				teams: removedUser.teams.filter((id) => id !== teamId),
				owner: removedUser.owner.filter((id) => new ObjectId(id) !== teamId),
			};

			await db.updateObjectById(
				CollectionId.Users,
				new ObjectId(userId),
				newUserData,
			);
			await teamPromise;

			return res
				.status(200)
				.send({ result: "success", team: { _id, ...newTeam } });
		},
	});

	findUserById = createNextRoute<
		[ObjectId],
		User | undefined,
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, { db: dbPromise }, authData, [id]) => {
			const db = await dbPromise;
			const user = await db.findObjectById(
				CollectionId.Users,
				new ObjectId(id),
			);
			return res.status(200).send(user);
		},
	});

	findBulkUsersById = createNextRoute<
		[ObjectId[]],
		User[],
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, { db: dbPromise }, authData, [ids]) => {
			const db = await dbPromise;
			const users = await db.findObjects(CollectionId.Users, {
				_id: { $in: ids.map((id) => new ObjectId(id)) },
			});
			return res.status(200).send(users);
		},
	});

	findTeamById = createNextRoute<
		[ObjectId],
		Team | undefined,
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, { db: dbPromise }, authData, [id]) => {
			const db = await dbPromise;
			const team = await db.findObjectById(
				CollectionId.Teams,
				new ObjectId(id),
			);
			return res.status(200).send(team);
		},
	});

	findTeamByNumberAndLeague = createNextRoute<
		[number, League],
		Team | undefined,
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (
			req,
			res,
			{ db: dbPromise },
			authData,
			[number, league],
		) => {
			const db = await dbPromise;

			const query =
				league === League.FRC
					? {
							number: number,
							$or: [{ league: league }, { tbaId: { $exists: true } }],
						}
					: { number: number, league: league };

			const team = await db.findObject(CollectionId.Teams, query);

			return res.status(200).send(team);
		},
	});

	findSeasonById = createNextRoute<
		[ObjectId],
		Season | undefined,
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, { db: dbPromise }, authData, [id]) => {
			const db = await dbPromise;
			const season = await db.findObjectById(
				CollectionId.Seasons,
				new ObjectId(id),
			);
			return res.status(200).send(season);
		},
	});

	findCompetitionById = createNextRoute<
		[string],
		Competition | undefined,
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, { db: dbPromise }, authData, [id]) => {
			const db = await dbPromise;
			const competition = await db.findObjectById(
				CollectionId.Competitions,
				new ObjectId(id),
			);
			return res.status(200).send(competition);
		},
	});

	findMatchById = createNextRoute<
		[ObjectId],
		Match | undefined,
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, { db: dbPromise }, authData, [id]) => {
			const db = await dbPromise;
			const match = await db.findObjectById(
				CollectionId.Matches,
				new ObjectId(id),
			);
			return res.status(200).send(match);
		},
	});

	findReportById = createNextRoute<
		[string],
		Report | undefined,
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, { db: dbPromise }, authData, [id]) => {
			const db = await dbPromise;
			const report = await db.findObjectById(
				CollectionId.Reports,
				new ObjectId(id),
			);
			return res.status(200).send(report);
		},
	});

	findPitreportById = createNextRoute<
		[ObjectId],
		Pitreport | undefined,
		ApiDependencies,
		{ team: Team; comp: Competition; pitReport: Pitreport }
	>({
		isAuthorized: (req, res, deps, [id]) =>
			AccessLevels.IfOnTeamThatOwnsPitReport(req, res, deps, new ObjectId(id)),
		handler: async (req, res, deps, { pitReport }, args) => {
			return res.status(200).send(pitReport);
		},
	});

	findBulkPitReportsById = createNextRoute<
		[ObjectId[]],
		Pitreport[],
		ApiDependencies,
		{ team: Team; comp: Competition; pitReport: Pitreport }[]
	>({
		isAuthorized: async (req, res, deps, [ids]) => {
			const reports = await Promise.all(
				ids.map((id) =>
					AccessLevels.IfOnTeamThatOwnsPitReport(req, res, deps, id),
				),
			);

			return {
				authorized: reports.every((report) => report.authorized),
				authData: reports.map((report) => report.authData!),
			};
		},
		handler: async (req, res, deps, authData, args) => {
			return res.status(200).send(authData.map((report) => report.pitReport));
		},
	});

	updateUser = createNextRoute<
		[object],
		{ result: string },
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.IfSignedIn,
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			authData,
			[newValues],
		) => {
			const db = await dbPromise;
			const user = await userPromise;

			await db.updateObjectById(
				CollectionId.Users,
				user?._id!,
				newValues,
			);
			return res.status(200).send({ result: "success" });
		},
	});

	updateTeam = createNextRoute<
		[object, ObjectId],
		{ result: string },
		ApiDependencies,
		Team
	>({
		isAuthorized: (req, res, deps, [newValues, teamId]) =>
			AccessLevels.IfTeamOwner(req, res, deps, teamId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			team,
			[newValues, teamId],
		) => {
			const db = await dbPromise;

			await db.updateObjectById(
				CollectionId.Teams,
				new ObjectId(teamId),
				newValues,
			);
			return res.status(200).send({ result: "success" });
		},
	});

	updateSeason = createNextRoute<
		[object, string],
		{ result: string },
		ApiDependencies,
		{ team: Team; season: Season }
	>({
		isAuthorized: (req, res, deps, [newValues, seasonId]) =>
			AccessLevels.IfSeasonOwner(req, res, deps, new ObjectId(seasonId)),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			{ team, season },
			[newValues, seasonId],
		) => {
			const db = await dbPromise;

			await db.updateObjectById(
				CollectionId.Seasons,
				new ObjectId(seasonId),
				newValues,
			);
			return res.status(200).send({ result: "success" });
		},
	});

	updateReport = createNextRoute<
		[Partial<Report>, ObjectId],
		{ result: string },
		ApiDependencies,
		{ team: Team; report: Report }
	>({
		isAuthorized: (req, res, deps, [newValues, reportId]) =>
			AccessLevels.IfOnTeamThatOwnsReport(req, res, deps, reportId),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			authData,
			[newValues, reportId],
		) => {
			const db = await dbPromise;

			await db.updateObjectById(
				CollectionId.Reports,
				new ObjectId(reportId),
				newValues,
			);
			return res.status(200).send({ result: "success" });
		},
	});

	updatePitreport = createNextRoute<
		[ObjectId, object],
		{ result: string },
		ApiDependencies,
		{ team: Team; comp: Competition }
	>({
		isAuthorized: (req, res, deps, [pitreportId]) =>
			AccessLevels.IfOnTeamThatOwnsPitReport(req, res, deps, new ObjectId(pitreportId)),
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise },
			{ team, comp },
			[pitreportId, newValues],
		) => {
			const db = await dbPromise;

			await db.updateObjectById(
				CollectionId.PitReports,
				new ObjectId(pitreportId),
				newValues,
			);
			return res.status(200).send({ result: "success" });
		},
	});

	speedTest = createNextRoute<
		[],
		{
			requestTime: number;
			authTime: number;
			insertTime: number;
			findTime: number;
			updateTime: number;
			deleteTime: number;
			responseTimestamp: number;
		},
		ApiDependencies,
		void
	>(
		{
			isAuthorized: AccessLevels.AlwaysAuthorized,
			handler: async (
				req,
				res,
				{ userPromise, db: dbPromise, rollbar },
				authData,
				args,
			) => {
				const [requestTimestamp] = args as unknown as [number];

				const authStart = Date.now();
				const user = await userPromise;
				if (!user || !isDeveloper(user.email)) {
					rollbar.error("Unauthorized speedTest", { user });
					return res.status(403).send({ error: "Unauthorized" });
				}

				const resObj = {
					requestTime: Math.max(Date.now() - requestTimestamp, 0),
					authTime: Date.now() - authStart,
					insertTime: 0,
					findTime: 0,
					updateTime: 0,
					deleteTime: 0,
					responseTimestamp: Date.now(),
				};

				const db = await dbPromise;

				const testObject = {
					_id: new ObjectId(),
				};
				const insertStart = Date.now();
				await db.addObject(CollectionId.Misc, testObject);
				resObj.insertTime = Date.now() - insertStart;

				const findStart = Date.now();
				await db.findObjectById(CollectionId.Misc, testObject._id);
				resObj.findTime = Date.now() - findStart;

				const updateStart = Date.now();
				await db.updateObjectById(CollectionId.Misc, testObject._id, {
					name: "test",
				});
				resObj.updateTime = Date.now() - updateStart;

				const deleteStart = Date.now();
				await db.deleteObjectById(CollectionId.Misc, testObject._id);
				resObj.deleteTime = Date.now() - deleteStart;

				resObj.responseTimestamp = Date.now();
				return res.status(200).send(resObj);
			},
		},
		() =>
			requestHelper.request("/speedTest", [Date.now()]).then((times) => ({
				...times,
				responseTime: Date.now() - times.responseTimestamp,
			})),
	);

	getLeaderboard = createNextRoute<
		[],
		{ users: LeaderboardUser[]; teams: LeaderboardTeam[] },
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.AlwaysAuthorized,
		handler: async (req, res, { db: dbPromise }, authData, args) => {
			const db = await dbPromise;

			const users = await db.findObjects(CollectionId.Users, {
				xp: { $gt: 0 },
				email: { $ne: "totallyrealemail@gmail.com" },
			});

			logger.log(
				"ID Query:",
				users.map((user) => user.teams.map((id) => new ObjectId(id))).flat(),
			);

			const teams = await db.findObjects(CollectionId.Teams, {
				_id: {
					$in: users
						.map((user) => user.teams.map((id) => new ObjectId(id)))
						.flat(),
				},
			});

			logger.log("Found", users, teams);

			const leaderboardTeams = teams.reduce(
				(acc, team) => {
					acc[team._id!.toString()] = {
						_id: team._id!,
						name: team.name,
						number: team.number,
						league: team.league ?? League.FRC,
						xp: 0,
					};

					return acc;
				},
				{} as { [_id: string]: LeaderboardTeam },
			);

			const leaderboardUsers = users
				.map((user) => ({
					_id: user._id!,
					name: user.name?.split(" ")[0] ?? "Unknown",
					image: user.image,
					xp: user.xp,
					level: user.level,
					teams: user.teams
						.map((id) => leaderboardTeams[id.toString()])
						.map((team) => `${team.league ?? League.FRC} ${team.number}`),
				}))
				.sort((a, b) => b.xp - a.xp);

			users.forEach((user) => {
				user.teams.forEach((teamId) => {
					leaderboardTeams[teamId.toString()].xp += user.xp;
				});
			});

			const leaderboardTeamsArray = Object.values(leaderboardTeams).sort(
				(a, b) => b.xp - a.xp,
			);

			return res
				.status(200)
				.send({ users: leaderboardUsers, teams: leaderboardTeamsArray });
		},
	});

	getUserAnalyticsData = createNextRoute<
		[],
		{ [team: string]: { date: Date; count: number }[] },
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.IfDeveloper,
		handler: async (req, res, { db: dbPromise }, authData, args) => {
			const db = await dbPromise;

			// Find data from DB
			const [teams, users] = await Promise.all([
				db.findObjects(CollectionId.Teams, {}),
				db.findObjects(CollectionId.Users, {
					lastSignInDateTime: { $exists: true },
				}),
			]);

			// Create a linked list for each team
			const signInDatesByTeam: {
				[team: string]: LinkedList<{ date: string; count: number }>;
			} = teams.reduce(
				(acc, team) => {
					acc[team._id!.toString()] = new LinkedList<{
						date: string;
						count: number;
					}>();
					return acc;
				},
				{ All: new LinkedList() } as {
					[team: string]: LinkedList<{ date: string; count: number }>;
				},
			);

			for (const user of users) {
				// Add the user to each of their teams
				for (const team of [...user.teams, "All"]) {
					const signInDates = signInDatesByTeam[team.toString()];

					// Iterate through the team's linked list
					for (let node = signInDates.first(); true; node = node.next) {
						if (!node) {
							// We're either at the end of the list, or the list is empty

							// Can't just update signInDates, as that will reference a new object and not change the old one!
							signInDates.setHead({
								date: user.lastSignInDateTime!.toDateString(),
								count: 1,
							});
							break;
						}

						if (
							node &&
							node?.date === user.lastSignInDateTime!.toDateString()
						) {
							// Found the node with the same date
							node.count++;
							break;
						}

						if (
							!node?.next ||
							new Date(user.lastSignInDateTime!.toDateString())! <
								new Date(node.next.date)
						) {
							// The next node's date is after the user's sign-in date
							signInDates.insertAfter(node!, {
								date: user.lastSignInDateTime!.toDateString(),
								count: 1,
							});
							break;
						}
					}
				}
			}

			// Convert linked lists to arrays
			const responseObj: { [team: string]: { date: Date; count: number }[] } =
				{};
			for (const obj of [...teams, "All"]) {
				// Convert ObjectIds to strings
				const id = typeof obj === "object" ? obj._id! : obj;
				// Pull relevant data from the team to create a label
				const label =
					typeof obj === "object" ? `${obj.league} ${obj.number}` : obj;

				// Convert date strings to Date objects
				responseObj[label] = signInDatesByTeam[id.toString()].map((node) => ({
					date: new Date(node.date),
					count: node.count,
				}));
			}

			// Send the response
			res.status(200).send(responseObj);
		},
	});

	getCacheStats = createNextRoute<
		[],
		object | undefined,
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.IfDeveloper,
		handler: async (req, res, {}, authData, args) => {
			if (!global.cache) return res.status(200).send(undefined);
			const stats = global.cache.getStats();
			return res.status(200).send(stats);
		},
	});

	getCachedValue = createNextRoute<
		[string],
		object | undefined,
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.IfDeveloper,
		handler: async (req, res, {}, authData, [key]) => {
			if (!global.cache) return res.status(500).send({ error: "No cache" });
			const val = global.cache.get(key) as object | undefined;
			return res.status(200).send(val);
		},
	});

	changeUserName = createNextRoute<
		[string],
		{ result: string },
		ApiDependencies,
		void
	>({
		isAuthorized: AccessLevels.IfSignedIn,
		handler: async (
			req,
			res,
			{ db: dbPromise, userPromise, rollbar },
			authData,
			[name],
		) => {
			const db = await dbPromise;
			const user = await userPromise;

			if (name.length < 3 || name.length > 30)
				return res
					.status(400)
					.send({ error: "Name must be between 1 and 30 characters" });

			// Check if name is alphanumeric
			for (const char of name) {
				const code = char.toLowerCase().charCodeAt(0);
				if (
					!(code >= 97 && code <= 122) &&
					!(code >= 48 && code <= 57) &&
					code !== " ".charCodeAt(0) &&
					code !== "-".charCodeAt(0) &&
					code !== "_".charCodeAt(0) &&
					code !== "'".charCodeAt(0)
				) {
					rollbar.error("Invalid name (API: changeUserName)", {
						name,
						user,
					});
					return res.status(400).send({ error: "Name must be alphanumeric" });
				}
			}

			await db.updateObjectById(CollectionId.Users, new ObjectId(user?._id!), {
				name,
			});
			return res.status(200).send({ result: "success" });
		},
	});

	deleteComp = createNextRoute<
		[ObjectId],
		{ result: string },
		ApiDependencies,
		{ team: Team; comp: Competition }
	>({
		isAuthorized: (req, res, deps, [compId]) =>
			AccessLevels.IfCompOwner(req, res, deps, compId),
		handler: async (req, res, { db }, { team, comp }, [compId]) => {
			await deleteComp(await db, comp);

			return res.status(200).send({ result: "success" });
		},
	});

	deleteSeason = createNextRoute<
		[string],
		{ result: string },
		ApiDependencies,
		{ team: Team; season: Season }
	>({
		isAuthorized: (req, res, deps, [seasonId]) =>
			AccessLevels.IfSeasonOwner(req, res, deps, new ObjectId(seasonId)),
		handler: async (req, res, { db }, { team, season }, [seasonId]) => {
			await deleteSeason(await db, season);

			return res.status(200).send({ result: "success" });
		},
	});
}
