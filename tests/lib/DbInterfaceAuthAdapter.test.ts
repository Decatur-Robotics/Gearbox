import CollectionId from "@/lib/client/CollectionId";
import InMemoryDbInterface from "@/lib/client/dbinterfaces/InMemoryDbInterface";
import DbInterfaceAuthAdapter from "@/lib/DbInterfaceAuthAdapter";
import { get } from "http";

const prototype = DbInterfaceAuthAdapter(undefined as any);

async function getDatabase() {}

async function getAdapterAndDb() {
	const db = new InMemoryDbInterface();
	await db.init();

	return {
		adapter: DbInterfaceAuthAdapter(Promise.resolve(db)),
		db,
	};
}

describe(prototype.createUser.name, () => {
	test("Adds a user to the database", async () => {
		const { db, adapter } = await getAdapterAndDb();

		const user = {
			name: "Test User",
			email: "test@gmail.com",
			image: "test.png",
		};

		await adapter.createUser(user);

		const foundUser = await db.findObject(CollectionId.Users, {
			email: user.email,
		});

		expect(foundUser).toMatchObject(user);
	});
});
