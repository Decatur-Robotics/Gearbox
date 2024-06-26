import { AckFn, RespondArguments, RespondFn, SlashCommand } from "@slack/bolt";

type SlackCommandDict = { 
  [command: string]: 
    (command: SlashCommand, acknowledge: AckFn<string | RespondArguments>, respond: RespondFn) => Promise<void> 
};

const SlackCommands: SlackCommandDict = {
  "link-notifications": async (command, acknowledge, respond) => {
    await acknowledge();
  
    const teamNumber = command.text;
  
    // console.log(command);
  
    await respond(`Linking channel for team ${teamNumber}...`);
  }
}

export default SlackCommands;