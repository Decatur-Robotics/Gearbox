import { WebClient } from "@slack/web-api";
import { getDatabase } from "../MongoDB";
import { TheBlueAlliance } from "../TheBlueAlliance";
import ApiDependencies from "./ApiDependencies";
import ApiLib from "./ApiLib";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { AuthenticationOptions } from "../Auth";
import { User } from "../Types";
import ClientApi from "./ClientApi";
import ResendUtils from "../ResendUtils";

export default class ServerApi extends ApiLib.ServerApi<ApiDependencies> {
  constructor(clientApi?: ApiLib.ApiTemplate<ApiDependencies>) {
    super(clientApi ?? new ClientApi(), "/api/");
  }

  getDependencies(req: NextApiRequest, res: ApiLib.ApiResponse<any>): ApiDependencies
  {
    return {
      db: getDatabase(),
      tba: new TheBlueAlliance.Interface(),
      slackClient: new WebClient(process.env.SLACK_CLIENT_SECRET),
      userPromise: getServerSession(req, res.innerRes, AuthenticationOptions).then((s) => s?.user as User | undefined),
      resend: new ResendUtils()
    };
  }
}