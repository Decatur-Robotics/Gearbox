/**
 * @tested_by tests/lib/api/ApiUtils.test.ts
 */
import { ObjectId } from "bson";
import CollectionId from "../client/CollectionId";
import DbInterface from "../client/dbinterfaces/DbInterface";
import { GameId } from "../client/GameId";
import { TheBlueAlliance } from "../TheBlueAlliance";
import {
	User,
	Team,
	Report,
	Competition,
	CompPicklistGroup,
	Match,
	Pitreport,
	Season,
	SubjectiveReport,
} from "../Types";
import { xpToLevel } from "../Xp";

export function onTeam(team?: Team | null, user?: User) {
	return (
		team &&
		user &&
		user._id &&
		team.users.find((owner) => owner === user._id?.toString()) !== undefined
	);
}

export function ownsTeam(team?: Team | null, user?: User) {
	return (
		team &&
		user &&
		user._id &&
		team.owners.find((owner) => owner === user._id?.toString()) !== undefined
	);
}

export function getCompFromReport(db: DbInterface, report: Report) {
	return db.findObject(CollectionId.Competitions, {
		matches: report.match?.toString(),
	});
}

export function getCompFromMatch(db: DbInterface, match: Match) {
	return db.findObject(CollectionId.Competitions, {
		matches: match._id?.toString(),
	});
}

export function getCompFromPitReport(db: DbInterface, report: Pitreport) {
	return db.findObject(CollectionId.Competitions, {
		pitReports: report._id?.toString(),
	});
}

export function getCompFromSubjectiveReport(
	db: DbInterface,
	report: SubjectiveReport,
) {
	return db
		.findObject(CollectionId.Matches, {
			subjectiveReports: report._id?.toString(),
		})
		.then((match) => {
			if (!match) return undefined;

			return getCompFromMatch(db, match);
		});
}

export function getCompFromPicklist(
	db: DbInterface,
	picklist: CompPicklistGroup,
) {
	return db.findObject(CollectionId.Competitions, {
		picklist: picklist._id?.toString(),
	});
}

export function getSeasonFromComp(db: DbInterface, comp: Competition) {
	return db.findObject(CollectionId.Seasons, {
		competitions: comp?._id?.toString(), // Specifying one value is effectively includes for arrays
	});
}

export function getTeamFromSeason(db: DbInterface, season: Season) {
	return db.findObject(CollectionId.Teams, {
		seasons: season._id?.toString(),
	});
}

export async function getTeamFromComp(db: DbInterface, comp: Competition) {
	const season = await getSeasonFromComp(db, comp);

	if (!season) return undefined;

	return getTeamFromSeason(db, season);
}

export async function getTeamFromDocument(
	db: DbInterface,
	getComp: (db: DbInterface, doc: any) => Promise<any>,
	doc: any,
) {
	const comp = await getComp(db, doc);

	if (!comp) return undefined;

	return getTeamFromComp(db, comp);
}

export async function getTeamFromReport(db: DbInterface, report: Report) {
	return getTeamFromDocument(db, getCompFromReport, report);
}

export async function getTeamFromMatch(db: DbInterface, match: Match) {
	return getTeamFromDocument(db, getCompFromMatch, match);
}

export async function getTeamFromPitReport(db: DbInterface, report: Pitreport) {
	return getTeamFromDocument(db, getCompFromPitReport, report);
}

export async function getTeamFromPicklist(
	db: DbInterface,
	picklist: CompPicklistGroup,
) {
	return getTeamFromDocument(db, getCompFromPicklist, picklist);
}

export async function getTeamFromSubjectiveReport(
	db: DbInterface,
	report: SubjectiveReport,
) {
	return getTeamFromDocument(db, getCompFromSubjectiveReport, report);
}

