import { getDatabase } from "../MongoDB";
import { TheBlueAlliance } from "../TheBlueAlliance";
import ApiDependencies from "./ApiDependencies";
import { NextApiRequest } from "next";
import { getServerSession } from "next-auth";
import { AuthenticationOptions } from "../Auth";
import { User } from "../Types";
import ClientApi from "@/lib/api/ClientApi";
import ResendUtils from "../ResendUtils";
import SlackClient from "../SlackClient";
import {
	NextServerApi,
	NextApiTemplate,
	NextResponse,
} from "unified-api-nextjs";

export default class ServerApi extends NextServerApi<ApiDependencies> {
	constructor(clientApi?: NextApiTemplate<ApiDependencies>) {
		super(clientApi ?? new ClientApi());
	}

	getDependencies(
		req: NextApiRequest,
		res: NextResponse<any>,
	): ApiDependencies {
		return {
			db: getDatabase(),
			tba: new TheBlueAlliance.Interface(),
			slackClient: new SlackClient(),
			userPromise: getServerSession(
				req,
				res.innerRes,
				AuthenticationOptions,
			).then((s) => s?.user as User | undefined),
			resend: new ResendUtils(),
		};
	}
}
