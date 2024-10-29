import { WebClient } from "@slack/web-api";
import { User } from "next-auth";
import DbInterface from "../client/dbinterfaces/DbInterface";
import { TheBlueAlliance } from "../TheBlueAlliance";

type ApiDependencies = {
  db: Promise<DbInterface>;
  tba: TheBlueAlliance.Interface;
  userPromise: Promise<User | undefined>;
  slackClient: WebClient;
}

export default ApiDependencies;