const fs = require("node:fs"), path = require("node:path"), http = require("node:http"), { once } = require("node:events");
const { WebSocketServer } = require("ws");
const { buildModules } = require("../../scripts/build-modules");
async function fixture(directory, Host = require("../src/companion-host").CompanionHost) {
  const output = path.join(directory, "packages"), catalog = buildModules(["countdown", "universal-dock", "universal-overlay", "source-modules"], { output });
  const allActions = catalog.modules.flatMap(item => item.streamerbot.requiredActions); let actions = [...allActions];
  const calls = [], globals = new Map(); let revision = 0;
  let payload = { status: "idle", remainingMs: 0, endTimeMs: null, finishedText: "Starting\nsoon", config: { durationSeconds: 300, finishedText: "Starting\nsoon" } };
  const websocket = new WebSocketServer({ host: "127.0.0.1", port: 0 }); await once(websocket, "listening");
  function broadcast(value) { globals.set(value.feature === "countdown" ? "portable.countdown.state" : "portable.moduleRouting.state", JSON.stringify(value)); for (const socket of websocket.clients) if (socket.readyState === 1) socket.send(JSON.stringify({ event: { source: "General", type: "Custom" }, data: value })); }
  function publish(value) { payload = value; broadcast({ schemaVersion: 1, feature: "countdown", type: "state", revision: ++revision, payload }); }
  publish(payload); broadcast({ schemaVersion: 1, feature: "moduleRouting", type: "state", revision: 1, payload: { modules: { countdown: { mode: "global", scenes: [] } }, currentScene: "Synthetic A" } });
  function command(name, args = {}) {
    if (!/^Countdown - (Initialize|Start|Pause|Resume|Clear|Configure|Health)$/.test(name)) throw new Error("Unexpected action in countdown fixture");
    calls.push({ name, args }); let next = structuredClone(payload);
    if (name.endsWith("Health")) return;
    if (name.endsWith("Start") || name.endsWith("Configure")) { next.config = { durationSeconds: Number(args.durationSeconds), finishedText: args.finishedText || next.config.finishedText }; if (name.endsWith("Start")) Object.assign(next, { status: next.config.durationSeconds ? "running" : "finished", remainingMs: next.config.durationSeconds * 1000, endTimeMs: next.config.durationSeconds ? Date.now() + next.config.durationSeconds * 1000 : null, finishedText: next.config.finishedText }); }
    if (name.endsWith("Pause") && next.status === "running") Object.assign(next, { status: "paused", remainingMs: Math.max(0, next.endTimeMs - Date.now()), endTimeMs: null });
    if (name.endsWith("Resume") && next.status === "paused") Object.assign(next, { status: "running", endTimeMs: Date.now() + next.remainingMs });
    if (name.endsWith("Clear")) Object.assign(next, { status: "idle", remainingMs: 0, endTimeMs: null });
    publish(next);
  }
  websocket.on("connection", socket => socket.on("message", raw => { const request = JSON.parse(raw); let response = {};
    if (request.request === "GetActions") response.actions = actions.map(name => ({ name }));
    else if (request.request === "Subscribe") {}
    else if (request.request === 'GetGlobal') response.variables = { [request.variable]: { name: request.variable, value: globals.get(request.variable) } }; else if (request.request === "GetGlobals") response.variables = [...globals].map(([name, value]) => ({ variableName: name, value }));
    else if (request.request === "DoAction") command(request.action.name, request.args);
    else throw new Error("Unexpected WebSocket request");
    socket.send(JSON.stringify({ id: request.id, status: "ok", ...response }));
  }));
  const reservation = http.createServer(); reservation.listen(0, "127.0.0.1"); await once(reservation, "listening"); const port = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
  const wsUrl = "ws://127.0.0.1:" + websocket.address().port + "/";
  const host = new Host({ version: require("../package.json").version, dataDirectory: path.join(directory, "data"), controlApiPort: port, streamerBotUrl: wsUrl, catalogFetch: async url => { const entry = catalog.modules.find(item => item.package.url === url); if (!entry) throw new Error("No external requests in fixture"); return new Response(fs.readFileSync(path.join(output, path.basename(new URL(url).pathname)))); } });
  host.catalog.catalog = catalog; host.start(); await once(host.controlApi.server, "listening");
  await host.installCatalogModule("countdown"); await host.installCatalogModule("source-modules"); await host.installCatalogModule("universal-overlay");
  return { host, calls, globals, catalog, output, websocket, wsUrl, base: "http://127.0.0.1:" + port, command, publish, payload: () => payload, setActions: value => { actions = value; }, allActions,
    async close() { await host.services.stopAll(); await host.controlApi.stop(); for (const socket of websocket.clients) socket.terminate(); await new Promise(resolve => websocket.close(resolve)); }
  };
}
module.exports = { fixture };
