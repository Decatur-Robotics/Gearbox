import { join } from "path";
import { SlashCommand, AckFn, RespondArguments, RespondFn } from '@slack/bolt';
import { createServer } from "https";
import { parse } from "url";
import next from "next";
import fs from "fs";
import { App } from "@slack/bolt";
import SlackCommands from "./lib/SlackCommands";
import { IncomingMessage, ServerResponse } from "http";

console.log("Starting server...");

const dev = process.env.NODE_ENV !== "production";
const port = 443;
const app = next({ dev });
const handle = app.getRequestHandler();

console.log("Constants set");

const httpsOptions = {
  key: dev
    ? fs.readFileSync("./certs/localhost-key.pem")
    : fs.readFileSync("./certs/production-key.pem"),
  cert: dev
    ? fs.readFileSync("./certs/localhost.pem")
    : fs.readFileSync("./certs/production.pem"),
};

console.log("HTTPS options set");

app.prepare().then(() => {
  console.log("App prepared. Creating server...");

  try {
    const server = createServer(httpsOptions, async (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => {
      if (!req.url)
        return;

      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      if (pathname && (pathname === '/sw.js' || /^\/(workbox|worker|fallback)-\w+\.js$/.test(pathname))) {
        const filePath = join(__dirname, '.next', pathname);
        (app as any).serveStatic(req, res, filePath)
      } else {
        handle(req, res, parsedUrl);
      }
    }).listen(port, () => {
      console.log(
        process.env.NODE_ENV +
          " HTTPS Server Running At: https://localhost:" +
          port,
      );
    }).on("error", (err: Error) => {
      console.log(err);
      throw err;
    });

    console.log("Server created. Listening: " + server.listening);
  } catch (err) {
    console.log(err);
    throw err;
  }
});

console.log("App preparing...");

// Slack bot

const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

slackApp.command(/\/.*/, async (props: { command: SlashCommand, ack: AckFn<string | RespondArguments>, respond: RespondFn }) => {
  const { command, ack, respond } = props;

  console.log("Command received: ", command);

  const commandName = command.command.replace("/", "");
  const handler = SlackCommands[commandName];
  console.log(Object.keys(SlackCommands));  

  if (handler) {
    handler(command, ack, respond);
  }
  else {
    await ack();
    await respond(`Command not found: ` + commandName);
  }
});

async function startSlackApp() {
    await slackApp.start(process.env.PORT || 3000);
    console.log("Slack bot is running!");
}
startSlackApp();