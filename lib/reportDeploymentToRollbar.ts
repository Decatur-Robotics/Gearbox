import getRollbar from "./client/RollbarUtils";

export default async function reportDeploymentToRollbar() {
	const gitSha = process.env.GIT_SHA;
	const deployId = process.env.DEPLOY_ID;

	if (!gitSha || !deployId) {
		getRollbar().error("Missing gitSha or deployId in environment variables");
		return;
	}

	const url = "https://api.rollbar.com/api/1/deploy/" + deployId;
	const options = {
		method: "PATCH",
		headers: {
			accept: "application/json",
			"content-type": "application/json",
			"X-Rollbar-Access-Token": process.env.ROLLBAR_TOKEN,
		},
		body: JSON.stringify({
			status: "succeeded",
		}),
	};

	fetch(url, options);
}
