import CollectionId from "@/lib/client/CollectionId";
import InMemoryDbInterface from "@/lib/client/dbinterfaces/InMemoryDbInterface";
import {
	assignScoutersToCompetitionMatches,
	generateReportsForMatch,
	generateSchedule,
} from "@/lib/CompetitionHandling";
import { fillTeamWithFakeUsers } from "@/lib/dev/FakeData";
import {
	AllianceColor,
	Competition,
	League,
	Match,
	Report,
	Team,
} from "@/lib/Types";
import { MatchType } from "../../lib/Types";
import { ObjectId } from "bson";
import { GameId } from "@/lib/client/GameId";

describe(generateSchedule.name, () => {
	test("Generates a schedule with the correct number of matches", () => {
		const scouters = [
			new ObjectId("a"),
			new ObjectId("b"),
			new ObjectId("c"),
			new ObjectId("d"),
			new ObjectId("e"),
			new ObjectId("f"),
			new ObjectId("g"),
			new ObjectId("h"),
		];
		const subjectiveScouters = [
			new ObjectId("a"),
			new ObjectId("b"),
			new ObjectId("c"),
			new ObjectId("d"),
			new ObjectId("e"),
			new ObjectId("f"),
			new ObjectId("g"),
			new ObjectId("h"),
		];
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
			new ObjectId("a"),
			new ObjectId("b"),
			new ObjectId("c"),
			new ObjectId("d"),
			new ObjectId("e"),
			new ObjectId("f"),
			new ObjectId("g"),
			new ObjectId("h"),
			new ObjectId("i"),
			new ObjectId("j"),
			new ObjectId("k"),
			new ObjectId("l"),
			new ObjectId("m"),
			new ObjectId("n"),
			new ObjectId("o"),
			new ObjectId("p"),
		];
		const subjectiveScouters = [
			new ObjectId("a"),
			new ObjectId("b"),
			new ObjectId("c"),
			new ObjectId("d"),
			new ObjectId("e"),
			new ObjectId("f"),
			new ObjectId("g"),
			new ObjectId("h"),
			new ObjectId("i"),
			new ObjectId("j"),
			new ObjectId("k"),
			new ObjectId("l"),
			new ObjectId("m"),
			new ObjectId("n"),
			new ObjectId("o"),
			new ObjectId("p"),
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
		const scouters = [
			new ObjectId("a"),
			new ObjectId("b"),
			new ObjectId("c"),
			new ObjectId("d"),
			new ObjectId("e"),
			new ObjectId("f"),
			new ObjectId("g"),
			new ObjectId("h"),
		];

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
		const scouters = [
			new ObjectId("a"),
			new ObjectId("b"),
			new ObjectId("c"),
			new ObjectId("d"),
			new ObjectId("e"),
			new ObjectId("f"),
			new ObjectId("g"),
			new ObjectId("h"),
		];
		const subjectiveScouters = [
			new ObjectId("a"),
			new ObjectId("b"),
			new ObjectId("c"),
			new ObjectId("d"),
			new ObjectId("e"),
			new ObjectId("f"),
			new ObjectId("g"),
			new ObjectId("h"),
		];

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
		const scouters = [
			new ObjectId("a"),
			new ObjectId("b"),
			new ObjectId("c"),
			new ObjectId("d"),
			new ObjectId("e"),
			new ObjectId("f"),
			new ObjectId("g"),
			new ObjectId("h"),
		];
		const subjectiveScouters = [
			new ObjectId("a"),
			new ObjectId("b"),
			new ObjectId("c"),
			new ObjectId("d"),
			new ObjectId("e"),
			new ObjectId("f"),
			new ObjectId("g"),
			new ObjectId("h"),
		];

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
		league: League = League.FRC,
	): Promise<{
		db: InMemoryDbInterface;
		team: Team;
		comp: Competition;
		matches: Match[];
		reports: Report[];
	}> {
		const db = new InMemoryDbInterface();

		let team = new Team("test", "test", undefined, 1, league);
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
				league === League.FRC ? [0, 1, 2] : [0, 1],
				league === League.FRC ? [3, 4, 5] : [2, 3],
			);
			match._id = new ObjectId() as any;

			const matchReports = Array.from(
				{ length: league === League.FRC ? 6 : 4 },
				(_, i) => ({
					...new Report(
						undefined,
						{} as any,
						[0, 1, 2, 3, 4, 5][i],
						AllianceColor.Blue,
						match._id!,
					),
					_id: new ObjectId() as any,
				}),
			);

			match.reports = matchReports.map((r) => r._id!);

			matches.push(match);
			reports.push(...matchReports);
		}

		// Add the matches and reports to the database
		await Promise.all([
			...matches.map((m) => db.addObject(CollectionId.Matches, m)),
			...reports.map((r) => db.addObject(CollectionId.Reports, r)),
		]);

		const comp = new Competition("test", "test", undefined, 1, 1, undefined, undefined, new ObjectId());
		// The game doesn't matter, just which league it's for
		comp.gameId = league === League.FRC ? GameId.Crescendo : GameId.CenterStage;
		comp.matches = matches.map((m) => m._id!);
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

	test("Assigns scouters if team is FTC", async () => {
		const { db, team, comp, matches, reports } = await createTestComp(
			10,
			false,
			League.FTC,
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

describe(generateReportsForMatch.name, () => {
	async function createMatch(robotsPerAlliance: number = 3) {
		const match = new Match(
			1,
			"1",
			undefined,
			0,
			MatchType.Qualifying,
			Array.from({ length: robotsPerAlliance }, (_, i) => i),
			Array.from(
				{ length: robotsPerAlliance },
				(_, i) => i + robotsPerAlliance,
			),
		);
		match._id = new ObjectId() as any;

		const reports = Array.from({ length: robotsPerAlliance * 2 }, (_, i) => ({
			...new Report(
				undefined,
				{} as any,
				Array.from({ length: robotsPerAlliance * 2 }, (_, i) => i)[i],
				AllianceColor.Blue,
				match._id!,
			),
			_id: new ObjectId() as any,
		}));
		match.reports = reports.map((r) => r._id!);

		const db = new InMemoryDbInterface();
		await Promise.all([
			db.addObject(CollectionId.Matches, match),
			...reports.map((r) => db.addObject(CollectionId.Reports, r)),
		]);

		return { match, reports, db };
	}

	test("Generates reports for match", async () => {
		const { match, reports, db } = await createMatch();

		await generateReportsForMatch(db, match, GameId.Crescendo);

		const updatedReports = await Promise.all(
			reports.map((r) =>
				db.findObjectById(CollectionId.Reports, new ObjectId(r._id)),
			),
		);

		for (const report of updatedReports) {
			expect(report).toBeDefined();
		}
	});

	test("Does not generate new reports if reports already exist", async () => {
		const { match, reports, db } = await createMatch();

		const prevReportCount = await db.countObjects(CollectionId.Reports, {});

		await generateReportsForMatch(db, match, GameId.Crescendo);

		expect(await db.countObjects(CollectionId.Reports, {})).toBe(
			prevReportCount,
		);
	});

	test("Generates reports if no reports are present", async () => {
		const { match, reports, db } = await createMatch();

		for (const report of reports) {
			await db.deleteObjectById(CollectionId.Reports, new ObjectId(report._id));
		}

		await generateReportsForMatch(db, match, GameId.Crescendo);

		const [updatedReports, updatedMatch] = await Promise.all([
			db.findObjects(CollectionId.Reports, {
				match: match._id,
			}),
			db.findObjectById(CollectionId.Matches, new ObjectId(match._id)),
		]);

		expect(updatedReports.every((r) => r !== undefined)).toBe(true);
		expect(updatedReports.length).toBe(6);
		expect(updatedMatch?.reports.length).toBe(6);
		for (const report of updatedReports) {
			expect(report?.match).toBe(match._id);
			expect(match.reports).toContain(report?._id);
		}
	});

	test("Generates new reports if some reports are missing", async () => {
		const { match, reports, db } = await createMatch();

		const reportToDelete = reports[0];
		await db.deleteObjectById(
			CollectionId.Reports,
			new ObjectId(reportToDelete._id),
		);

		await generateReportsForMatch(db, match, GameId.Crescendo);

		const [updatedReports, updatedMatch] = await Promise.all([
			db.findObjects(CollectionId.Reports, {
				match: match._id,
			}),
			db.findObjectById(CollectionId.Matches, new ObjectId(match._id)),
		]);

		expect(updatedReports.every((r) => r !== undefined)).toBe(true);
		expect(updatedReports.length).toBe(6);
		expect(updatedMatch?.reports.length).toBe(6);
		for (const report of updatedReports) {
			expect(report?.match).toBe(match._id);
			// I couldn't get toContain to work, some issue with === vs ==
			expect(
				match.reports.some((r) => r == report._id),
			).toBeTruthy();
		}
	});

	test("Does not change existing reports", async () => {
		const { match, reports, db } = await createMatch();

		await generateReportsForMatch(db, match, GameId.Crescendo);

		const updatedReports = await Promise.all(
			reports.map((r) =>
				db.findObjectById(CollectionId.Reports, new ObjectId(r._id)),
			),
		);

		for (const report of updatedReports) {
			expect(report).toBeDefined();
			expect(report).toEqual(
				reports.find((r) => r._id === report?._id),
			);
		}
	});

	test("Generates reports for match with 4 robots", async () => {
		const { match, reports, db } = await createMatch(2);

		await generateReportsForMatch(db, match, GameId.CenterStage);

		const updatedReports = await Promise.all(
			reports.map((r) =>
				db.findObjectById(CollectionId.Reports, new ObjectId(r._id)),
			),
		);

		expect(updatedReports.length).toBe(4);
		for (const report of updatedReports) {
			expect(report).toBeDefined();
		}
	});
});
