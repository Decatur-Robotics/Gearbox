import CollectionId from "@/lib/client/CollectionId";
import InMemoryDbInterface from "@/lib/client/dbinterfaces/InMemoryDbInterface";
import DbInterfaceAuthAdapter from "@/lib/DbInterfaceAuthAdapter";
import { getTestRollbar } from "@/lib/testutils/TestUtils";
import { _id } from "@next-auth/mongodb-adapter";
import { ObjectId } from "bson";
import exp from "constants";
import { Account, Session } from "next-auth";
import { AdapterSession } from "next-auth/adapters";

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

	test("Returns null if the user doesn't exist", async () => {
		const { adapter, rollbar } = await getDeps();

		const user = await adapter.getUser!(new ObjectId().toString());

		expect(user).toBeNull();
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

	test("Returns null if the user doesn't exist", async () => {
		const { adapter, rollbar } = await getDeps();

		const user = await adapter.getUserByEmail!("test@gmail.com");

		expect(user).toBeNull();
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

		const foundUser = await adapter.getUserByAccount!({
			provider: account.provider,
			providerAccountId: account.providerAccountId,
		});

		expect(foundUser).toMatchObject(addedUser);
	});

	test("Returns null if the account doesn't exist", async () => {
		const { adapter, rollbar } = await getDeps();

		const account: Account = {
			provider: "test",
			type: "oauth",
			providerAccountId: "1234567890",
			userId: new ObjectId() as any,
		};

		const user = await adapter.getUserByAccount!({
			provider: account.provider,
			providerAccountId: account.providerAccountId,
		});

		expect(user).toBeNull();
	});

	test("Returns null if the user doesn't exist", async () => {
		const { adapter, db, rollbar } = await getDeps();

		const account: Account = {
			provider: "test",
			type: "oauth",
			providerAccountId: "1234567890",
			userId: new ObjectId() as any,
		};

		await db.addObject(CollectionId.Accounts, account);

		const user = await adapter.getUserByAccount!({
			provider: account.provider,
			providerAccountId: account.providerAccountId,
		});

		expect(user).toBeNull();
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

		// Not sure how id behaves, don't use it
		foundUser!.id = foundUser!._id!.toString();

		expect(foundUser).toMatchObject(updatedUser);
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

describe(prototype.unlinkAccount!.name, () => {
	test("Unlinks an account from a user", async () => {
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

		await adapter.unlinkAccount(account);

		const foundAccount = await db.findObject(CollectionId.Accounts, {
			provider: account.provider,
			providerAccountId: account.providerAccountId,
		});

		expect(foundAccount).toBeUndefined();
	});

	test("Returns null if the account doesn't exist", async () => {
		const { adapter } = await getDeps();

		const account: Account = {
			provider: "test",
			type: "oauth",
			providerAccountId: "1234567890",
			userId: new ObjectId() as any,
		};

		const returnedAccount = await adapter.unlinkAccount!(account);

		expect(returnedAccount).toBeNull();
	});

	test("Does not delete the user", async () => {
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

		await adapter.unlinkAccount(account);

		const foundUser = await db.findObject(CollectionId.Users, {
			email: user.email,
		});

		expect(foundUser).toEqual(user);
	});
});

describe(prototype.getSessionAndUser!.name, () => {
	test("Returns a session and user from the database", async () => {
		const { db, adapter } = await getDeps();

		const user = {
			name: "Test User",
			email: "test@gmail.com",
		};

		const { _id, ...addedUser } = await db.addObject(
			CollectionId.Users,
			user as any,
		);

		const session: AdapterSession = {
			sessionToken: "1234567890",
			userId: _id as any,
			expires: new Date(),
		};

		await db.addObject(CollectionId.Sessions, session as any);

		const sessionAndUser = await adapter.getSessionAndUser!(
			session.sessionToken,
		);

		expect(sessionAndUser?.session.sessionToken).toBe(session.sessionToken);
		expect(sessionAndUser?.user).toMatchObject(addedUser);
	});

	test("Returns null if the session doesn't exist", async () => {
		const { adapter } = await getDeps();

		const session = await adapter.getSessionAndUser!("1234567890");

		expect(session).toBeNull();
	});

	test("Returns null if the user doesn't exist", async () => {
		const { adapter, db, rollbar } = await getDeps();

		const session: AdapterSession = {
			sessionToken: "1234567890",
			userId: new ObjectId() as any,
			expires: new Date(),
		};

		await db.addObject(CollectionId.Sessions, session as any);

		const sessionAndUser = await adapter.getSessionAndUser!(
			session.sessionToken,
		);

		expect(sessionAndUser).toBeNull();
	});
});

describe(prototype.createSession!.name, () => {
	test("Creates a session in the database", async () => {
		const { db, adapter } = await getDeps();

		const user = {
			_id: new ObjectId(),
			name: "Test User",
			email: "test@gmail.com",
		};

		await db.addObject(CollectionId.Users, user as any);

		const session: AdapterSession = {
			sessionToken: "1234567890",
			userId: user._id as any,
			expires: new Date(),
		};

		await adapter.createSession!(session);

		const foundSession = await db.findObject(CollectionId.Sessions, {
			sessionToken: session.sessionToken,
		});

		expect(foundSession?.userId).toEqual(session.userId);
	});
});

describe(prototype.updateSession!.name, () => {
	test("Updates a session in the database", async () => {
		const { db, adapter } = await getDeps();

		const user = {
			_id: new ObjectId(),
			name: "Test User",
			email: "test@gmail.com",
		};
		const { _id: userId } = await db.addObject(CollectionId.Users, user as any);

		const session: AdapterSession = {
			sessionToken: "1234567890",
			userId: userId as any,
			expires: new Date(),
		};
		await db.addObject(CollectionId.Sessions, session as any);

		const updatedSession = {
			sessionToken: session.sessionToken,
			userId: new ObjectId() as any,
		};

		await adapter.updateSession!(updatedSession);

		const foundSession = await db.findObject(CollectionId.Sessions, {
			sessionToken: updatedSession.sessionToken,
		});

		expect(foundSession?.userId).toEqual(updatedSession.userId);
	});
});

describe(prototype.deleteSession!.name, () => {
	test("Deletes a session from the database", async () => {
		const { db, adapter } = await getDeps();

		const user = {
			_id: new ObjectId(),
			name: "Test User",
			email: "test@gmail.com",
		};

		const { _id: userId } = await db.addObject(CollectionId.Users, user as any);

		const session: AdapterSession = {
			sessionToken: "1234567890",
			userId: userId as any,
			expires: new Date(),
		};

		await db.addObject(CollectionId.Sessions, session as any);

		await adapter.deleteSession!(session.sessionToken);

		const foundSession = await db.findObject(CollectionId.Sessions, {
			sessionToken: session.sessionToken,
		});

		expect(foundSession).toBeUndefined();
	});

	test("Does not delete the user", async () => {
		const { db, adapter } = await getDeps();

		const user = {
			_id: new ObjectId(),
			name: "Test User",
			email: "test@gmail.com",
		};

		const { _id: userId } = await db.addObject(CollectionId.Users, user as any);

		const session: AdapterSession = {
			sessionToken: "1234567890",
			userId: userId as any,
			expires: new Date(),
		};

		await db.addObject(CollectionId.Sessions, session as any);

		await adapter.deleteSession!(session.sessionToken);

		const foundUser = await db.findObject(CollectionId.Users, {
			email: user.email,
		});

		expect(foundUser).toEqual(user);
	});
});

describe(prototype.createVerificationToken!.name, () => {
	test("Returns token", async () => {
		const testToken = {
			identifier: "hi",
			expires: new Date(),
			token: "hello",
		};
		const { adapter } = await getDeps();
		const returnToken = await adapter.createVerificationToken!(testToken);
		expect(returnToken).toBe(testToken);
	});

	test("Token is added to database", async () => {
		const testToken = {
			identifier: "hi",
			expires: new Date(),
			token: "hello",
		};
		const { adapter, db } = await getDeps();
		await adapter.createVerificationToken!(testToken);
		const foundToken = await db.findObject(CollectionId.VerificationTokens, {
			identifier: testToken.identifier,
		});
		expect(foundToken?.identifier).toBe(testToken.identifier);
		expect(foundToken?.token).toBe(testToken.token);
	});
});

describe(prototype.useVerificationToken!.name, () => {
	test("Returns token", async () => {
		const { adapter, db } = await getDeps();

		const testToken = {
			identifier: "hi",
			expires: new Date(),
			token: "hello",
		};
		await db.addObject(CollectionId.VerificationTokens, testToken);

		const foundToken = await adapter.useVerificationToken!({
			identifier: testToken.identifier,
			token: testToken.token,
		});

		expect(foundToken?.identifier).toBe(testToken.identifier);
		expect(foundToken?.token).toBe(testToken.token);
	});

	test("Token is removed from database", async () => {
		const { adapter, db } = await getDeps();

		const testToken = {
			identifier: "hi",
			expires: new Date(),
			token: "hello",
		};
		await db.addObject(CollectionId.VerificationTokens, testToken);

		await adapter.useVerificationToken!({
			identifier: testToken.identifier,
			token: testToken.token,
		});

		const foundToken = await db.findObject(CollectionId.VerificationTokens, {
			identifier: testToken.identifier,
			token: testToken.token,
		});

		expect(foundToken).toBeUndefined();
	});
});
