const assert = require("node:assert/strict"), fs = require("node:fs"), os = require("node:os"), path = require("node:path"), zlib = require("node:zlib"), AdmZip = require("adm-zip");
const { fixture } = require("./countdown-fixture");
async function main() { const root = fs.mkdtempSync(path.join(os.tmpdir(), "countdown-module-")); let test;
  try {
    test = await fixture(root); const zip = new AdmZip(path.join(test.output, "countdown-1.1.1.streammodule"));
    const bytes = Buffer.from(zip.readAsText("streamerbot/countdown.sb"), "base64"), exported = JSON.parse(zlib.gunzipSync(bytes.subarray(4)));
    const actions = exported.data.actions, ids = new Set(actions.map(action => action.id)); assert.equal(actions.length, 8);
    assert.equal(actions.filter(action => action.triggers.length).length, 1); assert.equal(actions.find(action => action.name === "Countdown - Initialize").triggers[0].type, 706);
    for (const action of actions) for (const sub of action.subActions) if (sub.type === 4) assert.ok(ids.has(sub.actionId));
    for (const entry of zip.getEntries().filter(entry => /\.(js|css|html|cs)$/.test(entry.entryName))) assert.equal(/127\.0\.0\.1:3124|\/api\/stream\/|Chat - All Platforms/.test(zip.readAsText(entry)), false);
    assert.equal(test.host.services.services.size, 0); assert.equal(test.calls.length, 0);
    let modules = (await test.host.listModules()).modules; assert.equal(modules.find(item => item.id === "countdown").state, "ready");
    test.setActions([]); assert.equal((await test.host.listModules()).modules.find(item => item.id === "countdown").state, "streamerbot-required");
    test.setActions(test.allActions);
    const modern = test.host.publicInstalledModules().modules.find(item => item.id === "countdown"); assert.ok(modern.extensionOverlayUrl.endsWith("/countdown/overlay/index.html"));
    assert.equal(test.host.publicInstalledModules(undefined, false).modules.find(item => item.id === "countdown").extensionOverlayUrl, "");
    assert.equal((await fetch(modern.extensionOverlayUrl)).status, 200);
    console.log("Countdown package passed: self-contained action references/startup, no monolith/chat/launch dependency, no service, explicit import states and renderer registration.");
  } finally { await test?.close(); assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep)); fs.rmSync(root, { recursive: true, force: true }); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
