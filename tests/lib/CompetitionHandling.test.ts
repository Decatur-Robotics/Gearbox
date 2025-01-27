import CollectionId from "@/lib/client/CollectionId";
import InMemoryDbInterface from "@/lib/client/dbinterfaces/InMemoryDbInterface";
import {
	assignScoutersToCompetitionMatches,
	generateSchedule,
} from "@/lib/CompetitionHandling";
import { fillTeamWithFakeUsers } from "@/lib/dev/FakeData";
import { AllianceColor, Competition, Match, Report, Team } from "@/lib/Types";
import { MatchType } from "../../lib/Types";
import { ObjectId } from "bson";

describe(generateSchedule.name, () => {
	test("Generates a schedule with the correct number of matches", () => {
		const scouters = ["a", "b", "c", "d", "e", "f", "g", "h"];
		const subjectiveScouters = ["a", "b", "c", "d", "e", "f", "g", "h"];
		const matchCount = 10;
		const robotsPerMatch = 6;

		const schedule = generateSchedule(
			scouters,
			subjectiveScouters,
			matchCount,
			robotsPerMatch,
		);

		expect(schedule.length).toBe(matchCount);
	});

	test("Generates a schedule with the correct number of scouters per match", () => {
		const scouters = [
			"a",
			"b",
			"c",
			"d",
			"e",
			"f",
			"g",
			"h",
			"i",
			"j",
			"k",
			"l",
			"m",
			"n",
			"o",
			"p",
		];
		const subjectiveScouters = [
			"a",
			"b",
			"c",
			"d",
			"e",
			"f",
			"g",
			"h",
			"i",
			"j",
			"k",
			"l",
			"m",
			"n",
			"o",
			"p",
		];

		const matchCount = 10;
		const robotCounts = [4, 6, 8, 10];

		for (const robotsPerMatch of robotCounts) {
			const schedule = generateSchedule(
				scouters,
				subjectiveScouters,
				matchCount,
				robotsPerMatch,
			);

			for (const match of schedule) {
				expect(match.assignedScouters.length).toBe(robotsPerMatch);
			}
		}
	});

	test("Rotates scouters ", () => {
		const scouters = ["a", "b", "c", "d", "e", "f", "g", "h"];

		const matchCount = 6;
		const robotsPerMatch = 6;

		const schedule = generateSchedule(scouters, [], matchCount, robotsPerMatch);

		for (let i = 1; i < matchCount; i++) {
			expect(schedule[i].assignedScouters).not.toEqual(
				schedule[i - 1].assignedScouters,
			);
		}
	});

	test("Assigns and rotates subjective scouters", () => {
		const scouters = ["a", "b", "c", "d", "e", "f", "g", "h"];
		const subjectiveScouters = ["a", "b", "c", "d", "e", "f", "g", "h"];

		const matchCount = subjectiveScouters.length;
		const robotsPerMatch = 6;

		const schedule = generateSchedule(
			scouters,
			subjectiveScouters,
			matchCount,
			robotsPerMatch,
		);

		for (let i = 0; i < matchCount; i++) {
			expect(schedule[i].subjectiveScouter).toBe(subjectiveScouters[i]);
		}
	});

	test("Does not assign user as both a scouter and a subjective scouter", () => {
		const scouters = ["a", "b", "c", "d", "e", "f", "g", "h"];
		const subjectiveScouters = ["a", "b", "c", "d", "e", "f", "g", "h"];

		const matchCount = 10;
		const robotsPerMatch = 6;

		const schedule = generateSchedule(
			scouters,
			subjectiveScouters,
			matchCount,
			robotsPerMatch,
		);

		for (const match of schedule) {
			expect(match.assignedScouters).not.toContain(match.subjectiveScouter);
		}
	});
});

