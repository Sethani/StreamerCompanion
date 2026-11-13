const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { once } = require("node:events");
const { WebSocketServer } = require("ws");
const { buildModules } = require("../../scripts/build-modules");
const { CompanionHost } = require("../src/companion-host");

function wav() {
  const samples = 2205, data = Buffer.alloc(samples * 2), header = Buffer.alloc(44);
  header.write("RIFF", 0); header.writeUInt32LE(36 + data.length, 4); header.write("WAVEfmt ", 8); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22); header.writeUInt32LE(22050, 24); header.writeUInt32LE(44100, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write("data", 36); header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

async function fixture(root) {
  const output = path.join(root, "packages"), catalog = buildModules(["universal-dock", "walk-ons"], { output });
  const allActions = catalog.modules.flatMap((item) => item.streamerbot.requiredActions), calls = [], globals = new Map(); let revision = 0;
  let walkOns = { schemaVersion: 2, moduleVersion: "2.1.1", config: { roster: {}, sounds: {}, settings: { oncePerStream: true, defaultVolumePercent: 100 } }, session: { seen: [] }, lastEvent: null };
  let sound = { serverTimeMs: Date.now(), current: { visible: false, startedAtMs: null, lastError: "" } };
  const websocket = new WebSocketServer({ host: "127.0.0.1", port: 0 }); await once(websocket, "listening");
  function publish(feature, payload) {
    const envelope = { schemaVersion: 1, feature, type: "state", revision: ++revision, payload };
    globals.set(feature === "walkOns" ? "portable.walkOns.state" : "portable.walkonSound.state", JSON.stringify(envelope));
    for (const socket of websocket.clients) if (socket.readyState === 1) socket.send(JSON.stringify({ event: { source: "General", type: "Custom" }, data: envelope }));
  }
  publish("walkOns", walkOns); publish("walkonSound", sound);
  function action(name, args = {}) {
    calls.push({ name, args });
    if (name === "Walk Ons - Configure") walkOns.config = JSON.parse(args.config);
    else if (name === "Walk Ons - Upsert") walkOns.config.roster[args.login] = JSON.parse(args.item);
    else if (name === "Walk Ons - Delete") delete walkOns.config.roster[args.login];
    else if (name === "Walk Ons - Reset Session") walkOns.session.seen = args.login && args.login !== "all" ? walkOns.session.seen.filter((item) => item !== args.login) : [];
    else if (name === "Walk Ons - Test") {
      const item = walkOns.config.roster[args.login], selected = item?.type === "soundpool" ? item.choices?.[0]?.value : item?.value, entry = walkOns.config.sounds[selected];
      if (entry) { sound = { serverTimeMs: Date.now(), current: { visible: true, id: selected, src: entry.src, volume: item.volume, startedAtMs: Date.now(), lastStartAtMs: Date.now(), lastError: "" } }; publish("walkonSound", sound); }
    } else if (name === "Walk-on Sound - Stop") { sound = { serverTimeMs: Date.now(), current: { visible: false, startedAtMs: null, lastError: args.error || "" } }; publish("walkonSound", sound); }
    if (name.startsWith("Walk Ons - ")) publish("walkOns", walkOns);
  }
  websocket.on("connection", (socket) => socket.on("message", (raw) => {
    const request = JSON.parse(raw); let response = {};
    if (request.request === "GetActions") response.actions = allActions.map((name) => ({ name }));
    else if (request.request === 'GetGlobal') response.variables = { [request.variable]: { name: request.variable, value: globals.get(request.variable) } }; else if (request.request === "GetGlobals") response.variables = [...globals].map(([variableName, value]) => ({ variableName, value }));
    else if (request.request === "Subscribe") {}
    else if (request.request === "DoAction") action(request.action.name, request.args || {});
    else throw new Error("Unexpected Walk Ons fixture request: " + request.request);
    socket.send(JSON.stringify({ id: request.id, status: "ok", ...response }));
  }));
  const reservation = http.createServer(); reservation.listen(0, "127.0.0.1"); await once(reservation, "listening"); const port = reservation.address().port; await new Promise((resolve) => reservation.close(resolve));
  const host = new CompanionHost({ version: "1.3.1", dataDirectory: path.join(root, "data"), controlApiPort: port, streamerBotUrl: "ws://127.0.0.1:" + websocket.address().port + "/", catalogFetch: async (url) => {
    const item = catalog.modules.find((entry) => entry.package.url === url); if (!item) throw new Error("External request blocked in Walk Ons fixture."); return new Response(fs.readFileSync(path.join(output, path.basename(new URL(url).pathname))));
  } });
  host.catalog.catalog = catalog; host.start(); await once(host.controlApi.server, "listening"); await host.installCatalogModule("walk-ons");
  const source = path.join(root, "entrance.wav"); fs.writeFileSync(source, wav()); const media = host.webAssets.importMedia("walk-ons", [source]);
  return { host, websocket, calls, media, base: "http://127.0.0.1:" + port, state: () => ({ walkOns, sound }), async close() { await host.controlApi.stop(); for (const socket of websocket.clients) socket.terminate(); await new Promise((resolve) => websocket.close(resolve)); } };
}
module.exports = { fixture };
