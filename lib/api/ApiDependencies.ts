import DbInterface from "../client/dbinterfaces/DbInterface";
import { TheBlueAlliance } from "../TheBlueAlliance";
import { User } from "../Types";
import { ResendInterface } from "../ResendUtils";
import SlackClient from "../SlackClient";

type ApiDependencies = {
  db: Promise<DbInterface>;
  tba: TheBlueAlliance.Interface;
  userPromise: Promise<User | undefined>;
  slackClient: SlackClient;
  resend: ResendInterface;
}

export default ApiDependencies;