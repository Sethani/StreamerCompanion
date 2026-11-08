const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const zlib = require("node:zlib");
const { once } = require("node:events");
const AdmZip = require("adm-zip");
const { WebSocketServer } = require("ws");
const { buildModules } = require("../../scripts/build-modules");
const { CompanionHost } = require("../src/companion-host");

async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "walk-ons-module-"));
  let host, websocket;
  try {
    const output = path.join(root, "packages");
    const catalog = buildModules(["universal-dock", "walk-ons"], { output });
    const packagePath = path.join(output, "walk-ons-2.1.1.streammodule");
    const zip = new AdmZip(packagePath);
    const manifest = JSON.parse(zip.readAsText("module.json"));
    const bytes = Buffer.from(zip.readAsText("streamerbot/walk-ons.sb"), "base64");
    assert.equal(bytes.subarray(0, 4).toString(), "SBAE");
    const exported = JSON.parse(zlib.gunzipSync(bytes.subarray(4)));
    const actions = exported.data.actions;
    assert.deepEqual(actions.map((action) => action.name), manifest.streamerbot.requiredActions);
    assert.equal(actions.length, 16);
    assert.equal(manifest.media.kind, "audio");
    assert.deepEqual(manifest.ui.overlays, ["walkonsound"]);
    assert.equal(manifest.service, undefined);
    assert.equal(manifest.dependencies.modules["universal-dock"], "^1.1.1");
    assert.equal(manifest.dependencies.optionalModules.video, "^2.2.0");
    assert.deepEqual(manifest.ui.transports, [{ feature: "walkonSound", stateKey: "portable.walkonSound.state", actionPrefix: "Walk-on Sound" }]);

    const expected = {
      "Walk Ons - Engine": "1c5845b8-8d8f-4925-9574-8ded37c47a57",
      "Walk Ons - Initialize": "797c8387-eec5-4ad6-ab21-90087878a8a7",
      "Walk Ons - Health": "67c4d969-dd53-476e-9741-787f3f863651",
      "Walk Ons - Configure": "398eb54a-67fc-4b62-b17f-d73584502b91",
      "Walk Ons - Upsert": "1b67e346-f797-49b1-b980-cc31f2e1f442",
      "Walk Ons - Delete": "acaf2cf0-4b7d-4925-99a1-194ee2ddf5ee",
      "Walk Ons - Add": "61dfe17d-2cd6-4c08-a768-095859a4f943",
      "Walk Ons - Remove": "15ce924c-effa-418d-bdc4-832b7061df06",
      "Walk Ons - List": "aec7f550-89c9-4aa9-a58e-7003af30dc78",
      "Walk Ons - Chat Watcher": "766609f1-0b00-4805-a7f3-b0369ba244f9",
      "Walk Ons - Reset Session": "fb01f2b6-646c-4f19-b3e6-67557f330d67",
      "Walk Ons - Test": "75744c13-b2d7-4a44-af5f-8f5263da7b9f",
      "Walk-on Sound - Engine": "3999caa3-0625-419f-be94-eaa3fcee8cb9",
      "Walk-on Sound - Initialize": "11b4bbee-286a-46d8-9c3f-6d85ec7a3ec3",
      "Walk-on Sound - Play": "7b2a868f-867f-404b-ab47-0e1f58e335d1",
      "Walk-on Sound - Stop": "16f3bce9-9c70-4791-98b5-bef600897957"
    };
    for (const [name, id] of Object.entries(expected)) assert.equal(actions.find((action) => action.name === name).id, id, name);
    assert.equal(actions.find((action) => action.name === "Walk Ons - Initialize").triggers[0].type, 706);
    assert.equal(actions.find((action) => action.name === "Walk-on Sound - Initialize").triggers[0].type, 706);
    assert.equal(actions.find((action) => action.name === "Walk Ons - Chat Watcher").triggers[0].type, 133);
    assert.deepEqual(exported.data.queues, [{ id: "5f83ca16-0a7e-4ee9-b652-5ee6750223cc", blocking: true, name: "Walk Ons" }]);
    const commands = Object.fromEntries(exported.data.commands.map((command) => [command.command, command]));
    assert.deepEqual(Object.keys(commands), ["!walkonadd", "!walkonlist", "!walkonremove", "!walkonreset"]);
    assert.equal(commands["!walkonadd"].id, "4e7c8d93-4092-476d-bf7b-49eed0b33686");
    assert.equal(commands["!walkonlist"].id, "42a80f6a-bb4b-459c-b752-40771b9255db");
    assert.equal(commands["!walkonremove"].id, "94b47ae9-4eef-403d-8f4e-1e5b326cc1bd");
    assert.equal(commands["!walkonreset"].id, "b7d91a93-e73b-4648-aaf6-edad9e4c0156");
    for (const command of Object.values(commands)) { assert.deepEqual(command.permittedGroups, ["Moderators"]); assert.equal(command.globalCooldown, 5); assert.equal(command.userCooldown, 5); }
    const rosterSource = Buffer.from(actions.find((action) => action.name === "Walk Ons - Engine").subActions[0].byteCode, "base64").toString();
    const audioSource = Buffer.from(actions.find((action) => action.name === "Walk-on Sound - Engine").subActions[0].byteCode, "base64").toString();
    assert.ok(rosterSource.includes("portable.walkOns.state"));
    assert.ok(rosterSource.includes("CPH.RunAction(\"Video - Play\""));
    assert.ok(rosterSource.includes("CPH.RunAction(\"Walk-on Sound - Play\""));
    assert.ok(rosterSource.includes("lastAcceptedRequestId"), "Playback acceptance must be read from persisted state");
    assert.ok(audioSource.includes("/api/public/media/walk-ons/"));
    assert.ok(audioSource.includes("uri.Port == 3135"));
    assert.ok(audioSource.includes("uri.Port == 7474"), "Legacy sound links stay valid until explicitly relinked");
    const archiveText = zip.getEntries().filter((entry) => !entry.isDirectory).map((entry) => entry.getData().toString()).join("\n");
    assert.equal(/sethiduck|ben colijn|onedrive|users[\\/]laptop|lucifer|divinity|hidan/i.test(archiveText), false);
    assert.equal(zip.getEntries().some((entry) => /\.(mp3|wav|ogg|m4a)$/i.test(entry.entryName)), false, "Private audio must not be packaged");

    websocket = new WebSocketServer({ host: "127.0.0.1", port: 0 }); await once(websocket, "listening");
    const requiredActions = catalog.modules.flatMap((item) => item.streamerbot.requiredActions);
    const calls = [];
    websocket.on("connection", (socket) => socket.on("message", (raw) => {
      const request = JSON.parse(raw); let response = {};
      if (request.request === "GetActions") response.actions = requiredActions.map((name) => ({ name }));
      else if (request.request === "GetGlobals") response.variables = [];
      else if (request.request === "Subscribe") {}
      else if (request.request === "DoAction") calls.push(request);
      else throw new Error("Unexpected isolated request: " + request.request);
      socket.send(JSON.stringify({ id: request.id, status: "ok", ...response }));
    }));
    const reservation = http.createServer(); reservation.listen(0, "127.0.0.1"); await once(reservation, "listening"); const port = reservation.address().port; await new Promise((resolve) => reservation.close(resolve));
    host = new CompanionHost({ version: "1.3.1", dataDirectory: path.join(root, "data"), controlApiPort: port, streamerBotUrl: "ws://127.0.0.1:" + websocket.address().port + "/", catalogFetch: async (url) => {
      const item = catalog.modules.find((entry) => entry.package.url === url); if (!item) throw new Error("External request blocked in test.");
      return new Response(fs.readFileSync(path.join(output, path.basename(new URL(url).pathname))));
    } });
    host.catalog.catalog = catalog; host.start(); await once(host.controlApi.server, "listening");
    await host.installCatalogModule("walk-ons");
    const module = (await host.listModules()).modules.find((item) => item.id === "walk-ons");
    assert.equal(module.state, "ready"); assert.equal(module.hasMedia, true); assert.equal(module.mediaKind, "audio");
    const registration = host.publicInstalledModules().modules.find((item) => item.packageId === "walk-ons");
    assert.ok(registration.nodeUrl.endsWith("/walk-ons/walkons/index.html"));
    assert.ok(registration.extensionOverlayUrl.endsWith("/walk-ons/overlay/index.html"));
    assert.equal((await fetch(registration.nodeUrl)).status, 200);
    assert.equal((await fetch(registration.extensionOverlayUrl)).status, 200);
    assert.equal((await fetch(new URL("../../universal-dock/shared/streamerbot-transport.js", registration.nodeUrl))).status, 200);
    const synthetic = path.join(root, "synthetic.mp3"); fs.writeFileSync(synthetic, Buffer.from("synthetic-audio"));
    const media = host.webAssets.importMedia("walk-ons", [synthetic]); assert.equal(media.length, 1); assert.equal(media[0].label, "synthetic");
    const fetched = await fetch(media[0].src, { headers: { Range: "bytes=0-8" } });
    assert.equal(fetched.status, 206); assert.equal(fetched.headers.get("content-type"), "audio/mpeg"); assert.equal(await fetched.text(), "synthetic");
    assert.equal(JSON.stringify(host.webAssets.listMedia("walk-ons")).includes(root), false);
    const upgrade = new AdmZip(packagePath), upgradedManifest = JSON.parse(upgrade.readAsText("module.json")); upgradedManifest.version = "2.1.2"; upgrade.updateFile("module.json", Buffer.from(JSON.stringify(upgradedManifest))); const upgradePath = path.join(root, "upgrade.streammodule"); upgrade.writeZip(upgradePath);
    await host.installModulePackage(upgradePath); assert.equal(host.webAssets.listMedia("walk-ons")[0].src, media[0].src);
    assert.equal(calls.length, 0, "Install, state checks, and media operations must not execute module actions");
    console.log("Walk Ons package passed: stable legacy identities, private audio boundary, dual transport, browser assets, isolated Ready state, range serving and upgrade preservation.");
  } finally {
    await host?.controlApi.stop();
    if (websocket) { for (const socket of websocket.clients) socket.terminate(); await new Promise((resolve) => websocket.close(resolve)); }
    assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep)); fs.rmSync(root, { recursive: true, force: true });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
