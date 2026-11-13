const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { once } = require('node:events');
const { WebSocketServer } = require('ws');
const { buildModules } = require('../../scripts/build-modules');
const { CompanionHost } = require('../src/companion-host');

async function fixture(root, packageFile) {
  const output = path.join(root, 'packages');
  const catalog = buildModules(['universal-dock', 'source-modules', 'universal-overlay', 'shoutout-clips'], { output });
  const calls = [], globals = new Map(); let revision = 0, lastStart = 0;
  const config = { schemaVersion: 2, maximumDurationSeconds: 60, clip: { x: 463, y: 245, width: 960, height: 540, scaleX: 1, scaleY: 1, muted: false, playerMode: 'mustached' }, label: { fontSize: 24, textColour: '#f8fbff', backgroundColour: '#000000', backgroundOpacityPercent: 68 } };
  let payload = { moduleVersion: '2.1.0', config, clip: { visible: false, startedAtMs: null } };
  const websocket = new WebSocketServer({ host: '127.0.0.1', port: 0 }); await once(websocket, 'listening');
  function publish() {
    const envelope = { schemaVersion: 1, feature: 'shoutoutClip', type: 'state', revision: ++revision, payload };
    globals.set('portable.shoutoutClip.state', JSON.stringify(envelope));
    for (const socket of websocket.clients) if (socket.readyState === 1) socket.send(JSON.stringify({ event: { source: 'General', type: 'Custom' }, data: envelope }));
  }
  function action(name, args = {}) {
    calls.push({ name, args });
    if (name === 'Shoutout Clips - Configure') payload.config = JSON.parse(args.config);
    if (name === 'Shoutout Clips - Play') {
      lastStart = Math.max(Date.now(), lastStart + 1);
      const durationMs = Math.max(1000, Math.min(Number(args.durationMs || 60000), payload.config.maximumDurationSeconds * 1000));
      payload.clip = { visible: true, clipId: args.clipId, channel: args.channel, title: args.title, durationMs, startedAtMs: lastStart, hideAtMs: lastStart + durationMs };
    }
    if (name === 'Shoutout Clips - Stop' && (!args.startedAtMs || args.startedAtMs === payload.clip.startedAtMs)) payload.clip = { visible: false, startedAtMs: null };
    publish();
  }
  publish();
  globals.set('portable.moduleRouting.state', JSON.stringify({ schemaVersion: 1, feature: 'moduleRouting', type: 'state', revision: 1, payload: { currentScene: 'Synthetic', modules: { shoutoutclip: { mode: 'global', scenes: [] } } } }));
  websocket.on('connection', socket => socket.on('message', raw => {
    const request = JSON.parse(raw); let response = {};
    if (request.request === 'GetActions') response.actions = catalog.modules.flatMap(item => item.streamerbot.requiredActions).map(name => ({ name }));
    else if (request.request === 'GetGlobal') response.variables = { [request.variable]: { name: request.variable, value: globals.get(request.variable) } }; else if (request.request === 'GetGlobals') response.variables = [...globals].map(([variableName, value]) => ({ variableName, value }));
    else if (request.request === 'DoAction') action(request.action.name, request.args || {});
    else if (request.request !== 'Subscribe') throw Error('Unexpected fixture request: ' + request.request);
    socket.send(JSON.stringify({ id: request.id, status: 'ok', ...response }));
  }));
  const reservation = http.createServer(); reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening');
  const port = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
  const host = new CompanionHost({ version: '1.3.1', dataDirectory: path.join(root, 'data'), controlApiPort: port, streamerBotUrl: `ws://127.0.0.1:${websocket.address().port}/`, catalogFetch: async url => {
    const item = catalog.modules.find(entry => entry.package.url === url);
    if (!item) throw Error('External request blocked');
    return new Response(fs.readFileSync(packageFile && item.id === 'shoutout-clips' ? packageFile : path.join(output, path.basename(new URL(url).pathname))));
  } });
  host.catalog.catalog = catalog; host.start(); await once(host.controlApi.server, 'listening');
  try {
    await host.installCatalogModule('shoutout-clips');
    await host.installCatalogModule('universal-overlay'); await host.installCatalogModule('source-modules');
  } catch (error) { await host.controlApi.stop(); for (const socket of websocket.clients) socket.terminate(); await new Promise(resolve => websocket.close(resolve)); throw error; }
  return { host, websocket, calls, action, publish, payload: () => payload, base: `http://127.0.0.1:${host.controlApi.port}`, async close() { await host.controlApi.stop(); for (const socket of websocket.clients) socket.terminate(); await new Promise(resolve => websocket.close(resolve)); } };
}
module.exports = { fixture };
