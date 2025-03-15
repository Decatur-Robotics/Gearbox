import { deleteReport } from "@/lib/api/ApiUtils";
import CollectionId from "@/lib/client/CollectionId";
import { getTestApiUtils } from "@/lib/testutils/TestUtils";
import { ObjectId } from "bson";
import { Match, Report } from "@/lib/Types";
import { _id } from "@next-auth/mongodb-adapter";

describe(deleteReport.name, () => {
	test("Deletes the report", async () => {
		const { db } = await getTestApiUtils();

		const id = new ObjectId();
		await db.addObject(CollectionId.Reports, {
			_id: id,
		} as any as Report);

		const match = {
			reports: [id.toString()],
		} as any as Match;
		await db.addObject(CollectionId.Matches, match);

		await deleteReport(db, id.toString(), match);

		const found = await db.findObject(CollectionId.Reports, {
			_id: id,
		});

		expect(found).toBeUndefined();
		expect(await db.countObjects(CollectionId.Reports, {})).toBe(0);
	});

	test("Removes the report from the match", async () => {
		const { db } = await getTestApiUtils();

		const id = new ObjectId();
		await db.addObject(CollectionId.Reports, {
			_id: id,
		} as any as Report);

		const match = {
			_id: new ObjectId(),
			reports: [id.toString()],
		} as any as Match;
		await db.addObject(CollectionId.Matches, match);

		await deleteReport(db, id.toString(), match);

		const updatedMatch = await db.findObjectById(
			CollectionId.Matches,
			match._id as any,
		);

		expect(updatedMatch?.reports.length).toBe(0);
	});
});
