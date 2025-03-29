import Rollbar from "rollbar";

declare global {
	var rollbar: Rollbar;
}

export interface RollbarInterface {
	error: (...args: any[]) => void;
	warn: (...args: any[]) => void;
	info: (...args: any[]) => void;
	debug: (...args: any[]) => void;
}

export default function getRollbar(): RollbarInterface {
	if (global.rollbar) return global.rollbar;

	const rollbar = new Rollbar({
		accessToken: process.env.ROLLBAR_TOKEN,
		captureUncaught: true,
		captureUnhandledRejections: true,
	});

	global.rollbar = rollbar;
	return rollbar;
}

export function reportDeploymentToRollbar() {
	const deployId = process.env.DEPLOY_ID;

	if (!deployId) {
		getRollbar().error("Missing gitSha or deployId in environment variables");
		return;
	}

	if (!process.env.ROLLBAR_TOKEN) {
		console.warn("ROLLBAR_TOKEN is not set. Cannot report deployment.");
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

	fetch(url, options)
		.then(() => console.log("Deployment reported to Rollbar"))
		.catch((err) => getRollbar().error(err));
}
