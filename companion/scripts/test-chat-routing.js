const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), zlib = require('node:zlib');
const AdmZip = require('adm-zip');
const { buildModules } = require('../../scripts/build-modules');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-routing-'));
try {
  buildModules(['chat-routing'], { output });
  const zip = new AdmZip(path.join(output, 'chat-routing-1.0.0.streammodule'));
  const manifest = JSON.parse(zip.readAsText('module.json'));
  const bytes = Buffer.from(zip.readAsText(manifest.streamerbot.importFile), 'base64');
  assert.equal(bytes.subarray(0, 4).toString(), 'SBAE');
  const exported = JSON.parse(zlib.gunzipSync(bytes.subarray(4)));
  const actions = exported.data.actions, ids = new Set(actions.map(a => a.id));
  assert.deepEqual(actions.map(a => a.name), manifest.streamerbot.requiredActions);
  assert.equal(actions.find(a => a.name === 'Chat - All Platforms').id, 'c783e11d-61c0-4586-90f3-d5baba254a35');
  assert.equal(actions.find(a => a.name === 'Chat - Twitch').id, 'dcac5dec-c796-4b8b-9cb6-4271ef4c2f53');
  assert.equal(exported.meta.autoRunAction, null);
  for (const key of ['commands', 'queues', 'timers']) assert.deepEqual(exported.data[key], []);
  const native = [];
  function inspect(items) { for (const sub of items) {
    if (sub.type === 4) assert.ok(ids.has(sub.actionId));
    if ([10, 560].includes(sub.type)) native.push(sub);
    if (sub.type === 99999) assert.ok(Buffer.from(sub.byteCode, 'base64').toString().includes('class CPHInline'));
    inspect(sub.subActions || []);
  } }
  for (const action of actions) { assert.deepEqual(action.triggers, []); inspect(action.subActions); }
  assert.equal(native.length, 2);
  for (const sub of native) { assert.equal(sub.text, '%chatMessage%'); assert.equal(sub.useBot, true); assert.equal(sub.fallback, true); }
  assert.equal(native.find(sub => sub.type === 560).replyId, '%chatReplyId%');
  assert.deepEqual(manifest.ui.actions, []);
  assert.deepEqual(manifest.ui.tests, []);
  assert.equal(manifest.service, undefined);
  console.log('Chat Routing package: stable entry-point IDs, internal references, native bot/reply preferences, embedded engine and no automatic sends passed.');
} finally { fs.rmSync(output, { recursive: true, force: true }); }
