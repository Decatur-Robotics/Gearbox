import NextApiAdapter from "./NextApiAdapter";
import { ApiErrors } from "unified-api";

export class SlackNotLinkedError extends ApiErrors.Error {
	constructor(res: NextApiAdapter.NextResponse<any>) {
		super(res, 400, "Team has not provided a Slack webhook");
	}
}
