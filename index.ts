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
import Logger from "./lib/client/Logger";
import { configDotenv } from "dotenv";

configDotenv();

const logger = new Logger(["STARTUP"]);

logger.log("Starting server...");

const dev = process.env.NODE_ENV !== "production";

logger.debug("Constants set");

const useHttps =
	existsSync("./certs/key.pem") && existsSync("./certs/cert.pem");

const httpsOptions = useHttps
	? {
			key: readFileSync("./certs/key.pem"),
			cert: readFileSync("./certs/cert.pem"),
		}
	: {};

const port = useHttps ? 443 : 80;
logger.debug(`Using port ${port}`);

const app = next({ dev, port });
const handle = app.getRequestHandler();

logger.debug("App preparing...");

app.prepare().then(() => {
	logger.debug("App prepared. Creating server...");

	const ioLogger = new Logger(["NETWORKIO"]);

	async function handleRaw(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
	) {
		const start = Date.now();
		ioLogger.debug(`IN: ${req.method} ${req.url}`);
		if (!req.url) return;

		const parsedUrl = parse(req.url, true);
		handle(req, res, parsedUrl).then(() =>
			ioLogger.debug(
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
				logger.info(
					process.env.NODE_ENV +
						` Server Running At: ${useHttps ? "https" : "http"}://localhost:` +
						port,
				);
			})
			.on("error", (err: Error) => {
				logger.error(err);
				throw err;
			});

		logger.debug("Server created. Listening: " + server.listening);
	} catch (err) {
		logger.error(err);
		throw err;
	}
});
