import { Collections, getDatabase } from "@/lib/MongoDB";
import ResendUtils from "@/lib/ResendUtils";
import { User } from "@/lib/Types";

async function loadUsersIntoResend() {
  console.log("Loading users into Resend...");

  console.log("Getting database...");
  const db = await getDatabase();
  
  console.log("Finding users...");
  const users = await db.findObjects<User>(Collections.Users, {});

  console.log(`Saving ${users.length} users to Resend...`);
  users.forEach(async user => {
    if (user.email == "totallyrealemail@gmail.com")
      return;

    await ResendUtils.createContact(user);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit is 2/sec
  });

  console.log("Done!");
}

loadUsersIntoResend();