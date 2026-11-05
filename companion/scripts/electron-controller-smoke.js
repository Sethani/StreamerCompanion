const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const { app, BrowserWindow } = require("electron");
const { buildModules } = require("../../scripts/build-modules"), { fixture } = require("./controller-fixture");
const bundle = path.resolve(process.argv[2]), temporary = path.resolve(process.argv[3]);
const { CompanionRegistry } = require(path.join(bundle, "resources/app.asar/src/module-registry"));
app.setPath("userData", temporary); app.commandLine.appendSwitch("disable-gpu");
let test; const windows = [];
function hiddenWindow() { const result = new BrowserWindow({ width: 1920, height: 1080, show: false, webPreferences: { contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } }); windows.push(result); return result; }
async function waitFor(check, label) { const deadline = Date.now() + 12000; while (Date.now() < deadline) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 50)); } throw new Error("Timed out: " + label); }
async function main() {
  await app.whenReady(); buildModules(["controller-input"], { output: path.join(temporary, "packages") });
  const registry = new CompanionRegistry({ dataDirectory: path.join(temporary, "modules") }); const staged = registry.stage(path.join(temporary, "packages/controller-input-1.1.0.streammodule")); registry.commit(staged); registry.finalize(staged);
  test = await fixture(temporary, path.join(registry.moduleDirectory("controller-input"), "service/runtime.js"));
  const settings = hiddenWindow(), overlay = hiddenWindow(); await settings.loadURL(test.base + "/settings"); await overlay.loadURL(test.base + "/overlay");
  const control = code => settings.webContents.executeJavaScript(code), view = code => overlay.webContents.executeJavaScript(code);
  await waitFor(() => control("document.getElementById('width').value==='260'"), "legacy layout defaults");
  assert.equal(await view("document.getElementById('controller-box').hidden"), true);
  await control("document.getElementById('enabled').checked=true;document.getElementById('settings').requestSubmit()");
  await waitFor(() => view("!document.getElementById('controller-box').hidden && document.querySelector('[data-button=\"0\"]').classList.contains('pressed')"), "native fixture lights A button");
  assert.equal(await view("getComputedStyle(document.documentElement).backgroundColor"), "rgba(0, 0, 0, 0)");
  assert.equal(await view("getComputedStyle(document.querySelector('.controller-body')).borderTopWidth"), "8px");
  assert.equal(await view("getComputedStyle(document.getElementById('controller-box')).left"), "1420px");
  assert.equal(await view("document.querySelector('.stick-left i').style.transform"), "translate(6px, -6px)");
  await control("document.getElementById('test').click()"); await waitFor(() => view("!document.getElementById('test-label').hidden && document.querySelector('[data-button=\"6\"]').classList.contains('pressed')"), "live simulation displayed");
  assert.deepEqual(test.state.pads[0].pressed, [0], "Test must not change native input");
  await control("document.getElementById('clear').click()"); await waitFor(() => view("document.getElementById('test-label').hidden && !document.querySelector('[data-button=\"6\"]').classList.contains('pressed')"), "clear returns to real fixture input");
  test.state.pads = [{ index: 1, connected: true, pressed: [1], axes: [0, 0, 0, 0] }];
  await control("document.getElementById('controllerIndex').value='0';document.getElementById('settings').requestSubmit()");
  await waitFor(() => view("!document.getElementById('controller-local').classList.contains('connected')"), "specific controller index respected");
  await control("document.getElementById('controllerIndex').value='1';document.getElementById('width').value='400';document.getElementById('settings').requestSubmit()");
  await waitFor(() => view("document.querySelector('[data-button=\"1\"]').classList.contains('pressed') && document.getElementById('controller-box').style.width==='400px'"), "selected controller and saved size");
  const output = path.resolve(__dirname, "../out"); fs.mkdirSync(output, { recursive: true }); fs.writeFileSync(path.join(output, "controller-overlay-preview.png"), (await overlay.webContents.capturePage()).toPNG());
  test.state.paused = true; test.state.now = Date.now() + 2000;
  await waitFor(() => view("document.querySelectorAll('[data-button].pressed').length===0"), "stale input cannot leave stuck buttons");
  assert.ok(windows.every(window => !window.isVisible()));
  console.log("Hidden Controller UI passed: original CSS drawing, legacy layout, selected input/buttons/sticks, synthetic live test/clear, transparent canvas and stale-state clearing.");
}
const timeout = setTimeout(() => { console.error("Controller desktop acceptance timed out"); app.exit(1); }, 60000);
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { clearTimeout(timeout); for (const window of windows) if (!window.isDestroyed()) window.destroy(); await test?.close(); app.exit(process.exitCode || 0); });
