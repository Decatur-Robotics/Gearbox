import { join } from "path";
import { createServer } from "https";
import { parse } from "url";
import next from "next";
import fs, { readFileSync } from "fs";
import { IncomingMessage, ServerResponse, request } from "http";

console.log("Starting server...");

const dev = process.env.NODE_ENV !== "production";
const port = 443;
const app = next({ dev, port });
const handle = app.getRequestHandler();

console.log("Constants set");

const httpsOptions = {
	key: readFileSync("./certs/key.pem"),
	cert: readFileSync("./certs/cert.pem"),
};

console.log("HTTPS options set");

console.log("App preparing...");
app.prepare().then(() => {
	console.log("App prepared. Creating server...");

	try {
		const server = createServer(
			httpsOptions,
			async (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => {
				if (!req.url) return;

				const parsedUrl = parse(req.url, true);
				const { pathname } = parsedUrl;

				if (
					pathname &&
					(pathname === "/sw.js" ||
						/^\/(workbox|worker|fallback)-\w+\.js$/.test(pathname))
				) {
					console.log("Service worker request received: " + parsedUrl.pathname);
					const filePath = join(__dirname, "public", pathname);
					const file = fs.readFileSync(filePath, "utf8");

					res.writeHead(200, { "Content-Type": "application/javascript" });
					res.write(file, (err) =>
						console.log(
							err
								? "Service worker write error: " + err
								: "Service worker written",
						),
					);
				} else if (pathname && pathname.startsWith("/slack")) {
					console.log("Slack event received: " + parsedUrl.pathname);

					// Pipe request to slack app
					const newReq = request(
						Object.assign(
							{},
							parse("http://localhost:" + process.env.SLACK_PORT + req.url),
							{
								method: req.method,
								path: req.url,
							},
						),
						(newRes) => {
							res.writeHead(newRes.statusCode || 200, newRes.headers);
							newRes.pipe(res);
						},
					);

					req.pipe(newReq);
				} else {
					handle(req, res, parsedUrl);
				}
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
