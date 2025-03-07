import Rollbar from "rollbar";

export default function getRollbar() {
	const rollbar = new Rollbar({
		accessToken: process.env.ROLLBAR_TOKEN,
		captureUncaught: true,
		captureUnhandledRejections: true,
	});
	console.log("Rollbar initialized", process.env.ROLLBAR_TOKEN);
	console.log(rollbar.log("Rollbar initialized"));
	return rollbar;
}
