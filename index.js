console.log("Starting server...");

const { createServer } = require("https");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");

console.log("Imports compete");

const dev = process.env.NODE_ENV !== "production";
const port = dev ? 3000 : 443;
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

app.prepare().then(() => {
  console.log("App prepared. Creating server...");

  const server = createServer(httpsOptions, async (req, res) => {
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) {
      console.log(err);
      throw err;
    }
    console.log(
      process.env.NODE_ENV +
        " HTTPS Server Running At: https://localhost:" +
        port,
    );
  }).on("error", (err) => {
    console.log(err);
    throw err;
  });

  console.log("Server created. Listening: " + server.listening);
});

console.log("App preparing...");