import { WebClient } from "@slack/web-api";
import DbInterface from "../client/dbinterfaces/DbInterface";
import { TheBlueAlliance } from "../TheBlueAlliance";
import { User } from "../Types";

type ApiDependencies = {
  db: Promise<DbInterface>;
  tba: TheBlueAlliance.Interface;
  userPromise: Promise<User | undefined>;
  slackClient: WebClient;
}

export default ApiDependencies;