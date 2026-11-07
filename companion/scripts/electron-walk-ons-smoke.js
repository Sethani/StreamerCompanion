const assert = require("node:assert/strict");
const path = require("node:path");
const { app, BrowserWindow } = require("electron");
const { fixture } = require("./walk-ons-fixture");
const temporary = path.resolve(process.argv[3]); app.setPath("userData", temporary); app.commandLine.appendSwitch("disable-gpu"); app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
let test, failed = false; const windows = [];
function window() { const value = new BrowserWindow({ show: false, width: 760, height: 700, transparent: true, webPreferences: { contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } }); windows.push(value); return value; }
async function waitFor(check, label) { const deadline = Date.now() + 10000; while (Date.now() < deadline) { if (await check()) return; await new Promise((resolve) => setTimeout(resolve, 60)); } throw new Error("Timed out: " + label); }
async function main() {
  await app.whenReady(); test = await fixture(path.join(temporary, "data"));
  const dock = window(), overlay = window(); const registration = test.host.publicInstalledModules().modules.find((item) => item.packageId === "walk-ons");
  await overlay.loadURL(registration.extensionOverlayUrl); await dock.loadURL(registration.nodeUrl);
  const view = (code) => dock.webContents.executeJavaScript(code), output = (code) => overlay.webContents.executeJavaScript(code);
  await waitFor(() => view("document.getElementById('status').textContent.includes('0 configured')"), "empty roster");
  assert.equal(await output("getComputedStyle(document.body).backgroundColor"), "rgba(0, 0, 0, 0)");
  await view("document.getElementById('refresh-media').click()");
  await waitFor(() => view("document.getElementById('sound-value').options[0]?.textContent==='entrance'"), "private audio registered");
  await view("document.getElementById('login').value='fixture_viewer';document.getElementById('type').value='sound';document.getElementById('type').dispatchEvent(new Event('change'));document.getElementById('sound-value').selectedIndex=0;document.getElementById('walkon-form').requestSubmit()");
  await waitFor(() => view("document.getElementById('walkon-list').textContent.includes('fixture_viewer')"), "roster save");
  await view("[...document.querySelectorAll('#walkon-list button')].find(button=>button.textContent==='Test').click()");
  await waitFor(() => test.calls.some((call) => call.name === "Walk Ons - Test"), "test action");
  await waitFor(() => test.calls.some((call) => call.name === "Walk-on Sound - Stop"), "renderer completion handshake");
  assert.ok(test.calls.some((call) => call.name === "Walk Ons - Configure")); assert.ok(test.calls.some((call) => call.name === "Walk Ons - Upsert"));
  assert.equal(test.state().walkOns.session.seen.length, 0, "Tests do not consume first-chat eligibility");
  assert.equal(await output("document.getElementById('player').hasAttribute('src')"), false);
  console.log("Hidden Walk Ons passed: established roster editor, private audio refresh, stable action transport, transparent playback and completion Stop handshake.");
}
main().catch((error) => { console.error(error.stack); failed = true; }).finally(async () => { for (const value of windows) value.destroy(); await test?.close(); app.exit(failed ? 1 : 0); });
