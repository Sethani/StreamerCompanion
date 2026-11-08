const assert = require('node:assert/strict');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');
const { fixture } = require('./shoutout-clips-fixture');
const temporary = path.resolve(process.argv[3]); app.setPath('userData', temporary); app.commandLine.appendSwitch('disable-gpu');
const windows = []; let test, failed = false;
function window() { const value = new BrowserWindow({ show: false, width: 1600, height: 1000, transparent: true, webPreferences: { contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } }); windows.push(value); return value; }
async function waitFor(check, label) { const deadline = Date.now() + 12000; while (Date.now() < deadline) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 60)); } throw Error('Timed out: ' + label); }
async function main() {
  await app.whenReady(); test = await fixture(path.join(temporary, 'data'), process.argv[4]);
  const dock = window(), overlay = window(), combined = window(), externalRequests = [];
  dock.webContents.session.webRequest.onBeforeRequest((details, callback) => {
    if (/^https:\/\/(mustachedmaniac.com|clips.twitch.tv)\//.test(details.url)) { externalRequests.push(details.url); callback({ cancel: true }); }
    else if (!/^http:\/\/127\.0\.0\.1:|^ws:\/\/127\.0\.0\.1:|^devtools:|^data:/.test(details.url)) callback({ cancel: true });
    else callback({});
  });
  const registrations = test.host.publicInstalledModules().modules;
  const registration = registrations.find(item => item.packageId === 'shoutout-clips');
  await dock.loadURL(registration.nodeUrl); await overlay.loadURL(registration.extensionOverlayUrl);
  const view = code => dock.webContents.executeJavaScript(code), output = code => overlay.webContents.executeJavaScript(code);
  await waitFor(() => view("document.getElementById('status').textContent.includes('v2.1.0')"), 'dock connection');
  assert.equal(await output('getComputedStyle(document.body).backgroundColor'), 'rgba(0, 0, 0, 0)');
  const initial = JSON.stringify(test.payload().config);
  await view("document.getElementById('x').value='222';document.getElementById('x').dispatchEvent(new Event('input'))"); test.publish();
  await new Promise(resolve => setTimeout(resolve, 250));
  assert.equal(await view("document.getElementById('x').value"), '222'); assert.equal(JSON.stringify(test.payload().config), initial);
  await view("document.getElementById('form').requestSubmit()");
  await waitFor(() => test.payload().config.clip.x === 222, 'saved layout');
  await view("document.getElementById('clip-id').value='SyntheticClip';document.getElementById('channel').value='Fixture';document.getElementById('title').value='<script>safe text</script>';document.getElementById('duration').value='30';document.getElementById('play').click()");
  await waitFor(() => output("document.getElementById('shoutoutclip-frame').getAttribute('src')?.includes('mustachedmaniac.com')"), 'retained provider URL');
  await waitFor(() => externalRequests.length > 0, 'first navigation');
  assert.equal(await output("document.getElementById('shoutoutclip-label').textContent"), 'Fixture - <script>safe text</script>');
  assert.equal(await output("document.getElementById('shoutoutclip-frame').style.left"), '222px');
  assert.equal(await output("getComputedStyle(document.getElementById('shoutoutclip-label')).fontWeight"), '800');
  const first = test.payload().clip.startedAtMs, before = externalRequests.length;
  await view("document.getElementById('play').click()");
  await waitFor(() => test.payload().clip.startedAtMs > first && externalRequests.length > before, 'identical clip replay');
  test.action('Shoutout Clips - Stop', { startedAtMs: first });
  assert.equal(test.payload().clip.visible, true);
  await view("document.getElementById('player').value='twitch';document.getElementById('muted').checked=true;document.getElementById('form').requestSubmit()");
  await waitFor(() => output("document.getElementById('shoutoutclip-frame').getAttribute('src')?.includes('muted=true')"), 'Twitch mute URL');
  const twitch = new URL(await output("document.getElementById('shoutoutclip-frame').src"));
  assert.equal(twitch.hostname, 'clips.twitch.tv'); assert.ok(twitch.searchParams.getAll('parent').includes('127.0.0.1'));
  test.payload().clip.hideAtMs = Date.now() - 1; test.publish();
  await waitFor(() => !test.payload().clip.visible, 'guarded expiry Stop');
  await waitFor(() => output("!document.getElementById('shoutoutclip-frame').hasAttribute('src')"), 'idle iframe cleared');
  const stopCalls = test.calls.filter(call => call.name === 'Shoutout Clips - Stop').length;
  await new Promise(resolve => setTimeout(resolve, 350));
  assert.equal(test.calls.filter(call => call.name === 'Shoutout Clips - Stop').length, stopCalls);
  await combined.loadURL(registrations.find(item => item.packageId === 'universal-overlay').extensionOverlayUrl);
  await waitFor(() => combined.webContents.executeJavaScript("document.querySelectorAll('iframe[data-module=shoutoutclip]').length===1"), 'shared overlay registration');
  assert.equal(await combined.webContents.executeJavaScript("document.querySelector('iframe[data-module=shoutoutclip]').getAttribute('allow')"), 'autoplay');
  assert.equal(test.calls.some(call => /Chat|Shoutout$/.test(call.name)), false);
  console.log('Hidden Shoutout Clips passed: copied controls/style, unsaved edits, same-clip replay, provider URLs/mute, transparent idle, guarded expiry and one shared-overlay renderer. External player requests were intercepted; no chat or live media played.');
}
main().catch(error => { console.error(error.stack); failed = true; }).finally(async () => { for (const value of windows) value.destroy(); await test?.close(); app.exit(failed ? 1 : 0); });