export async function generatePitReports(
	tba: TheBlueAlliance.Interface,
	db: DbInterface,
	tbaId: string,
	gameId: GameId,
): Promise<string[]> {
	var pitreports = await tba.getCompetitionPitreports(tbaId, gameId);
	pitreports.map(
		async (report) => (await db.addObject(CollectionId.PitReports, report))._id,
	);

	return pitreports.map((pit) => String(pit._id));
}

export async function addXp(db: DbInterface, userId: string, xp: number) {
	const user = await db.findObjectById(
		CollectionId.Users,
		new ObjectId(userId),
	);

	if (!user) return;

	const newXp = user.xp + xp;
	const newLevel = xpToLevel(newXp);

	await db.updateObjectById(CollectionId.Users, new ObjectId(userId), {
		xp: newXp,
		level: newLevel,
	});
}

export async function deleteReport(
	db: DbInterface,
	reportId: string,
	match: Match,
) {
	await db.updateObjectById(CollectionId.Matches, new ObjectId(match._id), {
		reports: match.reports.filter((id) => id !== reportId),
	});
	await db.deleteObjectById(CollectionId.Reports, new ObjectId(reportId));
}

export async function deleteSubjectiveReport(
	db: DbInterface,
	reportId: string,
	match: Match,
) {
	await db.updateObjectById(CollectionId.Matches, new ObjectId(match._id), {
		subjectiveReports: match.subjectiveReports.filter((id) => id !== reportId),
	});
	await db.deleteObjectById(
		CollectionId.SubjectiveReports,
		new ObjectId(reportId),
	);
}

export async function deleteMatch(
	db: DbInterface,
	matchId: string,
	comp: Competition,
) {
	const match = await db.findObjectById(
		CollectionId.Matches,
		new ObjectId(matchId),
	);

	if (!match) return;

	if (comp) {
		db.updateObjectById(CollectionId.Competitions, new ObjectId(comp._id), {
			matches: comp.matches.filter((id) => id !== match._id?.toString()),
		});
	}

	await Promise.all([
		...match.reports.map(async (reportId) => deleteReport(db, reportId, match)),
		...match.subjectiveReports.map(async (reportId) =>
			deleteSubjectiveReport(db, reportId, match),
		),
	]);

	await db.deleteObjectById(CollectionId.Matches, new ObjectId(match._id));
}

export async function deletePitReport(
	db: DbInterface,
	reportId: string,
	comp: Competition,
) {
	if (comp) {
		db.updateObjectById(CollectionId.Competitions, new ObjectId(comp._id), {
			pitReports: comp.pitReports.filter((id) => id !== reportId.toString()),
		});
	}

	await db.deleteObjectById(CollectionId.PitReports, new ObjectId(reportId));
}

export async function deleteComp(db: DbInterface, comp: Competition) {
	const season = await getSeasonFromComp(db, comp);

	if (season) {
		db.updateObjectById(CollectionId.Seasons, new ObjectId(season._id), {
			competitions: season.competitions.filter(
				(id) => id !== comp._id?.toString(),
			),
		});
	}

	await Promise.all([
		...comp.matches.map(async (matchId) => deleteMatch(db, matchId, comp)),
		...comp.pitReports.map(async (reportId) =>
			deletePitReport(db, reportId, comp),
		),
	]);

	await db.deleteObjectById(CollectionId.Competitions, new ObjectId(comp._id));
}

export async function deleteSeason(db: DbInterface, season: Season) {
	const team = await getTeamFromSeason(db, season);

	if (team) {
		db.updateObjectById(CollectionId.Teams, new ObjectId(team._id), {
			seasons: team.seasons.filter((id) => id !== season._id?.toString()),
		});
	}

	await Promise.all([
		...season.competitions.map(async (compId) => {
			const comp = await db.findObjectById(
				CollectionId.Competitions,
				new ObjectId(compId),
			);
			if (comp) {
				await deleteComp(db, comp);
			}
		}),
	]);

	await db.deleteObjectById(CollectionId.Seasons, new ObjectId(season._id));
}
