import getRollbar from "@/lib/client/RollbarUtils";

console.log("Initializing Rollbar...");

// include and initialize the rollbar library with your access token
const rollbar = getRollbar();

console.log("Rollbar initialized");

// record a generic message and send it to Rollbar
rollbar.log("Pinged manually!");

console.log("Sent message to Rollbar");
