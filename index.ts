import { join } from "path";
import { createServer as createServerHttps } from "https";
import { parse } from "url";
import next from "next";
import fs, { existsSync, readFileSync } from "fs";
import {
	IncomingMessage,
	ServerResponse,
	request,
	createServer as createServerHttp,
} from "http";

console.log("Starting server...");

const dev = process.env.NODE_ENV !== "production";

console.log("Constants set");

console.log("Recaptcha key: " + process.env.NEXT_PUBLIC_RECAPTCHA_KEY);

const useHttps =
	existsSync("./certs/key.pem") && existsSync("./certs/cert.pem");

const httpsOptions = useHttps
	? {
			key: readFileSync("./certs/key.pem"),
			cert: readFileSync("./certs/cert.pem"),
		}
	: {};

const port = useHttps ? 443 : 80;
console.log(`Using port ${port}`);

const app = next({ dev, port });
const handle = app.getRequestHandler();

console.log("App preparing...");
app.prepare().then(() => {
	console.log("App prepared. Creating server...");

	async function handleRaw(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
	) {
		const start = Date.now();
		console.log(`IN: ${req.method} ${req.url}`);
		if (!req.url) return;

		const parsedUrl = parse(req.url, true);
		handle(req, res, parsedUrl).then(() =>
			console.log(
				`OUT: ${req.method} ${req.url} ${res.statusCode} in ${Date.now() - start}ms`,
			),
		);
	}

	try {
		const server = (
			useHttps
				? createServerHttps(httpsOptions, handleRaw)
				: createServerHttp(handleRaw)
		)
			.listen(port, () => {
				console.log(
					process.env.NODE_ENV +
						` Server Running At: ${useHttps ? "https" : "http"}://localhost:` +
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
