import InMemoryDbInterface from "@/lib/client/dbinterfaces/InMemoryDbInterface";
import slugToId, { findObjectBySlugLookUp } from "@/lib/slugToId";
import { ObjectId } from "bson";

beforeEach(() => {
	global.slugLookup = new Map();
});

async function getDb() {
	const db = new InMemoryDbInterface();
	await db.init();
	return db;
}

describe(slugToId.name, () => {
	test("Returns ID if slug/id pair is not cached", async () => {
		const db = await getDb();

		const slug = "slug";
		const id = new ObjectId();

		await db.addObject("collection" as any, { _id: id, slug });

		const slugLookup = (await slugToId(db, "collection" as any, slug)).id;

		expect(slugLookup).toStrictEqual(id);
	});

	test("Returns ID if slug/id pair is cached", async () => {
		const db = await getDb();

		const slug = "slug";
		const id = new ObjectId();

		global.slugLookup = new Map();
		global.slugLookup.set("collection" as any, new Map());
		global.slugLookup.get("collection" as any)!.set(slug, id);

		const slugLookup = (await slugToId(db, "collection" as any, slug)).id;

		expect(await slugLookup).toStrictEqual(id);
	});
});

describe(findObjectBySlugLookUp.name, () => {
	test("Returns object when slug/id pair is not cached", async () => {
		const db = await getDb();

		const slug = "slug";
		const id = new ObjectId();

		await db.addObject("collection" as any, { _id: id, slug });

		const obj = await findObjectBySlugLookUp(db, "collection" as any, slug);

		expect(obj).toStrictEqual({ _id: id, slug });
	});

	test("Returns object when slug/id pair is cached", async () => {
		const db = await getDb();

		const slug = "slug";
		const id = new ObjectId();

		global.slugLookup = new Map();
		global.slugLookup.set("collection" as any, new Map());
		global.slugLookup.get("collection" as any)!.set(slug, id);

		await db.addObject("collection" as any, { _id: id, slug });

		const obj = await findObjectBySlugLookUp(db, "collection" as any, slug);

		expect(obj).toStrictEqual({ _id: id, slug });
	});
});
