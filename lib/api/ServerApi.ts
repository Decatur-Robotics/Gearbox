import { WebClient } from "@slack/web-api";
import { getDatabase } from "../MongoDB";
import { TheBlueAlliance } from "../TheBlueAlliance";
import ApiDependencies from "./ApiDependencies";
import ApiLib from "./ApiLib";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { AuthenticationOptions } from "../Auth";
import { User } from "../Types";
import ClientApi from "@/lib/api/ClientApi";
import ResendUtils from "../ResendUtils";
import SlackClient from "../SlackClient";

export default class ServerApi extends ApiLib.ServerApi<ApiDependencies> {
	constructor(clientApi?: ApiLib.ApiTemplate<ApiDependencies>) {
		super(clientApi ?? new ClientApi(), "/api/");
	}

	getDependencies(
		req: NextApiRequest,
		res: ApiLib.NextResponse<any>,
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
