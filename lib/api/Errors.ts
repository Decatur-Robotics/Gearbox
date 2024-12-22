import ApiLib from "./ApiLib";
import NextApiAdapter from "./NextApiAdapter";

export class SlackNotLinkedError extends ApiLib.Errors.Error {
	constructor(res: NextApiAdapter.NextResponse<any>) {
		super(res, 400, "Team has not provided a Slack webhook");
	}
}
