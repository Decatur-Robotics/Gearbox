/**
 * @tested_by tests/lib/CompetitionHandling.test.ts
 */
import {
	Competition,
	Match,
	Team,
	Report,
	AllianceColor,
	League,
} from "./Types";
import { ObjectId } from "bson";
import { rotateArray } from "./client/ClientUtils";
import { games } from "./games";
import { GameId } from "./client/GameId";
import CollectionId from "./client/CollectionId";
import DbInterface from "./client/dbinterfaces/DbInterface";
import { _id } from "@next-auth/mongodb-adapter";
import { match } from "assert";

type ScheduleMatch = {
	subjectiveScouter?: string;
	assignedScouters: string[];
};

export function generateSchedule(
	scouters: string[],
	subjectiveScouters: string[],
	matchCount: number,
	robotsPerMatch: number,
) {
	const schedule = [];
	for (let i = 0; i < matchCount; i++) {
		const subjectiveScouter =
			subjectiveScouters.length > 0 ? subjectiveScouters[0] : undefined;
		const assignedScouters = (
			subjectiveScouter
				? scouters.filter((s) => s !== subjectiveScouter)
				: scouters
		).slice(0, robotsPerMatch);

		const match = {
			subjectiveScouter,
			assignedScouters,
		};
		schedule.push(match);
		rotateArray(scouters);
		rotateArray(subjectiveScouters);
	}

	return schedule;
}

export async function assignScoutersToCompetitionMatches(
	db: DbInterface,
	teamId: ObjectId,
	competitionId: ObjectId,
) {
	const comp = await db.findObjectById(
		CollectionId.Competitions,
		new ObjectId(competitionId),
	);

	const team = await db.findObjectById(
		CollectionId.Teams,
		new ObjectId(teamId),
	);

	if (!comp) {
		throw new Error("Competition not found");
	}

	if (!team) {
		throw new Error("Team not found");
	}

	// Filter out invalid users
	team.scouters = team.scouters.filter((s) => team.users.includes(s));
	team.subjectiveScouters = team.subjectiveScouters.filter((s) =>
		team.users.includes(s),
	);

	const schedule = generateSchedule(
		team.scouters,
		team.subjectiveScouters,
		comp.matches.length,
		games[comp.gameId].league == League.FRC ? 6 : 4,
	);

	const matches = await db.findObjects(CollectionId.Matches, {
		_id: { $in: comp.matches.map((m) => new ObjectId(m)) },
	});

	matches.sort((a, b) => a.number - b.number);

	const promises: Promise<any>[] = [];
	for (let i = 0; i < matches.length; i++) {
		// Filter out the subjective scouter that will be assigned to this match
		promises.push(assignScoutersToMatch(db, matches[i], schedule[i]));
	}

	await Promise.all(promises);
	return "Success";
}

async function assignScoutersToMatch(
	db: DbInterface,
	match: Match,
	schedule: ScheduleMatch,
) {
	match.subjectiveScouter = schedule.subjectiveScouter;

	const existingReportPromises = match.reports.map((r) =>
		db.findObjectById(CollectionId.Reports, new ObjectId(r)),
	);
	const existingReports = await Promise.all(existingReportPromises);

	const bots = match.blueAlliance.concat(match.redAlliance);
	const reports = [];
	for (let i = 0; i < bots.length; i++) {
		const teamNumber = bots[i];
		const scouter =
			i < (schedule.assignedScouters.length ?? 0)
				? schedule.assignedScouters[i]
				: undefined;

		const oldReport = existingReports.find(
			(r) => r?.robotNumber === teamNumber,
		);

		if (!oldReport) continue;

		// Update existing report
		oldReport.user = scouter;

		await db.updateObjectById(
			CollectionId.Reports,
			new ObjectId(oldReport._id),
			oldReport,
		);
		reports.push(oldReport._id);
	}

	await db.updateObjectById(
		CollectionId.Matches,
		new ObjectId(match._id),
		match,
	);
}

/**
 * Generates reports for a match, creating new reports if they don't exist.
 * If some of the reports already exist, only the missing reports will be created.
 */
export async function generateReportsForMatch(
	db: DbInterface,
	match: Match,
	gameId: GameId,
) {
	const existingReports = await Promise.all(
		match.reports.map((r) =>
			db.findObjectById(CollectionId.Reports, new ObjectId(r)),
		),
	);

	const bots = match.blueAlliance.concat(match.redAlliance);
	const reports = [];
	for (let i = 0; i < bots.length; i++) {
		const teamNumber = bots[i];

		const oldReport = existingReports.find(
			(r) => r?.robotNumber === teamNumber,
		);

		if (oldReport) {
			reports.push(oldReport._id!);
			continue;
		}

		// Create a new report

		const color = match.blueAlliance.includes(teamNumber)
			? AllianceColor.Blue
			: AllianceColor.Red;

		const newReport = new Report(
			undefined,
			games[gameId].createQuantitativeFormData(),
			teamNumber,
			color,
			String(match._id),
			0,
		);

		reports.push(
			String((await db.addObject(CollectionId.Reports, newReport))._id),
		);
	}

	match.reports = reports;

	await db.updateObjectById(
		CollectionId.Matches,
		new ObjectId(match._id),
		match,
	);
}
