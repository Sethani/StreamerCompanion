const assert = require("node:assert/strict"), path = require("node:path");
const { app, BrowserWindow } = require("electron"), { fixture } = require("./countdown-fixture");
const bundle = path.resolve(process.argv[2]), temporary = path.resolve(process.argv[3]);
const { CompanionHost } = require(path.join(bundle, "resources/app.asar/src/companion-host"));
app.setPath("userData", temporary); app.commandLine.appendSwitch("disable-gpu");
let test; const windows = [];
function window() { const result = new BrowserWindow({ show: false, width: 1920, height: 1080, webPreferences: { contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } }); windows.push(result); return result; }
async function waitFor(check, label) { const deadline = Date.now() + 12000; while (Date.now() < deadline) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 50)); } throw new Error("Timed out: " + label); }
async function main() {
  await app.whenReady(); test = await fixture(temporary, CompanionHost);
  const dock = window(), overlay = window(); await dock.loadURL(test.base + "/api/public/assets/countdown/countdown/index.html"); await overlay.loadURL(test.base + "/api/public/assets/countdown/overlay/index.html");
  const control = code => dock.webContents.executeJavaScript(code), view = code => overlay.webContents.executeJavaScript(code);
  await waitFor(() => control("document.getElementById('connection').textContent==='Streamer.bot connected'"), "connected dock");
  assert.equal(test.calls.length, 0, "Opening the timer must not run actions");
  assert.equal(await view("document.getElementById('countdown-layer').hidden"), true);
  await control("document.getElementById('initialize').click()");
  await waitFor(() => control("document.getElementById('feedback').textContent==='Saved state loaded.'"), "load saved state without starting timer");
  assert.equal(test.payload().status, "idle");
  await control("document.getElementById('minutes').value='0';document.getElementById('seconds').value='10';document.getElementById('finished-text').value='Synthetic done';document.getElementById('timer-form').dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('save').click()");
  await waitFor(() => control("document.getElementById('feedback').textContent==='Preset saved.'"), "save preset");
  assert.equal(test.payload().status, "idle");
  await control("document.getElementById('timer-form').requestSubmit()");
  await waitFor(() => view("!document.getElementById('countdown-layer').hidden && document.getElementById('countdown-text').textContent==='00:10'"), "live timer rendered");
  assert.equal(await view("getComputedStyle(document.documentElement).backgroundColor"), "rgba(0, 0, 0, 0)");
  assert.equal(await view("getComputedStyle(document.getElementById('countdown-text')).fontSize"), "160px");
  assert.ok((await view("getComputedStyle(document.getElementById('countdown-text')).backgroundImage")).includes("linear-gradient"));
  await control("document.getElementById('pause').click()"); await waitFor(() => test.payload().status === "paused", "pause command");
  const frozen = await view("document.getElementById('countdown-text').textContent"); await new Promise(resolve => setTimeout(resolve, 350)); assert.equal(await view("document.getElementById('countdown-text').textContent"), frozen);
  await control("document.getElementById('resume').click()"); await waitFor(() => test.payload().status === "running", "resume command");
  test.publish({ ...test.payload(), status: "running", endTimeMs: Date.now() - 10, finishedText: "Synthetic\nDone" });
  await waitFor(() => view("document.getElementById('countdown-text').textContent==='Synthetic\\nDone'"), "finished multiline message");
  await control("document.getElementById('clear').click()"); await waitFor(() => view("document.getElementById('countdown-layer').hidden"), "clear hides timer");
  assert.ok(test.calls.every(call => call.name.startsWith("Countdown - ")));
  assert.ok(windows.every(window => !window.isVisible()));
  console.log("Hidden Countdown passed: saved preset, real transport start/pause/resume/clear, original transparent gradient design and multiline finish. No stream/chat/OBS action invoked.");
}
const timeout = setTimeout(() => { console.error("Countdown UI timed out"); app.exit(1); }, 60000);
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { clearTimeout(timeout); for (const window of windows) if (!window.isDestroyed()) window.destroy(); await test?.close(); app.exit(process.exitCode || 0); });
