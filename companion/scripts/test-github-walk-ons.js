// Released package acceptance in an isolated profile; no production integration.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os'), http = require('node:http'), { once } = require('node:events');
const archive = path.join(path.resolve(process.argv[2]), 'resources/app.asar');
const { CompanionHost } = require(path.join(archive, 'src/companion-host'));
const { WebSocketServer } = require(path.join(archive, 'node_modules/ws'));
async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'walk-ons-release-')); let host, websocket;
  try {
    let actions = []; const calls = [];
    websocket = new WebSocketServer({ host: '127.0.0.1', port: 0 }); await once(websocket, 'listening');
    websocket.on('connection', socket => socket.on('message', raw => {
      const request = JSON.parse(raw); calls.push(request); assert.equal(request.request, 'GetActions');
      socket.send(JSON.stringify({ id: request.id, status: 'ok', actions: actions.map(name => ({ name })) }));
    }));
    const reservation = http.createServer(); reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening'); const port = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
    host = new CompanionHost({ dataDirectory: root, controlApiPort: port, streamerBotUrl: 'ws://127.0.0.1:' + websocket.address().port + '/' });
    host.start(); await once(host.controlApi.server, 'listening');
    const inventory = await host.catalog.check(); assert.equal(inventory.error, '');
    const entry = inventory.modules.find(item => item.id === 'walk-ons'); assert.equal(entry.version, '2.1.0'); assert.equal(entry.problem, '');
    assert.deepEqual(new Set(entry.installationPlan.map(item => item.id)), new Set(['universal-dock', 'walk-ons']));
    await host.installCatalogModule('walk-ons');
    assert.equal((await host.listModules()).modules.find(item => item.id === 'walk-ons').state, 'streamerbot-required');
    assert.equal(host.registry.readManifest('universal-dock').version, '1.1.1');
    const manifest = host.registry.readManifest('walk-ons'); assert.equal(manifest.media.kind, 'audio'); assert.equal(manifest.service, undefined);
    actions = manifest.streamerbot.requiredActions;
    assert.equal((await host.listModules()).modules.find(item => item.id === 'walk-ons').state, 'ready');
    const registration = host.publicInstalledModules().modules.find(item => item.packageId === 'walk-ons');
    for (const url of [registration.nodeUrl, registration.extensionOverlayUrl, new URL('../../universal-dock/shared/streamerbot-transport.js', registration.nodeUrl)]) assert.equal((await fetch(url)).status, 200);
    assert.equal(registration.transports[0].feature, 'walkonSound');
    assert.ok(fs.existsSync(path.join(host.registry.moduleDirectory('walk-ons'), 'streamerbot/walk-ons.sb')));
    const sound = path.join(root, 'fixture.wav'); fs.writeFileSync(sound, Buffer.from('synthetic-audio'));
    const media = host.webAssets.importMedia('walk-ons', [sound]); const response = await fetch(media[0].src, { headers: { Range: 'bytes=0-8' } });
    assert.equal(response.status, 206); assert.equal(response.headers.get('content-type'), 'audio/wav'); assert.equal(await response.text(), 'synthetic');
    assert.equal(host.services.services.size, 0); assert.equal(calls.some(call => call.request === 'DoAction'), false);
    console.log('Published Walk Ons 2.1.0 passed: actual GitHub catalogue/hash installation, Dock 1.1.1 dependency, import/Ready states, dual transport, private audio/ranges and no service/action.');
  } finally {
    if (host) await host.controlApi.stop();
    if (websocket) { for (const socket of websocket.clients) socket.terminate(); await new Promise(resolve => websocket.close(resolve)); }
    assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep)); fs.rmSync(root, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
