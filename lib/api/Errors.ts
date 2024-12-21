import ApiLib from "./ApiLib";

export class SlackNotLinkedError extends ApiLib.Errors.Error {
	constructor(res: ApiLib.NextResponse<any>) {
		super(res, 400, "Team has not provided a Slack webhook");
	}
}
