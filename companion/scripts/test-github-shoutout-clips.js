// Verify the published package in the existing app runtime, with a disposable profile.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os'), http = require('node:http'), { once } = require('node:events');
const archive = path.join(path.resolve(process.argv[2]), 'resources/app.asar');
const { CompanionHost } = require(path.join(archive, 'src/companion-host'));
const { WebSocketServer } = require(path.join(archive, 'node_modules/ws'));
async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'shoutout-release-')); let host, websocket;
  try {
    let actions = []; const calls = [];
    websocket = new WebSocketServer({ host: '127.0.0.1', port: 0 }); await once(websocket, 'listening');
    websocket.on('connection', socket => socket.on('message', raw => {
      const request = JSON.parse(raw); calls.push(request); assert.equal(request.request, 'GetActions');
      socket.send(JSON.stringify({ id: request.id, status: 'ok', actions: actions.map(name => ({ name })) }));
    }));
    const reservation = http.createServer(); reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening');
    const port = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
    host = new CompanionHost({ dataDirectory: root, controlApiPort: port, streamerBotUrl: `ws://127.0.0.1:${websocket.address().port}/` });
    host.start(); await once(host.controlApi.server, 'listening');
    const inventory = await host.catalog.check(); assert.equal(inventory.error, '');
    const entry = inventory.modules.find(item => item.id === 'shoutout-clips'); assert.equal(entry.version, '2.1.0'); assert.equal(entry.problem, '');
    assert.deepEqual(new Set(entry.installationPlan.map(item => item.id)), new Set(['universal-dock', 'shoutout-clips']));
    await host.installCatalogModule('shoutout-clips');
    assert.equal((await host.listModules()).modules.find(item => item.id === 'shoutout-clips').state, 'streamerbot-required');
    const manifest = host.registry.readManifest('shoutout-clips'); actions = manifest.streamerbot.requiredActions;
    assert.equal(actions.length, 6); assert.equal(manifest.service, undefined);
    assert.equal((await host.listModules()).modules.find(item => item.id === 'shoutout-clips').state, 'ready');
    const registration = host.publicInstalledModules().modules.find(item => item.packageId === 'shoutout-clips');
    assert.equal(registration.id, 'shoutoutclip'); assert.equal(registration.transport.stateKey, 'portable.shoutoutClip.state');
    for (const url of [registration.nodeUrl, registration.extensionOverlayUrl, new URL('../../universal-dock/shared/streamerbot-transport.js', registration.nodeUrl)]) assert.equal((await fetch(url)).status, 200);
    assert.ok(fs.existsSync(path.join(host.registry.moduleDirectory('shoutout-clips'), 'streamerbot/shoutout-clips.sb')));
    assert.equal(host.services.services.size, 0); assert.equal(calls.some(call => call.request === 'DoAction'), false);
    console.log('Published Shoutout Clips 2.1.0 passed in Companion 1.3.1: real GitHub catalogue/hash installation, Dock dependency, import/Ready states, existing transport/overlay and no service/action.');
  } finally {
    await host?.controlApi.stop();
    if (websocket) { for (const socket of websocket.clients) socket.terminate(); await new Promise(resolve => websocket.close(resolve)); }
    assert.ok(root.startsWith(os.tmpdir() + path.sep)); fs.rmSync(root, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
