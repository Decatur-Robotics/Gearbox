import Rollbar from "rollbar";

export default function getRollbar() {
	const rollbar = new Rollbar({
		accessToken: process.env.ROLLBAR_TOKEN,
		captureUncaught: true,
		captureUnhandledRejections: true,
	});
	return rollbar;
}
