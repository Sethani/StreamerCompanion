'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os'), vm = require('node:vm'), crypto = require('node:crypto');
const { WebAssets } = require('../src/web-assets'), { providerFixture } = require('./phone-deck-provider-fixture');
const { buildModules } = require('../../scripts/build-modules'), AdmZip = require('adm-zip'), zlib = require('node:zlib');
const schema = require('../../modules/phone-deck/service/provider-schema');
const manifest = require('../../modules/sound-player/module.json'), contract = require('../../docs/contracts/sound-player-extraction.json');
const clone = value => JSON.parse(JSON.stringify(value));
async function renderer() {
  const listeners = {}, calls = [], handlers = {}; let plays = 0, pauses = 0;
  const player = { pause() { pauses++; }, load() {}, removeAttribute() {}, play() { plays++; return Promise.resolve(); }, addEventListener(name, fn) { handlers[name] = fn; } };
  const transport = { subscribe(name, fn) { listeners[name] = fn; }, execute(...args) { calls.push(args); return Promise.resolve(); }, refresh() { return Promise.resolve(); }, connect() {}, close() {} };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../../modules/sound-player/web/overlay/app.js'), 'utf8'), { document: { getElementById: () => player }, StreamingTransport: { create: () => transport }, crypto, window: { addEventListener() {} }, Set, Math, Number });
  const state = current => listeners.walkonSound({ payload: { current } });
  const current = { visible: true, requestId: crypto.randomUUID(), startedAtMs: 1, src: 'synthetic.wav', volume: .5, rendererId: '' };
  state(current); assert.equal(plays, 0); assert.equal(calls.length, 0, 'Initial persisted audio must never replay');
  const next = { ...current, requestId: crypto.randomUUID(), startedAtMs: 2 };
  state(next); assert.equal(calls.length, 1); assert.equal(plays, 0, 'Claim must be persisted before audio');
  const rendererId = calls[0][2].rendererId;
  state({ ...next, rendererId }); assert.equal(plays, 1);
  state({ ...next, rendererId, volume: 0 }); assert.equal(plays, 1); assert.equal(player.volume, 0);
  handlers.ended(); await Promise.resolve(); assert.equal(calls.at(-1)[2].rendererOperation, 'complete');
  state({ ...next, rendererId }); assert.equal(plays, 1, 'Repeated snapshots must not replay');
  listeners.connection({ connected: false }); listeners.connection({ connected: true });
  state({ ...next, rendererId }); assert.equal(plays, 1, 'Reconnect must not replay');
  const duplicate = { ...next, startedAtMs: 3, requestId: crypto.randomUUID(), rendererId: crypto.randomUUID() }; state(duplicate); assert.equal(plays, 1, 'Another renderer owns this request');
  assert.ok(pauses > 0);
}
async function routing() {
  const listeners = {}, frames = [];
  const transport = { subscribe(name, fn) { listeners[name] = fn; }, connect() {}, refresh() { return Promise.resolve(); }, getState() { return null; } };
  const document = { querySelectorAll: () => frames, body: { append: frame => frames.push(frame) }, createElement: () => ({ dataset: {}, getAttribute(key) { return this[key]; }, remove() { frames.splice(frames.indexOf(this), 1); } }) };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../../modules/universal-overlay/web/overlay/app.js'), 'utf8'), { StreamingTransport: { create: () => transport }, StreamingModuleRegistry: { load: async () => ({ modules: [{ id: 'sound-player', packageId: 'sound-player', routingId: 'walk-ons', state: 'ready', extensionOverlayUrl: 'http://localhost/sound' }] }) }, document, structuredClone, setInterval() {} });
  await new Promise(resolve => setImmediate(resolve)); listeners.connection({ connected: true });
  const rules = { 'walk-ons': { mode: 'global', scenes: [] }, walkonsound: { mode: 'disabled', scenes: ['Legacy exact scene'] } };
  listeners.moduleRouting({ revision: 1, payload: { modules: rules, currentScene: 'Synthetic' } }); assert.equal(frames.length, 1); assert.equal(frames[0].dataset.module, 'sound-player');
  rules['walk-ons'].mode = 'disabled'; listeners.moduleRouting({ revision: 2, payload: { modules: rules, currentScene: 'Synthetic' } }); assert.equal(frames.length, 0); assert.deepEqual(rules.walkonsound.scenes, ['Legacy exact scene']);
}
async function phone(directory) {
  let fixture;
  try {
    fixture = await providerFixture(directory); const f = fixture;
    f.modules.push({ packageId: manifest.id, name: manifest.name, category: 'Media', state: 'ready', phoneDeck: manifest.ui.phoneDeck });
    for (const action of require('../../modules/sound-player/streamerbot/export.json').data.actions) f.actions.push({ id: action.id, name: action.name, enabled: true });
    const payload = { phoneDeckVersion: 1, config: { library: { tone: { label: 'Tone', enabled: true, src: 'private-hidden-path' }, disabled: { label: 'Hidden', enabled: false } }, pools: { mix: { label: 'Mix', enabled: true } }, settings: { masterVolumePercent: 100 } }, current: { visible: false, label: '', lastError: '' }, phoneDeckResults: {} };
    f.globals['portable.walkonSound.state'] = { payload };
    f.onAction(message => { payload.phoneDeckResults[message.args.requestId] = { status: 'completed' }; });
    await f.deck.connect(); await f.enable();
    const providers = f.deck.service.providers, saved = JSON.stringify(f.deck.service.config);
    const entry = providers.catalog().find(g => g.packageId === 'sound-player');
    assert.equal(entry.controls.length, 6); assert.deepEqual(entry.resources.sounds.map(x => x.id), ['tone']); assert.equal(JSON.stringify(entry).includes('private-hidden-path'), false);
    const control = entry.controls.find(c => c.id === 'play');
    const ref = { packageId: 'sound-player', controlId: 'play', providerRevision: control.providerRevision, values: { sound: 'tone' } };
    const result = await providers.execute(ref, 'button', {}, crypto.randomUUID());
    assert.equal(result.status, 'completed'); assert.equal(f.writes.at(-1).action.id, contract.newActions['Sound Player - Play']);
    assert.equal(f.writes.at(-1).args.id, 'tone'); assert.equal(f.writes.at(-1).args.src, undefined);
    payload.phoneDeckVersion = 0; await providers.refresh(); assert.ok(providers.catalog().find(g => g.packageId === 'sound-player').controls.every(c => c.reason));
    assert.equal(JSON.stringify(f.deck.service.config), saved, 'Discovery/operations must not edit layout');
    const old = require('../../modules/walk-ons/module.json').ui.phoneDeck;
    for (const c of old.controls) assert.equal(schema.revision(old, c), contract.existingWalkOnsPhoneRevisions[c.id], 'Existing phone cards remain valid');
  } finally { await fixture?.close(); }
}
function media(directory) {
  const manifests = { 'walk-ons': { media: { kind: 'audio', owner: 'sound-player' } }, 'sound-player': { media: { kind: 'audio' } } };
  const assets = new WebAssets({ dataDirectory: directory, port: () => 39999, registry: { readManifest: id => manifests[id] } });
  const file = path.join(directory, 'fixture.wav'); fs.writeFileSync(file, 'synthetic-only');
  const entries = assets.importMedia('walk-ons', [file]); assert.match(entries[0].src, /\/sound-player\//); assert.deepEqual(assets.listMedia('walk-ons'), assets.listMedia('sound-player'));
  assert.equal(fs.existsSync(assets.mediaDirectory('walk-ons')), false, 'Legacy import must not create another active library');
  const old = assets.mediaDirectory('walk-ons'), id = crypto.randomUUID(), filename = id + '.wav'; fs.mkdirSync(old, { recursive: true });
  fs.writeFileSync(path.join(old, filename), 'preserved-audio'); fs.writeFileSync(path.join(old, 'index.json'), JSON.stringify([{ id, filename, label: 'Old tone', size: 15 }]));
  const baseline = fs.readFileSync(path.join(old, filename));
  assert.deepEqual(assets.copyAliasedMedia('walk-ons'), { owner: 'sound-player', files: 1, copied: 1 });
  assert.deepEqual(fs.readFileSync(path.join(assets.mediaDirectory('sound-player'), filename)), baseline); assert.deepEqual(fs.readFileSync(path.join(old, filename)), baseline);
  assert.equal(assets.copyAliasedMedia('walk-ons').copied, 0, 'Copy must be idempotent');
  fs.writeFileSync(path.join(assets.mediaDirectory('sound-player'), filename), 'collision'); assert.throws(() => assets.copyAliasedMedia('walk-ons'), /collision/); assert.deepEqual(fs.readFileSync(path.join(old, filename)), baseline);
  manifests['sound-player'].media.owner = 'walk-ons'; assert.throws(() => assets.listMedia('walk-ons'), /alias/); delete manifests['sound-player'].media.owner;
  delete manifests['sound-player']; assert.throws(() => assets.importMedia('walk-ons', [file]), /Install sound-player/);
}
function packages(directory) {
  const catalog = buildModules(['sound-player', 'walk-ons', 'video'], { output: path.join(directory, 'packages') }), ids = new Set();
  for (const entry of catalog.modules) {
    const zip = new AdmZip(path.join(directory, 'packages', path.basename(new URL(entry.package.url).pathname))), m = JSON.parse(zip.readAsText('module.json'));
    const bytes = Buffer.from(zip.readAsText(m.streamerbot.importFile), 'base64'), exported = JSON.parse(zlib.gunzipSync(bytes.subarray(4)));
    for (const action of exported.data.actions) { assert.equal(ids.has(action.id), false, 'Packages cannot overlap action IDs'); ids.add(action.id); }
    if (entry.id !== 'sound-player') continue;
    assert.deepEqual(exported.data.actions.map(a => a.id), Object.values(contract.newActions)); assert.ok(exported.data.actions.every(a => a.name === 'Sound Player - Initialize' ? a.triggers.length === 1 && a.triggers[0].type === 706 : !a.triggers.length));
    const source = Buffer.from(exported.data.actions[0].subActions[0].byteCode, 'base64').toString(); assert.ok(source.includes('private static readonly object StateLock'));
    assert.ok(zip.getEntry('web/sound/app.js')); assert.ok(zip.getEntry('web/overlay/app.js')); assert.ok(zip.getEntry('DEVELOPMENT.md')); assert.equal(m.service, undefined);
    assert.equal(m.ui.routingId, 'walk-ons'); assert.equal(m.dependencies.modules['walk-ons'], undefined); assert.equal(m.dependencies.modules.video, undefined);
    assert.equal(zip.getEntries().some(e => /\.(wav|mp3|ogg|m4a)$/.test(e.entryName)), false);
  }
}
async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'companion-sound-'));
  try { await renderer(); await routing(); media(root); packages(root); await phone(path.join(root, 'phone')); console.log('Sound Player passed: no snapshot/reconnect replay, persisted claims before playback, volume without restart, owner/routing isolation, hash-preserving media copy/aliases/collisions, independent package/IDs, real Phone Deck discovery/dispatch/acknowledgement, safe projections and unchanged Walk Ons card revisions.'); }
  finally { assert.ok(root.startsWith(os.tmpdir() + path.sep)); fs.rmSync(root, { recursive: true, force: true }); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
