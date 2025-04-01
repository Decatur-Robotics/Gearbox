import {
	deleteComp,
	deleteMatch,
	deletePitReport,
	deleteReport,
	deleteSeason,
	deleteSubjectiveReport,
} from "@/lib/api/ApiUtils";
import CollectionId from "@/lib/client/CollectionId";
import {
	createTestDocuments,
	getTestApiUtils,
} from "@/lib/testutils/TestUtils";
import { _id } from "@next-auth/mongodb-adapter";

describe(deleteReport.name, () => {
	test("Deletes the report", async () => {
		const { db } = await getTestApiUtils();

		const { report, match } = await createTestDocuments(db);

		await deleteReport(db, report._id!, match);

		const found = await db.findObjectById(
			CollectionId.Reports,
			report._id! as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.Reports, {})).toBe(0);
	});

	test("Removes the report from the match", async () => {
		const { db } = await getTestApiUtils();

		const { report, match } = await createTestDocuments(db);

		await deleteReport(db, report._id!, match);

		const updatedMatch = await db.findObjectById(
			CollectionId.Matches,
			match._id as any,
		);

		expect(updatedMatch?.reports.length).toBe(0);
	});

	test("Does not fail if not given a match", async () => {
		const { db } = await getTestApiUtils();

		const { report } = await createTestDocuments(db);

		await deleteReport(db, report._id!);

		const found = await db.findObjectById(
			CollectionId.Reports,
			report._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.Reports, {})).toBe(0);
	});

	test("Does not remove report from match if not given a match", async () => {
		const { db } = await getTestApiUtils();

		const { report, match } = await createTestDocuments(db);

		await deleteReport(db, report._id!);

		const updatedMatch = await db.findObjectById(
			CollectionId.Matches,
			match._id as any,
		);

		expect(updatedMatch?.reports).toStrictEqual([report._id]);
	});
});

describe(deleteSubjectiveReport.name, () => {
	test("Deletes the report", async () => {
		const { db } = await getTestApiUtils();

		const { subjectiveReport, match } = await createTestDocuments(db);

		await deleteSubjectiveReport(db, subjectiveReport._id!, match);

		const found = await db.findObjectById(
			CollectionId.SubjectiveReports,
			subjectiveReport._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.SubjectiveReports, {})).toBe(0);
	});

	test("Removes the report from the match", async () => {
		const { db } = await getTestApiUtils();

		const { subjectiveReport, match } = await createTestDocuments(db);

		await deleteSubjectiveReport(db, subjectiveReport._id!, match);

		const updatedMatch = await db.findObjectById(
			CollectionId.Matches,
			match._id as any,
		);

		expect(updatedMatch?.subjectiveReports.length).toBe(0);
	});

	test("Does not fail if not given a match", async () => {
		const { db } = await getTestApiUtils();

		const { subjectiveReport } = await createTestDocuments(db);

		await deleteSubjectiveReport(db, subjectiveReport._id!);

		const found = await db.findObjectById(
			CollectionId.SubjectiveReports,
			subjectiveReport._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.SubjectiveReports, {})).toBe(0);
	});

	test("Does not remove report from match if not given a match", async () => {
		const { db } = await getTestApiUtils();

		const { subjectiveReport, match } = await createTestDocuments(db);

		await deleteSubjectiveReport(db, subjectiveReport._id!);

		const updatedMatch = await db.findObjectById(
			CollectionId.Matches,
			match._id as any,
		);

		expect(updatedMatch?.subjectiveReports).toStrictEqual([
			subjectiveReport._id,
		]);
	});
});

describe(deleteMatch.name, () => {
	test("Deletes the match", async () => {
		const { db } = await getTestApiUtils();

		const { match } = await createTestDocuments(db);

		await deleteMatch(db, match._id!);

		const found = await db.findObjectById(
			CollectionId.Matches,
			match._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.Matches, {})).toBe(0);
	});

	test("Removes the match from the competition", async () => {
		const { db } = await getTestApiUtils();
		const { match, comp } = await createTestDocuments(db);

		await deleteMatch(db, match._id!, comp);

		const updatedComp = await db.findObjectById(
			CollectionId.Competitions,
			comp._id as any,
		);

		expect(updatedComp?.matches.length).toBe(0);
	});

	test("Does not fail if not given a competition", async () => {
		const { db } = await getTestApiUtils();
		const { match } = await createTestDocuments(db);

		await deleteMatch(db, match._id!);

		const found = await db.findObjectById(
			CollectionId.Matches,
			match._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.Matches, {})).toBe(0);
	});

	test("Does not remove match from competition if not given a competition", async () => {
		const { db } = await getTestApiUtils();
		const { match, comp } = await createTestDocuments(db);

		await deleteMatch(db, match._id!);

		const updatedComp = await db.findObjectById(
			CollectionId.Competitions,
			comp._id as any,
		);

		expect(updatedComp?.matches).toStrictEqual([match._id]);
	});

	test("Deletes reports", async () => {
		const { db } = await getTestApiUtils();
		const { match, report } = await createTestDocuments(db);

		await deleteMatch(db, match._id!);

		const found = await db.findObjectById(
			CollectionId.Reports,
			report._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.Reports, {})).toBe(0);
	});

	test("Deletes subjective reports", async () => {
		const { db } = await getTestApiUtils();
		const { match, subjectiveReport } = await createTestDocuments(db);

		await deleteMatch(db, match._id!);

		const found = await db.findObjectById(
			CollectionId.SubjectiveReports,
			subjectiveReport._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.SubjectiveReports, {})).toBe(0);
	});
});

