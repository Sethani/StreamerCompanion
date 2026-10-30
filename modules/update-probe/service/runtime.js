const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const manifest = JSON.parse(fs.readFileSync(path.join(process.env.COMPANION_MODULE_DIRECTORY, "module.json"), "utf8"));
const server = http.createServer((request, response) => {
  if (request.url === "/health") {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ service: "update-probe", ready: true, version: manifest.version }));
  } else if (request.url === "/settings") {
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end("<!doctype html><meta charset=utf-8><title>Update Probe</title><h1>Update Probe " + manifest.version + "</h1><p>This test module does not connect to Streamer.bot, OBS, Twitch, or Spotify.</p>");
  } else { response.writeHead(404); response.end(); }
});
server.listen(Number(process.env.COMPANION_SERVICE_PORT), "127.0.0.1");
process.on("SIGTERM", () => server.close(() => process.exit(0)));
