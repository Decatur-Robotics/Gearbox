import { ApiErrors } from "unified-api";
import { NextResponse } from "unified-api-nextjs";

export class SlackNotLinkedError extends ApiErrors.Error {
	constructor(res: NextResponse<any>) {
		super(res, 400, "Team has not provided a Slack webhook");
	}
}
