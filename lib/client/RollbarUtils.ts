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
