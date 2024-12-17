import DbInterface from "../client/dbinterfaces/DbInterface";
import { TheBlueAlliance } from "../TheBlueAlliance";
import { User } from "../Types";
import { ResendInterface } from "../ResendUtils";
import SlackClient, { SlackInterface } from "../SlackClient";

type ApiDependencies = {
	db: Promise<DbInterface>;
	tba: TheBlueAlliance.Interface;
	userPromise: Promise<User | undefined>;
	slackClient: SlackInterface;
	resend: ResendInterface;
};

export default ApiDependencies;
