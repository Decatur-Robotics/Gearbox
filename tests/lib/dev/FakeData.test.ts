import CollectionId from "@/lib/client/CollectionId";
import InMemoryDbInterface from "@/lib/client/dbinterfaces/InMemoryDbInterface";
import { fakeUser, fillTeamWithFakeUsers } from "@/lib/dev/FakeData";
import { Team, User } from "@/lib/Types";
import { ObjectId } from "bson";

describe(fakeUser.name, () => {
	test("Returns a fake user", async () => {
		const db = new InMemoryDbInterface();

		const user = await fakeUser(db, new ObjectId());

		expect(user).toBeInstanceOf(Object);

		expect(user.name).not.toBeUndefined();
		expect(user.email).not.toBeUndefined();
		expect(user.image).not.toBeUndefined();
	});

	test("Returns a user with a team when a team ID is passed", async () => {
		const db = new InMemoryDbInterface();

		const teamId = new ObjectId();
		const user = await fakeUser(db, teamId);

		expect(user.teams.length).toBe(1);
		expect(user.teams).toContain(teamId);
	});

	test("Returns a user without a team when no team ID is passed", async () => {
		const db = new InMemoryDbInterface();

		const user = await fakeUser(db, undefined);

		expect(user.teams.length).toBe(0);
	});

	test("Adds the user to the database", async () => {
		const db = new InMemoryDbInterface();

		const teamId = new ObjectId();
		const returnedUser = await fakeUser(db, teamId);
		const dbUser = await db.findObject(CollectionId.Users, {
			teams: [teamId],
		});

		expect(returnedUser).toEqual(dbUser);
	});

	test("User name is random", async () => {
		const db = new InMemoryDbInterface();

		const userPromises: Promise<User>[] = [];
		for (let i = 0; i < 10; i++) {
			userPromises.push(fakeUser(db, undefined));
		}

		const users = await Promise.all(userPromises);

		const uniqueNames = new Set(users.map((user) => user.name));

		expect(uniqueNames.size).toBeGreaterThan(users.length / 2);
	});
});

describe(fillTeamWithFakeUsers.name, () => {
	test("Returns a team with fake users", async () => {
		const db = new InMemoryDbInterface();

		const originalTeam = await db.addObject(
			CollectionId.Teams,
			new Team("Test Team", "test", undefined, 1),
		);

		const newTeam = await fillTeamWithFakeUsers(3, originalTeam._id, db);

		expect(newTeam.users.length).toBe(3);
	});

	test("Adds the users to the database", async () => {
		const db = new InMemoryDbInterface();

		const originalTeam = await db.addObject(
			CollectionId.Teams,
			new Team("Test Team", "test", undefined, 1),
		);

		const newTeam = await fillTeamWithFakeUsers(3, originalTeam._id, db);

		const users = await db.findObjects(CollectionId.Users, {
			teams: [newTeam._id],
		});

		expect(users.length).toBe(3);
		expect(newTeam.users).toEqual(users.map((user) => user._id));
	});

	test("Adds users as scouters", async () => {
		const db = new InMemoryDbInterface();

		const originalTeam = await db.addObject(
			CollectionId.Teams,
			new Team("Test Team", "test", undefined, 1),
		);

		const newTeam = await fillTeamWithFakeUsers(3, originalTeam._id, db);

		const users = await db.findObjects(CollectionId.Users, {
			teams: [newTeam._id],
		});

		expect(newTeam.scouters).toEqual(users.map((user) => user._id));
	});

	test("Throws an error if the team is not found", async () => {
		const db = new InMemoryDbInterface();

		await expect(fillTeamWithFakeUsers(3, new ObjectId(), db)).rejects.toThrow(
			"Team not found",
		);
	});

	test("Names are random", async () => {
		const db = new InMemoryDbInterface();

		const originalTeam = await db.addObject(
			CollectionId.Teams,
			new Team("Test Team", "test", undefined, 1),
		);

		const newTeam = await fillTeamWithFakeUsers(3, originalTeam._id, db);

		const users = await db.findObjects(CollectionId.Users, {
			teams: [newTeam._id],
		});

		const uniqueNames = new Set(users.map((user) => user.name));

		expect(uniqueNames.size).toBeGreaterThan(users.length / 2);
	});
});
