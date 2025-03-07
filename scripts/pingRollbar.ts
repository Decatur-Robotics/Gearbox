import Rollbar from "rollbar";

console.log("Initializing Rollbar...");

console.log(process.env.ROLLBAR_TOKEN);

// include and initialize the rollbar library with your access token
const rollbar = new Rollbar({
	accessToken: process.env.ROLLBAR_TOKEN,
	captureUncaught: true,
	captureUnhandledRejections: true,
});

console.log("Rollbar initialized");

// record a generic message and send it to Rollbar
rollbar.log("Hello world!");

console.log("Sent message to Rollbar");
