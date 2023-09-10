const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== "production"
const port = dev ? 3000 : 443;
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
    key: dev ? fs.readFileSync('./certs/localhost-key.pem'): fs.readFileSync('./certs/production-key.pem'),
    cert: dev ? fs.readFileSync('./certs/localhost.pem'): fs.readFileSync("./certs/production.pem"),
};

app.prepare().then(() => {
    createServer(httpsOptions, async (req, res) => {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
    }).listen(port, (err) => {
        if (err) throw err;
        console.log(process.env.NODE_ENV + ' HTTPS Server Running At: https://localhost:' + port);
    });
});
