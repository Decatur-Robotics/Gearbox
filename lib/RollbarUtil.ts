import Rollbar from "rollbar";

export default function getRollbar() {
	const rollbar = new Rollbar({
		accessToken: process.env.ROLLBAR_TOKEN,
		captureUncaught: true,
		captureUnhandledRejections: true,
	});
	return rollbar;
}

export async function postDeployToRollbar() {
	const gitCommitSha = require("child_process")
		.execSync("git rev-parse HEAD")
		.toString()
		.trim();

	const url = `https://api.rollbar.com/api/1/deploy/`;
	const options = {
		method: "POST",
		headers: {
			accept: "application/json",
			"content-type": "application/json",
			"x-rollbar-access-token": process.env.ROLLBAR_TOKEN,
		},
		body: JSON.stringify({
			environment: process.env.NODE_ENV,
			revision: gitCommitSha,
			status: "succeeded",
		}),
	};

	const response = await fetch(url, options);
	if (response.status !== 200) {
		throw new Error(
			`Failed to post deploy: ${response.status}, ${await response.text()}`,
		);
	}

	console.log("Posted deploy to Rollbar");
}
