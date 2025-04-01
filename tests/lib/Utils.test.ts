import CollectionId from "@/lib/client/CollectionId";
import InMemoryDbInterface from "@/lib/client/dbinterfaces/InMemoryDbInterface";
import { User } from "@/lib/Types";
import {
	createRedirect,
	GenerateSlug,
	isDeveloper,
	mentionUserInSlack,
	repairUser,
} from "@/lib/Utils";
import { ObjectId } from "bson";

describe(GenerateSlug.name, () => {
	test("Removes whitespace and makes the name lowercase when DB is empty", async () => {
		const db = new InMemoryDbInterface();

		const collection = CollectionId.Misc;

		expect(await GenerateSlug(db, collection, "Test Name")).toBe("testname");
	});

	test("Does not append an index to the name when DB has document with other slug", async () => {
		const db = new InMemoryDbInterface();

		const collection = CollectionId.Misc;
		await db.addObject(collection, { slug: "othername" });

		expect(await GenerateSlug(db, collection, "Test Name")).toBe("testname");
	});

	test("Appends an index to the name when DB has a matching slug", async () => {
		const db = new InMemoryDbInterface();

		const collection = CollectionId.Misc;
		await db.addObject(collection, { slug: "testname" });

		expect(await GenerateSlug(db, collection, "Test Name")).toBe("testname1");
	});

	test("Increments index to the name when DB has a matching slug with an index", async () => {
		const db = new InMemoryDbInterface();

		const collection = CollectionId.Misc;
		await Promise.all([
			db.addObject(collection, { slug: "testname" }),
			db.addObject(collection, { slug: "testname1" }),
		]);

		expect(await GenerateSlug(db, collection, "Test Name")).toBe("testname2");
	});
});

describe(createRedirect.name, () => {
	test("Returns a redirect object with the destination and query", () => {
		const destination = "https://example.com";
		const query = { test: "test" };
		expect(createRedirect(destination, query)).toEqual({
			redirect: {
				destination: `${destination}?test=test`,
				permanent: false,
			},
		});
	});

	test("Returns a redirect object without a ? if no query is present", () => {
		const destination = "https://example.com";
		expect(createRedirect(destination)).toEqual({
			redirect: {
				destination: destination,
				permanent: false,
			},
		});
	});

	test("Returns a redirect object with a query string if query is empty", () => {
		const destination = "https://example.com";
		const query = {};
		expect(createRedirect(destination, query)).toEqual({
			redirect: {
				destination: destination,
				permanent: false,
			},
		});
	});

	const charsToBeEncoded = {
		"&": "%26",
		"?": "%3F",
		"=": "%3D",
		"#": "%23",
		"/": "%2F",
		" ": "%20",
	};

	test("Encodes query values", () => {
		const destination = "https://example.com";

		for (const [char, encoded] of Object.entries(charsToBeEncoded)) {
			const query = { test: char };
			expect(createRedirect(destination, query)).toEqual({
				redirect: {
					destination: `${destination}?test=${encoded}`,
					permanent: false,
				},
			});
		}
	});

	test("Encodes query keys", () => {
		const destination = "https://example.com";

		for (const [char, encoded] of Object.entries(charsToBeEncoded)) {
			const query = { [char]: "test" };
			expect(createRedirect(destination, query)).toEqual({
				redirect: {
					destination: `${destination}?${encoded}=test`,
					permanent: false,
				},
			});
		}
	});
});

describe(isDeveloper.name, () => {
	test("Returns true when email is a dev email", () => {
		expect(isDeveloper(JSON.parse(process.env.DEVELOPER_EMAILS)[0])).toBe(true);
	});

	test("Returns false when email is not a dev email", () => {
		expect(isDeveloper("notadev")).toBe(false);
	});

	test("Returns false when email is undefined", () => {
		expect(isDeveloper(undefined)).toBe(false);
	});
});

describe(mentionUserInSlack.name, () => {
	test("Returns a mention when user has a slackId", () => {
		const user = { slackId: "123", name: "Test User" };
		expect(mentionUserInSlack(user)).toBe("<@123>");
	});

	test("Returns the name when user does not have a slackId", () => {
		const user = { slackId: undefined, name: "Test User" };
		expect(mentionUserInSlack(user)).toBe("Test User");
	});

	test("Returns an empty string when user has no slackId or name", () => {
		const user = { slackId: undefined, name: undefined };
		expect(mentionUserInSlack(user)).toBe("");
	});
});

describe(repairUser.name, () => {
	test("Fills in missing fields on the returned user", async () => {
		const db = new InMemoryDbInterface();

		const user = {
			_id: new ObjectId(),
			email: "test@gmail.com",
		};

		const repairedUser = await repairUser(db, user, false);

		expect(repairedUser.name).toBe("test");
		expect(repairedUser.image).toBeDefined();
		expect(repairedUser.slug).toBeDefined();
		expect(repairedUser.owner).toEqual([]);
		expect(repairedUser.teams).toEqual([]);
	});

	test("Does not overwrite existing fields on the user", async () => {
		const db = new InMemoryDbInterface();

		const user = {
			_id: new ObjectId(),
			email: "test@gmail.com",
			name: "Test User",
			slackId: "123",
			teams: ["team"],
			owner: ["owner"],
			onboardingComplete: true,
			admin: true,
			xp: 10,
			level: 1,
		} as unknown as User & { [key: string]: unknown };

		const repairedUser = (await repairUser(db, user, false)) as User & {
			[key: string]: unknown;
		};

		for (const key of Object.keys(user)) {
			expect(repairedUser[key]).toBe(user[key]);
		}
	});

	test("Updates the user in the DB when updateDocument is true", async () => {
		const db = new InMemoryDbInterface();

		const user = {
			_id: new ObjectId(),
			email: "test@gmail.com",
		};

		await db.addObject(CollectionId.Users, user as unknown as User);

		await repairUser(db, user);

		const updatedUser = await db.findObjectById(
			CollectionId.Users,
			user._id,
		);

		expect(updatedUser).toBeDefined();
		expect(updatedUser?.name).toBe("test");
		expect(updatedUser?.image).toBeDefined();
		expect(updatedUser?.slug).toBeDefined();
	});

	test("Does not update the user in the DB when updateDocument is false", async () => {
		const db = new InMemoryDbInterface();

		const user = {
			_id: new ObjectId(),
			email: "test@gmail.com",
		};

		await repairUser(db, user, false);

		const foundUser = await db.findObjectById(
			CollectionId.Users,
			user._id,
		);
		expect(foundUser).toBeUndefined();
	});

	test("Use the id field as the _id field when it is present", async () => {
		const db = new InMemoryDbInterface();

		const user = {
			id: new ObjectId().toString(),
			email: "test@gmail.com",
		};

		const repairedUser = await repairUser(db, user, false);

		expect(repairedUser.id).toBe(user.id);
	});

	test("Adds a default name when the name and email is missing", async () => {
		const db = new InMemoryDbInterface();

		const user = {
			_id: new ObjectId(),
		};

		const repairedUser = await repairUser(db, user, false);

		expect(repairedUser.name).toBeDefined();
		expect(repairedUser.name).not.toBe("");
	});
});
