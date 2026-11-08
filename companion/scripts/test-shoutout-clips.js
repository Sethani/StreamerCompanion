const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const AdmZip = require('adm-zip');
const { fixture } = require('./shoutout-clips-fixture');
async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'shoutout-clips-test-')); let test;
  try {
    test = await fixture(root, process.argv[2]);
    const zip = new AdmZip(path.join(root, 'packages', 'shoutout-clips-2.1.0.streammodule'));
    const bytes = Buffer.from(zip.readAsText('streamerbot/shoutout-clips.sb'), 'base64');
    const exported = JSON.parse(zlib.gunzipSync(bytes.subarray(4)));
    const manifest = JSON.parse(zip.readAsText('module.json'));
    assert.equal(bytes.subarray(0, 4).toString(), 'SBAE');
    assert.equal(exported.data.actions.length, 6);
    assert.deepEqual(exported.data.actions.map(action => action.name), manifest.streamerbot.requiredActions);
    assert.equal(exported.data.actions.find(action => action.name === 'Shoutout Clips - Engine').id, '6598455d-ea31-4d66-bdaa-45cf7c6d9a63');
    assert.equal(exported.data.actions.find(action => action.name === 'Shoutout Clips - Play').id, '136a6a6b-47d2-427c-b101-5f84d8cae707');
    assert.equal(exported.data.actions.find(action => action.name === 'Shoutout Clips - Initialize').id, '4fc94614-380a-47a7-ba38-923753db0622');
    assert.equal(exported.data.actions.find(action => action.name === 'Shoutout Clips - Health').id, '459876a1-46a7-4f2c-98f2-c5382ce62a9f');
    assert.equal(exported.data.actions.find(action => action.name === 'Shoutout Clips - Configure').id, '9f420571-09ec-4025-9e88-4d7ab0b1b7d4');
    assert.equal(exported.data.actions.find(action => action.name === 'Shoutout Clips - Stop').id, 'e91420c4-f85a-474d-990a-64cae0a27af3');
    assert.equal(exported.data.actions.find(action => action.name === 'Shoutout Clips - Initialize').triggers[0].type, 706);
    assert.equal(exported.data.commands.length, 0); assert.equal(exported.data.queues.length, 0);
    const source = Buffer.from(exported.data.actions[0].subActions[0].byteCode, 'base64').toString();
    assert.ok(source.includes('portable.shoutoutClip.state'));
    assert.equal(/3124|7474|streamingFeatureBackends|autoShoutout|OAuth|OneDrive|Laptop/.test(source), false);
    assert.deepEqual(manifest.ui.overlays, ['shoutoutClip']);
    assert.equal(manifest.ui.id, 'shoutoutclip');
    assert.equal(manifest.ui.transport.feature, 'shoutoutClip');
    assert.equal(manifest.service, undefined);
    assert.ok(zip.getEntry('third-party/external-players.txt'));
    for (const entry of zip.getEntries()) assert.equal(/\.(mp4|png|jpg|wav|db)$/.test(entry.entryName), false);
    const registration = (await test.host.listModules()).modules.find(item => item.id === 'shoutout-clips');
    assert.equal(registration.state, 'ready');
    assert.ok(registration.ui.nodeUrl.endsWith('/shoutout-clips/shoutout-clips/index.html'));
    assert.ok(registration.ui.extensionOverlayUrl.endsWith('/shoutout-clips/overlay/index.html'));
    for (const asset of ['shoutout-clips/index.html', 'shoutout-clips/app.js', 'shoutout-clips/styles.css', 'overlay/index.html', 'overlay/app.js', 'overlay/styles.css']) {
      assert.equal((await fetch(test.base + '/api/public/assets/shoutout-clips/' + asset)).status, 200);
    }
    const saved = JSON.stringify(test.payload().config);
    await test.host.installModulePackage(path.join(root, 'packages', 'shoutout-clips-2.1.0.streammodule'));
    assert.equal(JSON.stringify(test.payload().config), saved);
    console.log('Shoutout Clips passed: package/privacy, stable actions, native transport, ready inventory, copied assets and repeat installation.');
  } finally { await test?.close(); assert.ok(root.startsWith(os.tmpdir() + path.sep)); fs.rmSync(root, { recursive: true, force: true }); }
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
