import { AckFn, RespondArguments, RespondFn, SlashCommand } from "@slack/bolt";
import { Db, ObjectId } from "mongodb";
import { Collections, getDatabase } from "./MongoDB";
import { Team, User } from "./Types";

type SlackCommandDict = { 
  [command: string]: 
    (command: SlashCommand, acknowledge: AckFn<string | RespondArguments>, respond: RespondFn) => Promise<void> 
};

const SlackCommands: SlackCommandDict = {
  "link-notifications": async (command, acknowledge, respond) => {
    await acknowledge();
  
    if (!command.text || isNaN(+command.text)) {
      await respond("Please provide a team number.");
      return;
    }

    const teamNumber = +command.text;
    const userId = command.user_id;

    const db = await getDatabase();

    const userPromise = db.findObject<User>(Collections.Users, { slackId: userId });
    const teamPromise = db.findObject<Team>(Collections.Teams, { number: teamNumber });

    const user = await userPromise;
    const team = await teamPromise;

    console.log(user, team);

    if (!user) {
      await respond("You are not registered in Gearbox. Please register first at https://4026.org.");
      return;
    }

    if (!team) {
      await respond(`Team ${teamNumber} does not exist.`);
      return;
    }

    if (!team.owners.includes(user._id!.toString())) {
      await respond(`You are not an owner of team ${teamNumber}.`);
      return;
    }

    await db.updateObjectById<Team>(Collections.Teams, new ObjectId(team._id!), {
      slackChannel: command.channel_id
    });
  
    db.client?.close();
    await respond(`Linked channel for team ${teamNumber}. Make sure to run /invite @Gearbox to the channel to receive notifications.`);
  }
}

export default SlackCommands;