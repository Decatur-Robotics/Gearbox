import CollectionId from "@/lib/client/CollectionId";
import InMemoryDbInterface from "@/lib/client/dbinterfaces/InMemoryDbInterface";
import DbInterfaceAuthAdapter from "@/lib/DbInterfaceAuthAdapter";
import { getTestRollbar } from "@/lib/testutils/TestUtils";
import { _id } from "@next-auth/mongodb-adapter";
import { ObjectId } from "bson";
import { get } from "http";

const prototype = DbInterfaceAuthAdapter(undefined as any, undefined as any);

async function getAdapterAndDb() {
	const db = new InMemoryDbInterface();
	await db.init();

	return {
		adapter: DbInterfaceAuthAdapter(Promise.resolve(db), getTestRollbar()),
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

	test("Populates fields with default values", async () => {
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

		expect(foundUser?.name).toBeDefined();
		expect(foundUser?.email).toBeDefined();
		expect(foundUser?.image).toBeDefined;
		expect(foundUser?.admin).toBeDefined();
		expect(foundUser?.slug).toBeDefined();
		expect(foundUser?.teams).toBeDefined();
		expect(foundUser?.owner).toBeDefined();
		expect(foundUser?.level).toBeDefined();
		expect(foundUser?.xp).toBeDefined();
	});

	test("Populates missing fields with defaults", async () => {
		const { db, adapter } = await getAdapterAndDb();

		const user = {
			email: "test@gmail.com",
		};

		await adapter.createUser(user);

		const foundUser = await db.findObject(CollectionId.Users, {
			email: user.email,
		});

		expect(foundUser?.name).toBeDefined();
		expect(foundUser?.image).toBeDefined();
	});

	test("Does not create a new user if one already exists", async () => {
		const { db, adapter } = await getAdapterAndDb();

		const user = {
			email: "test@gmail.com",
		};

		await adapter.createUser(user);
		await adapter.createUser(user);

		expect(
			await db.countObjects(CollectionId.Users, { email: user.email }),
		).toBe(1);
	});
});

describe(prototype.getUser!.name, () => {
	test("Returns a user from the database without their _id", async () => {
		const { db, adapter } = await getAdapterAndDb();

		const user = {
			_id: new ObjectId(),
			name: "Test User",
			email: "test@gmail.com",
			image: "test.png",
		};

		await db.addObject(CollectionId.Users, user as any);

		const foundUser = await adapter.getUser!(user._id.toString());

		const { _id, ...userWithoutId } = user;

		expect(foundUser).toMatchObject(userWithoutId);
	});

	test("Returns null if given an id of the wrong length", async () => {
		const { adapter } = await getAdapterAndDb();

		const foundUser = await adapter.getUser!("1234567890123456789012345");

		expect(foundUser).toBeNull();
	});

	test("Returns null if the user doesn't exist", async () => {
		const { adapter } = await getAdapterAndDb();

		const foundUser = await adapter.getUser!(new ObjectId().toString());

		expect(foundUser).toBeNull();
	});
});

describe(prototype.getUserByEmail!.name, () => {
	test("Returns a user from the database", async () => {
		const { db, adapter } = await getAdapterAndDb();

		const user = {
			name: "Test User",
			email: "test@gmail.com",
		};

		const { _id, ...addedUser } = await db.addObject(
			CollectionId.Users,
			user as any,
		);

		const foundUser = await adapter.getUserByEmail!(user.email);

		expect(foundUser).toMatchObject(addedUser);
	});

	test("Returns user without their _id", async () => {
		const { db, adapter } = await getAdapterAndDb();

		const user = {
			_id: new ObjectId(),
			name: "Test User",
			email: "test@gmail.com",
		};

		await db.addObject(CollectionId.Users, user as any);

		const foundUser = await adapter.getUserByEmail!(user.email);

		const { _id, ...userWithoutId } = user;

		expect(foundUser).toMatchObject(userWithoutId);
	});
});
