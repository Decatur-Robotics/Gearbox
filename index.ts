import { createServer as createServerHttps } from "https";
import { parse } from "url";
import next from "next";
import { existsSync, readFileSync } from "fs";
import {
	IncomingMessage,
	ServerResponse,
	createServer as createServerHttp,
} from "http";
import Logger from "./lib/client/Logger";
import { loadEnvConfig } from "@next/env";
import getRollbar, {
	reportDeploymentToRollbar,
} from "./lib/client/RollbarUtils";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const logger = new Logger(["STARTUP"]);

logger.log("Starting server...");

const mode = process.env.NODE_ENV;

logger.info("Constants set. Using mode:", mode);

const useHttps =
	mode !== "test" &&
	existsSync("./certs/key.pem") &&
	existsSync("./certs/cert.pem");

const httpsOptions = useHttps
	? {
			key: readFileSync("./certs/key.pem"),
			cert: readFileSync("./certs/cert.pem"),
		}
	: {};

const port = useHttps ? 443 : mode == "test" ? 3000 : 80;
logger.debug(`Using port ${port}`);

const app = next({
	dev: mode == "development",
	port,
});
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

				reportDeploymentToRollbar();
			})
			.on("error", (err: Error) => {
				logger.error(err);
				getRollbar().error(err);
				throw err;
			});

		logger.debug("Server created. Listening: " + server.listening);
	} catch (err) {
		logger.error(err);
		throw err;
	}
});
