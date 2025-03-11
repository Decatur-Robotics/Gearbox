import DbInterface from "../client/dbinterfaces/DbInterface";
import { TheBlueAlliance } from "../TheBlueAlliance";
import { User } from "../Types";
import { ResendInterface } from "../ResendUtils";
import { SlackInterface } from "../SlackClient";
import { RollbarInterface } from "../client/RollbarUtils";

type ApiDependencies = {
	db: Promise<DbInterface>;
	tba: TheBlueAlliance.Interface;
	userPromise: Promise<User | undefined>;
	slackClient: SlackInterface;
	resend: ResendInterface;
	rollbar: RollbarInterface;
};

export default ApiDependencies;
