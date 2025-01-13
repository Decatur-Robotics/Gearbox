import { join } from "path";
import { createServer } from "https";
import { parse } from "url";
import next from "next";
import fs, { existsSync, readFileSync } from "fs";
import { IncomingMessage, ServerResponse, request } from "http";

console.log("Starting server...");

const dev = process.env.NODE_ENV !== "production";

console.log("Constants set");

const httpsOptions =
	existsSync("./certs/key.pem") && existsSync("./certs/cert.pem")
		? {
				key: readFileSync("./certs/key.pem"),
				cert: readFileSync("./certs/cert.pem"),
			}
		: {};

const port = "key" in httpsOptions && "cert" in httpsOptions ? 443 : 80;
console.log(`Using port ${port}`);

const app = next({ dev, port });
const handle = app.getRequestHandler();

console.log("App preparing...");
app.prepare().then(() => {
	console.log("App prepared. Creating server...");

	try {
		const server = createServer(
			httpsOptions,
			async (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => {
				if (!req.url) return;

				const parsedUrl = parse(req.url, true);
				handle(req, res, parsedUrl);
			},
		)
			.listen(port, () => {
				console.log(
					process.env.NODE_ENV +
						" HTTPS Server Running At: https://localhost:" +
						port,
				);
			})
			.on("error", (err: Error) => {
				console.log(err);
				throw err;
			});

		console.log("Server created. Listening: " + server.listening);
	} catch (err) {
		console.log(err);
		throw err;
	}
});
