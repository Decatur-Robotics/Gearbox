import { join } from "path";
import { createServer } from "https";
import { parse } from "url";
import next from "next";
import fs from "fs";
import { IncomingMessage, request, ServerResponse } from "http";
import { startSlackApp } from "./lib/Slack";

console.log("Starting server...");

const dev = process.env.NODE_ENV !== "production";
const port = 443;
const app = next({ dev });
const handle = app.getRequestHandler();

console.log("Constants set");

const httpsOptions = {
  key: dev
    ? fs.readFileSync("./certs/localhost-key.pem")
    : fs.readFileSync("./certs/production-key.pem"),
  cert: dev
    ? fs.readFileSync("./certs/localhost.pem")
    : fs.readFileSync("./certs/production.pem"),
};

console.log("HTTPS options set");

startSlackApp();

console.log("App preparing...");
app.prepare().then(() => {
  console.log("App prepared. Creating server...");

  try {
    const server = createServer(httpsOptions, async (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => {
      if (!req.url)
        return;

      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      if (pathname && (pathname === '/sw.js' || /^\/(workbox|worker|fallback)-\w+\.js$/.test(pathname))) {
        const filePath = join(__dirname, '.next', pathname);
        (app as any).serveStatic(req, res, filePath);
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
            }
          ),
          (newRes) => {
            res.writeHead(newRes.statusCode || 200, newRes.headers);
            newRes.pipe(res);
          }
        );

        req.pipe(newReq);
      } else {
        handle(req, res, parsedUrl);
      }
    }).listen(port, () => {
      console.log(
        process.env.NODE_ENV +
          " HTTPS Server Running At: https://localhost:" +
          port,
      );
    }).on("error", (err: Error) => {
      console.log(err);
      throw err;
    });

    console.log("Server created. Listening: " + server.listening);
  } catch (err) {
    console.log(err);
    throw err;
  }
});