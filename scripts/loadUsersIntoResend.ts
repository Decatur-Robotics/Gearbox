import { getDatabase } from "@/lib/MongoDB";
import CollectionId from "@/lib/client/CollectionId";
import ResendUtils from "@/lib/ResendUtils";

async function loadUsersIntoResend() {
	console.log("Loading users into Resend...");

	console.log("Getting database...");
	const db = await getDatabase();

	console.log("Finding users...");
	const users = await db.findObjects(CollectionId.Users, {});

	console.log(`Saving ${users.length} users to Resend...`);

	for (const user of users) {
		console.log("Processing", user.email);
		if (user.email == "totallyrealemail@gmail.com") {
			console.log("Skipping test user");
			continue;
		}

		await new ResendUtils().createContact(user);
		await new Promise((resolve) => setTimeout(resolve, 500)); // Rate limit is 2/sec
	}

	console.log("Done!");

	process.exit(0); // Needed to avoid having to Ctrl+C the script
}

loadUsersIntoResend();
