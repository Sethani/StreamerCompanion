// Run with the packaged application's embedded Node. Uses only a synthetic Streamer.bot.
const assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path'), http = require('node:http'), { once } = require('node:events');
const bundle = path.resolve(process.argv[2]), archive = path.join(bundle, 'resources/app.asar');
const { CompanionHost } = require(path.join(archive, 'src/companion-host'));
const { WebSocketServer } = require(path.join(archive, 'node_modules/ws'));
async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-routing-github-')); let host, websocket;
  try {
    const probe = http.createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening');
    const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
    let actions = [];
    websocket = new WebSocketServer({ host: '127.0.0.1', port: 0 }); await once(websocket, 'listening');
    websocket.on('connection', socket => socket.on('message', raw => {
      const request = JSON.parse(raw);
      assert.equal(request.request, 'GetActions', 'Installation must never run a chat action');
      socket.send(JSON.stringify({ id: request.id, status: 'ok', actions: actions.map(name => ({ name })) }));
    }));
    host = new CompanionHost({ dataDirectory: root, controlApiPort: port, streamerBotUrl: 'ws://127.0.0.1:' + websocket.address().port + '/' });
    host.start(); await once(host.controlApi.server, 'listening');
    const inventory = await host.catalog.check(); assert.equal(inventory.error, '');
    const entry = inventory.modules.find(item => item.id === 'chat-routing'); assert.equal(entry.version, '1.0.0'); assert.equal(entry.problem, '');
    await host.installCatalogModule('chat-routing');
    const state = async () => (await host.listModules()).modules.find(item => item.id === 'chat-routing').state;
    assert.equal(await state(), 'streamerbot-required');
    actions = host.registry.readManifest('chat-routing').streamerbot.requiredActions;
    assert.equal(actions.length, 4); assert.equal(await state(), 'ready');
    actions = actions.slice(0, 3); assert.equal(await state(), 'streamerbot-required');
    assert.equal(host.services.services.size, 0);
    assert.ok(fs.existsSync(path.join(host.registry.moduleDirectory('chat-routing'), 'streamerbot/chat-routing.sb')));
    console.log('Published Chat Routing passed in packaged host: GitHub catalogue/hash installation, missing-import/Ready states, no child service and no outgoing action call.');
  } finally {
    await host?.services.stopAll(); if (host) await host.controlApi.stop();
    if (websocket) { for (const socket of websocket.clients) socket.terminate(); await new Promise(resolve => websocket.close(resolve)); }
    fs.rmSync(root, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