describe(assignScoutersToCompetitionMatches.name, () => {
	async function createTestComp(
		matchCount: number,
		subjectiveScouters: boolean,
	): Promise<{
		db: InMemoryDbInterface;
		team: Team;
		comp: Competition;
		matches: Match[];
		reports: Report[];
	}> {
		const db = new InMemoryDbInterface();

		let team = new Team("test", "test", undefined, 1);
		await db.addObject(CollectionId.Teams, team);

		team = await fillTeamWithFakeUsers(10, team._id, db);

		if (subjectiveScouters) {
			team = (await db.findObjectById(
				CollectionId.Teams,
				new ObjectId(team._id),
			))!;

			team.subjectiveScouters = team.scouters.slice(0, 2);

			await db.updateObjectById(CollectionId.Teams, team._id, team);
		}

		const matches: Match[] = [];
		const reports: Report[] = [];
		for (let i = 1; i <= matchCount; i++) {
			const match = new Match(
				i,
				i.toString(),
				undefined,
				0,
				MatchType.Qualifying,
				[0, 1, 2],
				[3, 4, 5],
			);
			match._id = new ObjectId() as any;

			const matchReports = Array.from({ length: 6 }, (_, i) => ({
				...new Report(
					undefined,
					{} as any,
					[0, 1, 2, 3, 4, 5][i],
					AllianceColor.Blue,
					match._id!.toString(),
				),
				_id: new ObjectId() as any as string,
			}));

			match.reports = matchReports.map((r) => r._id?.toString()!);

			matches.push(match);
			reports.push(...matchReports);
		}

		// Add the matches and reports to the database
		await Promise.all([
			...matches.map((m) => db.addObject(CollectionId.Matches, m)),
			...reports.map((r) => db.addObject(CollectionId.Reports, r)),
		]);

		const comp = new Competition("test", "test", undefined, 1, 1);
		comp.matches = matches.map((m) => m._id!.toString());
		await db.addObject(CollectionId.Competitions, comp);

		return { db, team, comp, matches, reports };
	}

	test("Assigns scouters to matches if team has scouters", async () => {
		const { db, team, comp, matches, reports } = await createTestComp(
			10,
			false,
		);

		await assignScoutersToCompetitionMatches(
			db,
			team._id,
			new ObjectId(comp._id),
		);

		const updatedReports = await Promise.all(
			reports.map((r) =>
				db.findObjectById(CollectionId.Reports, new ObjectId(r._id)),
			),
		);

		for (const report of updatedReports) {
			expect(report?.user).toBeDefined();
			expect(team.scouters).toContain(report?.user);
		}
	});

	test("Does not assign scouters to matches if team does not have scouters", async () => {
		const { db, team, comp, reports } = await createTestComp(10, false);

		team.scouters = [];
		await db.updateObjectById(CollectionId.Teams, team._id, team);

		await assignScoutersToCompetitionMatches(
			db,
			team._id,
			new ObjectId(comp._id),
		);

		const updatedReports = await Promise.all(
			reports.map((r) =>
				db.findObjectById(CollectionId.Reports, new ObjectId(r._id)),
			),
		);

		for (const report of updatedReports) {
			expect(report?.user).toBeUndefined();
		}
	});

	test("Rotates through scouters", async () => {
		const { db, team, comp, matches, reports } = await createTestComp(
			10,
			false,
		);

		await assignScoutersToCompetitionMatches(
			db,
			team._id,
			new ObjectId(comp._id),
		);

		const updatedReports = await Promise.all(
			reports.map((r) =>
				db.findObjectById(CollectionId.Reports, new ObjectId(r._id)),
			),
		);

		const scouters = team.scouters.slice();

		let prevReport: Report | undefined = undefined;
		for (const report of updatedReports) {
			if (prevReport) {
				expect(report?.user).not.toBe(prevReport.user);
			}

			expect(scouters).toContain(report?.user);

			prevReport = report;
		}
	});

	test("Assigns subjective scouters to matches if team has subjective scouters", async () => {
		const { db, team, comp, matches } = await createTestComp(10, true);

		await assignScoutersToCompetitionMatches(
			db,
			team._id,
			new ObjectId(comp._id),
		);

		const updatedMatches = await Promise.all(
			matches.map((m) =>
				db.findObjectById(CollectionId.Matches, new ObjectId(m._id)),
			),
		);

		for (const match of updatedMatches) {
			expect(match?.subjectiveScouter).toBeDefined();
			expect(team.subjectiveScouters).toContain(match?.subjectiveScouter);
		}
	});

	test("Does not assign subjective scouters to matches if team does not have subjective scouters", async () => {
		const { db, team, comp, matches } = await createTestComp(10, false);

		await assignScoutersToCompetitionMatches(
			db,
			team._id,
			new ObjectId(comp._id),
		);

		const updatedMatches = await Promise.all(
			matches.map((m) =>
				db.findObjectById(CollectionId.Matches, new ObjectId(m._id)),
			),
		);

		for (const match of updatedMatches) {
			expect(match?.subjectiveScouter).toBeUndefined();
		}
	});

	test("Rotates through subjective scouters", async () => {
		const { db, team, comp, matches } = await createTestComp(10, true);

		await assignScoutersToCompetitionMatches(
			db,
			team._id,
			new ObjectId(comp._id),
		);

		const updatedMatches = await Promise.all(
			matches.map((m) =>
				db.findObjectById(CollectionId.Matches, new ObjectId(m._id)),
			),
		);

		const scouters = team.subjectiveScouters.slice();

		let prevMatch: Match | undefined = undefined;
		for (const match of updatedMatches) {
			if (prevMatch) {
				expect(match?.subjectiveScouter).not.toBe(prevMatch.subjectiveScouter);
			}

			expect(scouters).toContain(match?.subjectiveScouter);

			prevMatch = match;
		}
	});

	test("Throws error if team is not found", async () => {
		const { db, comp } = await createTestComp(10, false);

		await expect(
			assignScoutersToCompetitionMatches(
				db,
				new ObjectId(),
				new ObjectId(comp._id),
			),
		).rejects.toThrow("Team not found");
	});

	test("Throws error if competition is not found", async () => {
		const { db, team } = await createTestComp(10, false);

		await expect(
			assignScoutersToCompetitionMatches(db, team._id, new ObjectId()),
		).rejects.toThrow("Competition not found");
	});
});