describe(deletePitReport.name, () => {
	test("Deletes the pit report", async () => {
		const { db } = await getTestApiUtils();
		const { pitReport, comp } = await createTestDocuments(db);

		await deletePitReport(db, pitReport._id!, comp);

		const found = await db.findObjectById(
			CollectionId.PitReports,
			pitReport._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.PitReports, {})).toBe(0);
	});

	test("Removes the pit report from the competition", async () => {
		const { db } = await getTestApiUtils();
		const { pitReport, comp } = await createTestDocuments(db);

		await deletePitReport(db, pitReport._id!, comp);

		const updatedComp = await db.findObjectById(
			CollectionId.Competitions,
			comp._id as any,
		);

		expect(updatedComp?.pitReports.length).toBe(0);
	});

	test("Does not fail if not given a competition", async () => {
		const { db } = await getTestApiUtils();
		const { pitReport } = await createTestDocuments(db);

		await deletePitReport(db, pitReport._id!);

		const found = await db.findObjectById(
			CollectionId.PitReports,
			pitReport._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.PitReports, {})).toBe(0);
	});

	test("Does not remove pit report from competition if not given a competition", async () => {
		const { db } = await getTestApiUtils();
		const { pitReport, comp } = await createTestDocuments(db);

		await deletePitReport(db, pitReport._id!);

		const updatedComp = await db.findObjectById(
			CollectionId.Competitions,
			comp._id as any,
		);

		expect(updatedComp?.pitReports).toStrictEqual([pitReport._id]);
	});
});

describe(deleteComp.name, () => {
	test("Deletes the competition", async () => {
		const { db } = await getTestApiUtils();
		const { comp } = await createTestDocuments(db);

		await deleteComp(db, comp);

		const found = await db.findObjectById(
			CollectionId.Competitions,
			comp._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.Competitions, {})).toBe(0);
	});

	test("Deletes matches", async () => {
		const { db } = await getTestApiUtils();
		const { match, comp } = await createTestDocuments(db);

		await deleteComp(db, comp);

		const found = await db.findObjectById(
			CollectionId.Matches,
			match._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.Matches, {})).toBe(0);
	});

	test("Deletes reports", async () => {
		const { db } = await getTestApiUtils();
		const { report, comp } = await createTestDocuments(db);

		await deleteComp(db, comp);

		const found = await db.findObjectById(
			CollectionId.Reports,
			report._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.Reports, {})).toBe(0);
	});

	test("Deletes subjective reports", async () => {
		const { db } = await getTestApiUtils();
		const { subjectiveReport, comp } = await createTestDocuments(db);

		await deleteComp(db, comp);

		const found = await db.findObjectById(
			CollectionId.SubjectiveReports,
			subjectiveReport._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.SubjectiveReports, {})).toBe(0);
	});

	test("Deletes pit reports", async () => {
		const { db } = await getTestApiUtils();
		const { pitReport, comp } = await createTestDocuments(db);

		await deleteComp(db, comp);

		const found = await db.findObjectById(
			CollectionId.PitReports,
			pitReport._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.PitReports, {})).toBe(0);
	});
});

describe(deleteSeason.name, () => {
	test("Deletes the season", async () => {
		const { db } = await getTestApiUtils();
		const { season } = await createTestDocuments(db);

		await deleteSeason(db, season);

		const found = await db.findObjectById(
			CollectionId.Seasons,
			season._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.Seasons, {})).toBe(0);
	});

	test("Remove the season from the team", async () => {
		const { db } = await getTestApiUtils();
		const { season, team } = await createTestDocuments(db);

		await deleteSeason(db, season);

		const updatedTeam = await db.findObjectById(
			CollectionId.Teams,
			team._id as any,
		);

		expect(updatedTeam?.seasons.length).toBe(0);
	});

	test("Deletes competitions", async () => {
		const { db } = await getTestApiUtils();
		const { comp, season } = await createTestDocuments(db);

		await deleteSeason(db, season);

		const found = await db.findObjectById(
			CollectionId.Competitions,
			comp._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.Competitions, {})).toBe(0);
	});

	test("Deletes matches", async () => {
		const { db } = await getTestApiUtils();
		const { match, season } = await createTestDocuments(db);

		await deleteSeason(db, season);

		const found = await db.findObjectById(
			CollectionId.Matches,
			match._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.Matches, {})).toBe(0);
	});

	test("Deletes reports", async () => {
		const { db } = await getTestApiUtils();
		const { report, season } = await createTestDocuments(db);

		await deleteSeason(db, season);

		const found = await db.findObjectById(
			CollectionId.Reports,
			report._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.Reports, {})).toBe(0);
	});

	test("Deletes subjective reports", async () => {
		const { db } = await getTestApiUtils();
		const { subjectiveReport, season } = await createTestDocuments(db);

		await deleteSeason(db, season);

		const found = await db.findObjectById(
			CollectionId.SubjectiveReports,
			subjectiveReport._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.SubjectiveReports, {})).toBe(0);
	});

	test("Deletes pit reports", async () => {
		const { db } = await getTestApiUtils();
		const { pitReport, season } = await createTestDocuments(db);

		await deleteSeason(db, season);

		const found = await db.findObjectById(
			CollectionId.PitReports,
			pitReport._id as any,
		);

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.PitReports, {})).toBe(0);
	});
});
