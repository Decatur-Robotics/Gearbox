import { SlashCommand, AckFn, RespondArguments, RespondFn, App, Installation } from "@slack/bolt";
import SlackCommands from "./SlackCommands";
import { getDatabase } from "./MongoDB";
import CollectionId from "./client/CollectionId";

const slackApp = new App({
  // token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  port: +process.env.SLACK_PORT,
  redirectUri: "https://localhost/slack/oauth_redirect",
  installerOptions: {
    redirectUriPath: "/slack/oauth_redirect",
  },
  appToken: process.env.SLACK_APP_TOKEN,
  clientId: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.SLACK_STATE_SECRET,
  scopes: ["chat:write", "commands"],
  installationStore: {
    storeInstallation: async (installation) => {
      console.log("Storing installation", installation.team?.name);

      const db = await getDatabase();

      db.addObject(CollectionId.SlackInstallations, installation);
    },
    fetchInstallation: async (InstallQuery) => {
      const db = await getDatabase();

      console.log("Fetching installation: " + InstallQuery.teamId);
      const installation = await db.findObject<Installation>(CollectionId.SlackInstallations, {
        userId: InstallQuery.userId,
        team: {
          id: InstallQuery.teamId,
        }
      });

      console.log("Found installation", installation?.team?.name);

      if (!installation) {
        throw new Error("No installation found");
      }

      return installation;
    },
  },
});

slackApp.command(/\/.*/, async (props: { command: SlashCommand, ack: AckFn<string | RespondArguments>, respond: RespondFn }) => {
  const { command, ack, respond } = props;

  const commandName = command.command.replace("/", "");
  const handler = SlackCommands[commandName];

  if (handler) {
    handler(command, ack, respond);
  }
  else {
    await ack();
    await respond(`Command not found: ` + commandName);
  }
});

export async function startSlackApp() {
    await slackApp.start(process.env.SLACK_PORT);
    console.log("Slack bot is listening at: http://localhost:" + process.env.SLACK_PORT);

    return slackApp;
}