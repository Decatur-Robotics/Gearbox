/**
 * @tested_by lib/dev/FakeData.test.ts
 */
import { Team, User } from "../Types";
import { getDatabase } from "../MongoDB";
import { GenerateSlug } from "../Utils";
import { randomArrayValue } from "../client/ClientUtils";
import { ObjectId } from "bson";
import CollectionId from "../client/CollectionId";
import DbInterface from "../client/dbinterfaces/DbInterface";

const firstNameMaleURL = "https://www.randomlists.com/data/names-male.json";
const firstNameFemaleURL = "https://www.randomlists.com/data/names-female.json";

var cachedFirstNames: string[] = [];
var cachedLastNames: string[] = [];
async function fetchNames(): Promise<[string[], string[]]> {
	if (cachedFirstNames.length === 0) {
		cachedFirstNames = cachedFirstNames.concat(
			(await (await fetch(firstNameFemaleURL)).json()).data,
		);
		cachedFirstNames = cachedFirstNames.concat(
			(await (await fetch(firstNameMaleURL)).json()).data,
		);
	}
	if (cachedLastNames.length === 0) {
		cachedLastNames = (
			await (
				await fetch("https://www.randomlists.com/data/names-surnames.json")
			).json()
		).data;
	}

	return [cachedFirstNames, cachedLastNames];
}

async function randomName(): Promise<string> {
	const [first, last] = await fetchNames();
	return randomArrayValue(first) + " " + randomArrayValue(last);
}

export async function fakeUser(
	db: DbInterface,
	teamId: ObjectId | undefined,
): Promise<User> {
	const name = await randomName();
	const user = new User(
		name,
		"totallyrealemail@gmail.com",
		"https://media.npr.org/assets/img/2015/06/15/gettyimages-1445210_custom-9cff1c641fe4451adaf1bcd3750bf4a11fb5d4e9.jpg",
		false,
		await GenerateSlug(db, CollectionId.Users, name),
		teamId ? [teamId] : [],
		[],
		"",
		10,
	);
	user.lastSignInDateTime = new Date();
	return await db.addObject(CollectionId.Users, user);
}

export async function fillTeamWithFakeUsers(
	n: number,
	teamId: ObjectId,
	db: DbInterface,
): Promise<Team> {
	const users: any[] = [];
	for (let i = 0; i < n; i++) {
		users.push((await fakeUser(db, teamId))._id!.toString());
	}

	const team = await db.findObjectById(
		CollectionId.Teams,
		new ObjectId(teamId.toString()),
	);

	if (!team) {
		throw new Error("Team not found");
	}

	team.users = team.users.concat(users);
	team.scouters = team.scouters.concat(users);

	await db.updateObjectById(CollectionId.Teams, new ObjectId(team._id), team);
	return team;
}
