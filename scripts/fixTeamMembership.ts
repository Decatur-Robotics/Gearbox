import CollectionId from "@/lib/client/CollectionId";
import { getDatabase } from "@/lib/MongoDB";
import { ObjectId } from "bson";

async function fixTeamMembership() {
	console.log("Fixing team membership and ownership...");

	console.log("Getting database...");
	const db = await getDatabase();

	console.log("Finding teams...");
	const teams = await db.findObjects(CollectionId.Teams, {});

	console.log(`Found ${teams.length} teams.`);

	const users: { [id: string]: { teams: ObjectId[]; owner: string[] } } = {};

	for (const team of teams) {
		console.log(
			`Processing team ${team._id}... Users: ${team.users.length}, Owners: ${team.owners.length}`,
		);

		for (const user of team.users) {
			if (!users[user]) {
				users[user] = { teams: [], owner: [] };
			}

			users[user].teams.push(team._id);
		}

		for (const user of team.owners) {
			if (!users[user]) {
				users[user] = { teams: [], owner: [] };
			}

			users[user].owner.push(team._id.toString());
		}
	}

	console.log(`Found ${Object.keys(users).length} users who are on teams.`);

	for (const userId in users) {
		const user = users[userId];

		console.log(
			`Updating user ${userId}... Teams: ${user.teams.length}, Owners: ${user.owner.length}`,
		);
		await db.updateObjectById(CollectionId.Users, new ObjectId(userId), {
			teams: user.teams,
			owner: user.owner,
		});
	}

	process.exit(0);
}

fixTeamMembership();
