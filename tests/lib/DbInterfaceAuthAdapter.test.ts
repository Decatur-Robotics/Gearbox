import CollectionId from "@/lib/client/CollectionId";
import InMemoryDbInterface from "@/lib/client/dbinterfaces/InMemoryDbInterface";
import DbInterfaceAuthAdapter from "@/lib/DbInterfaceAuthAdapter";
import { getTestRollbar } from "@/lib/testutils/TestUtils";
import { _id } from "@next-auth/mongodb-adapter";
import { ObjectId } from "bson";
import { Account } from "next-auth";

const prototype = DbInterfaceAuthAdapter(undefined as any, undefined as any);

async function getDeps() {
	const db = new InMemoryDbInterface();
	await db.init();

	const rollbar = getTestRollbar();

	return {
		adapter: DbInterfaceAuthAdapter(Promise.resolve(db), rollbar),
		db,
		rollbar,
	};
}

describe(prototype.createUser.name, () => {
	test("Adds a user to the database", async () => {
		const { db, adapter } = await getDeps();

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
		const { db, adapter } = await getDeps();

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
		const { db, adapter } = await getDeps();

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
		const { db, adapter } = await getDeps();

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
		const { db, adapter } = await getDeps();

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
		const { adapter } = await getDeps();

		const foundUser = await adapter.getUser!("1234567890123456789012345");

		expect(foundUser).toBeNull();
	});

	test("Errors if the user doesn't exist", async () => {
		const { adapter, rollbar } = await getDeps();

		await expect(adapter.getUser!(new ObjectId().toString())).rejects.toThrow();
		expect(rollbar.error).toHaveBeenCalled();
	});
});

