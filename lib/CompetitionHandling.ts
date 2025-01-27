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

	const promises: Promise<any>[] = [];
	for (let i = 0; i < comp.matches.length; i++) {
		// Filter out the subjective scouter that will be assigned to this match
		promises.push(
			generateReportsForMatch(db, comp.matches[i], comp.gameId, schedule[i]),
		);
	}

	await Promise.all(promises);
	return "Success";
}

export async function generateReportsForMatch(
	db: DbInterface,
	match: string | Match,
	gameId: GameId,
	schedule?: ScheduleMatch,
) {
	if (typeof match === "string") {
		const foundMatch = await db.findObjectById(
			CollectionId.Matches,
			new ObjectId(match),
		);

		if (!foundMatch) {
			throw new Error("Match not found");
		}

		match = foundMatch;
	}

	match.subjectiveScouter = schedule?.subjectiveScouter;

	const existingReportPromises = match.reports.map((r) =>
		db.findObjectById(CollectionId.Reports, new ObjectId(r)),
	);
	const existingReports = await Promise.all(existingReportPromises);

	const bots = match.blueAlliance.concat(match.redAlliance);
	const reports = [];
	for (let i = 0; i < bots.length; i++) {
		const teamNumber = bots[i];
		const scouter =
			i < (schedule?.assignedScouters.length ?? 0)
				? schedule?.assignedScouters[i]
				: undefined;
		const color = match.blueAlliance.includes(teamNumber)
			? AllianceColor.Blue
			: AllianceColor.Red;

		const oldReport = existingReports.find(
			(r) => r?.robotNumber === teamNumber,
		);

		if (!oldReport) {
			// Create a new report

			const newReport = new Report(
				scouter,
				games[gameId].createQuantitativeFormData(),
				teamNumber,
				color,
				String(match._id),
				0,
			);

			reports.push(
				String((await db.addObject(CollectionId.Reports, newReport))._id),
			);
		} else {
			// Update existing report
			oldReport.user = scouter;

			await db.updateObjectById(
				CollectionId.Reports,
				new ObjectId(oldReport._id),
				oldReport,
			);
			reports.push(oldReport._id);
		}
	}

	match.reports = reports.filter((r) => r !== undefined) as string[];
	await db.updateObjectById(
		CollectionId.Matches,
		new ObjectId(match._id),
		match,
	);
}
