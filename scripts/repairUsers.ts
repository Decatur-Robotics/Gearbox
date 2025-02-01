import CollectionId from "@/lib/client/CollectionId";
import { getDatabase } from "@/lib/MongoDB";
import { getCommandLineInput, repairUser } from "@/lib/Utils";

async function repairUsers() {
	console.log("Getting database...");
	const db = await getDatabase();

	console.log("Getting all incomplete users...");

	const users = await db.findObjects(CollectionId.Users, {
		$or: [
			{ name: { $exists: false } },
			{ image: { $exists: false } },
			{ slackId: { $exists: false } },
			{ onboardingComplete: { $exists: false } },
			{ admin: { $exists: false } },
			{ teams: { $exists: false } },
			{ owner: { $exists: false } },
		],
	});

	console.log(`Found ${users.length} incomplete users`);

	if (
		(await getCommandLineInput("Do you want to continue? (yes/no)")) !== "yes"
	) {
		console.log("Exiting...");
		process.exit(0);
	}

	for (let i = 0; i < users.length; i++) {
		const user = users[i];
		console.log(`Repairing user ${user._id} (${i + 1}/${users.length})`);
		await repairUser(db, user);
	}

	console.log("Done!");

	process.exit(0); // Needed to avoid having to Ctrl+C the script
}

repairUsers();