describe(prototype.getUserByEmail!.name, () => {
	test("Returns a user from the database", async () => {
		const { db, adapter } = await getDeps();

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
		const { db, adapter } = await getDeps();

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

	test("Errors if the user doesn't exist", async () => {
		const { adapter, rollbar } = await getDeps();

		await expect(adapter.getUserByEmail!("test@gmail.com")).rejects.toThrow();
		expect(rollbar.error).toHaveBeenCalled();
	});
});

describe(prototype.getUserByAccount!.name, () => {
	test("Returns a user from the database", async () => {
		const { db, adapter } = await getDeps();

		const user = {
			name: "Test User",
			email: "test@gmail.com",
		};

		const { _id, ...addedUser } = await db.addObject(
			CollectionId.Users,
			user as any,
		);

		const account: Account = {
			provider: "test",
			type: "oauth",
			providerAccountId: "1234567890",
			userId: _id,
		};

		await db.addObject(CollectionId.Accounts, account);

		const foundUser = await adapter.getUserByAccount!(account);

		expect(foundUser).toMatchObject(addedUser);
	});

	test("Errors if the account doesn't exist", async () => {
		const { adapter, rollbar } = await getDeps();

		const account: Account = {
			provider: "test",
			type: "oauth",
			providerAccountId: "1234567890",
			userId: new ObjectId() as any,
		};

		await expect(adapter.getUserByAccount!(account)).rejects.toThrow();
		expect(rollbar.error).toHaveBeenCalled();
	});

	test("Errors if the user doesn't exist", async () => {
		const { adapter, db, rollbar } = await getDeps();

		const account: Account = {
			provider: "test",
			type: "oauth",
			providerAccountId: "1234567890",
			userId: new ObjectId() as any,
		};

		await db.addObject(CollectionId.Accounts, account);

		await expect(adapter.getUserByAccount!(account)).rejects.toThrow();
		expect(rollbar.error).toHaveBeenCalled();
	});
});

describe(prototype.updateUser!.name, () => {
	test("Updates a user in the database", async () => {
		const { db, adapter } = await getDeps();

		const user = {
			_id: new ObjectId(),
			name: "Test User",
			email: "test@gmail.com",
		};

		const addedUser = await db.addObject(CollectionId.Users, user as any);

		const updatedUser = {
			_id: addedUser._id,
			id: addedUser._id!.toString(),
			name: "Updated User",
		};

		await adapter.updateUser!(updatedUser);

		const foundUser = await db.findObject(CollectionId.Users, {
			email: user.email,
		});

		expect(foundUser).toMatchObject(updatedUser);
	});

	test("Errors if not given an _id", async () => {
		const { adapter, rollbar } = await getDeps();

		const user = {
			name: "Test User",
			email: "test@gmail.com",
		};

		await expect(adapter.updateUser!(user as any)).rejects.toThrow();
		expect(rollbar.error).toHaveBeenCalled();
	});

	test("Errors if the user doesn't exist", async () => {
		const { adapter, rollbar } = await getDeps();

		const user = {
			name: "Test User",
			email: "test@gmail.com",
		};

		await expect(adapter.updateUser!(user as any)).rejects.toThrow();
		expect(rollbar.error).toHaveBeenCalled();
	});

	test("Returns the updated user without their _id", async () => {
		const { db, adapter } = await getDeps();

		const user = {
			name: "Test User",
			email: "test@gmail.com",
		};

		const { _id, ...addedUser } = await db.addObject(
			CollectionId.Users,
			user as any,
		);

		const updatedUser = {
			_id,
			name: "Updated User",
		};

		const returnedUser = await adapter.updateUser!(updatedUser as any);
		const { _id: _, ...expectedUser } = { ...addedUser, ...updatedUser };

		expect(returnedUser).toMatchObject(expectedUser);
	});

	test("Errors if no _id is provided", async () => {
		const { adapter, db, rollbar } = await getDeps();

		const user = {
			name: "Test User",
			email: "test@gmail.com",
		};

		await db.addObject(CollectionId.Users, user as any);

		await expect(
			adapter.updateUser!({ name: "Test User 2" } as any),
		).rejects.toThrow();
		expect(rollbar.error).toHaveBeenCalled();
	});
});

describe(prototype.deleteUser!.name, () => {
	test("Deletes a user from the database", async () => {
		const { db, adapter } = await getDeps();

		const user = {
			_id: new ObjectId(),
			name: "Test User",
			email: "test@gmail.com",
		};

		await db.addObject(CollectionId.Users, user as any);

		await adapter.deleteUser!(user._id.toString());

		const foundUser = await db.findObject(CollectionId.Users, {
			email: user.email,
		});

		expect(foundUser).toBeUndefined();
	});

	test("Errors if the user doesn't exist", async () => {
		const { adapter, rollbar } = await getDeps();

		await expect(
			adapter.deleteUser!(new ObjectId().toString()),
		).rejects.toThrow();
		expect(rollbar.error).toHaveBeenCalled();
	});

	test("Deletes the user's account", async () => {
		const { db, adapter } = await getDeps();

		const user = {
			_id: new ObjectId(),
			name: "Test User",
			email: "test@gmail.com",
		};

		const account: Account = {
			provider: "test",
			type: "oauth",
			providerAccountId: "1234567890",
			userId: user._id as any,
		};

		await Promise.all([
			db.addObject(CollectionId.Users, user as any),
			db.addObject(CollectionId.Accounts, account),
		]);

		await adapter.deleteUser!(user._id.toString());

		const foundAccount = await db.findObject(CollectionId.Accounts, {
			_id: account._id,
		});

		expect(foundAccount).toBeUndefined();
	});

	test("Deletes the user's sessions", async () => {
		const { db, adapter } = await getDeps();

		const user = {
			_id: new ObjectId(),
			name: "Test User",
			email: "test@gmail.com",
		};

		const sessions = [1, 2, 3].map((i) => ({
			_id: new ObjectId(),
			userId: user._id,
			expires: new Date(),
		}));

		await Promise.all([
			db.addObject(CollectionId.Users, user as any),
			...sessions.map((session) =>
				db.addObject(CollectionId.Sessions, session as any),
			),
		]);

		await adapter.deleteUser!(user._id.toString());

		const foundSessions = await db.findObjects(CollectionId.Sessions, {
			userId: user._id,
		});

		expect(foundSessions).toHaveLength(0);
	});
});

describe(prototype.linkAccount!.name, () => {
	test("Links an account to a user", async () => {
		const { db, adapter } = await getDeps();

		const user = {
			_id: new ObjectId(),
			name: "Test User",
			email: "test@gmail.com",
		};

		const account: Account = {
			_id: new ObjectId(),
			provider: "test",
			type: "oauth",
			providerAccountId: "1234567890",
			userId: user._id as any,
		};

		await db.addObject(CollectionId.Users, user as any);

		await adapter.linkAccount(account);

		const foundAccount = await db.findObject(CollectionId.Accounts, {
			provider: account.provider,
			providerAccountId: account.providerAccountId,
		});

		expect(foundAccount).toEqual(account);
	});

	test("Warns if the account already exists", async () => {
		const { adapter, db, rollbar } = await getDeps();

		const account: Account = {
			_id: new ObjectId(),
			provider: "test",
			type: "oauth",
			providerAccountId: "1234567890",
			userId: new ObjectId() as any,
		};

		await db.addObject(CollectionId.Accounts, account);

		await adapter.linkAccount!(account);

		expect(rollbar.warn).toHaveBeenCalled();
	});

	test("Does not create another account if one already exists", async () => {
		const { db, adapter } = await getDeps();

		const user = {
			_id: new ObjectId(),
			name: "Test User",
			email: "test@gmail.com",
		};

		const account: Account = {
			_id: new ObjectId(),
			provider: "test",
			type: "oauth",
			providerAccountId: "1234567890",
			userId: user._id as any,
		};

		await Promise.all([
			db.addObject(CollectionId.Users, user as any),
			db.addObject(CollectionId.Accounts, account),
		]);

		await adapter.linkAccount(account);

		const foundAccounts = await db.findObjects(CollectionId.Accounts, {
			provider: account.provider,
			providerAccountId: account.providerAccountId,
		});

		expect(foundAccounts).toHaveLength(1);
	});
});
