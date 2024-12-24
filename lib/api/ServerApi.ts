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
import NextApiAdapter from "./NextApiAdapter";

export default class ServerApi extends NextApiAdapter.ServerApi<ApiDependencies> {
	constructor(clientApi?: NextApiAdapter.ApiTemplate<ApiDependencies>) {
		super(clientApi ?? new ClientApi());
	}

	getDependencies(
		req: NextApiRequest,
		res: NextApiAdapter.NextResponse<any>,
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
