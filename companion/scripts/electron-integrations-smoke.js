const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { app, BrowserWindow, ipcMain } = require('electron');
const { fixture } = require('./test-browser-foundation');
const { buildModules } = require('../../scripts/build-modules');
const bundle = path.resolve(process.argv[2]), temporary = path.resolve(process.argv[3]), archive = path.join(bundle, 'resources/app.asar');
const { CompanionHost } = require(path.join(archive, 'src/companion-host'));
app.setPath('userData', temporary); app.commandLine.appendSwitch('disable-gpu');
let test, window, failed = false, effects = 0;
async function wait(check, label) { const deadline = Date.now() + 12000; while (Date.now() < deadline) { if (await check()) return; await new Promise(r => setTimeout(r, 50)); } throw new Error('Timed out: ' + label); }
async function main() {
  await app.whenReady(); test = await fixture(path.join(temporary, 'fixture'), CompanionHost);
  await test.host.installCatalogModule('video');
  const catalog = buildModules(undefined, { output: path.join(temporary, 'all') }); test.host.catalog.catalog = catalog;
  for (const id of ['phone-deck', 'local-ai']) {
    const directory = path.join(test.host.registry.dataDirectory, id); fs.mkdirSync(directory);
    fs.copyFileSync(path.join(__dirname, '../../modules', id, 'module.json'), path.join(directory, 'module.json'));
    fs.writeFileSync(path.join(directory, 'README.md'), '# Synthetic guide');
  }
  test.host.registerInstalledServices();
  let ownerState = { status: 'stopped', pid: null, endpoint: { ready: false, configured: false }, logs: [] };
  for (const service of test.host.services.services.values()) {
    service.state = async () => structuredClone(ownerState);
    service.start = async () => { effects++; throw new Error('Discovery must not start services'); };
    service.stop = async () => structuredClone(ownerState);
  }
  const before = JSON.stringify(test.host.services.config);
  ipcMain.handle('integration-test', (_e, method, ...args) => {
    if (method === 'refresh') return test.host.listModules(); if (method === 'services') return test.host.listServices();
    if (method === 'catalog') return test.host.catalog.inventory(); if (method === 'uiPreferences') return test.host.uiPreferences.read();
    if (method === 'apiState') return { port: test.host.controlApi.port }; if (method === 'helpIndex') return test.host.helpGuides.index();
    effects++; throw new Error('Unexpected mutation: ' + method + ' ' + JSON.stringify(args));
  });
  const methods = ['refresh', 'services', 'catalog', 'uiPreferences', 'apiState', 'helpIndex', 'setFavorite', 'moduleLink', 'serviceAction', 'installCatalog', 'setServiceAutoStart', 'setAllServicesAutoStart', 'startAllServices', 'stopAllServices'];
  const preload = path.join(temporary, 'integration-preload.cjs'); fs.writeFileSync(preload, "const {contextBridge,ipcRenderer}=require('electron');contextBridge.exposeInMainWorld('companion',Object.fromEntries(" + JSON.stringify(methods) + ".map(m=>[m,(...args)=>ipcRenderer.invoke('integration-test',m,...args)]))); ");
  window = new BrowserWindow({ show: false, width: 760, height: 520, webPreferences: { preload, contextIsolation: true, backgroundThrottling: false } });
  const run = code => window.webContents.executeJavaScript(code).catch(error => { throw new Error(code + ' :: ' + error.message); });
  await window.loadFile(path.join(archive, 'src/renderer/index.html'));
  await wait(() => run("!!document.querySelector('#modules [data-module-id=phone-deck] .integration-info')"), 'integration model');
  await wait(() => run('initialized'), 'initial navigation restoration');
  await run("document.querySelector('#modules [data-module-id=phone-deck] .row-toggle').click();document.querySelector('#modules [data-module-id=phone-deck] [data-group=optional]').open=true");
  const row = "document.querySelector('#modules [data-module-id=phone-deck]')";
  assert.equal(await run(row + ".querySelector('[data-group=required] li')===null"), true);
  assert.equal(await run(row + ".querySelector('[data-group=optional] li[data-integration-id=local-ai]').textContent.includes('Service stopped')"), true);
  assert.equal(await run(row + ".querySelector('[data-group=optional] li[data-integration-id=wheel]').textContent.includes('Not installed')"), true);
  assert.equal(await run(row + ".querySelector('[data-group=external]').textContent.includes('OBS WebSocket connection')"), true);
  assert.equal(await run(row + ".textContent.includes('Phone Deck works with OBS on its own')"), true);
  assert.equal(await run("document.querySelector('#modules [data-module-id=video] .integration-info').textContent.includes('Universal Overlay')"), true);
  assert.equal(await run("document.querySelector('#modules .integration-info').textContent.includes('Dependencies: {')"), false);
  await run(row + ".querySelector('[data-group=optional]').open=false;" + row + ".scrollIntoView()");
  await run('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  fs.writeFileSync(path.join(__dirname, '../out/integrations-preview.png'), (await window.webContents.capturePage()).toPNG());
  await run(row + ".querySelector('[data-group=optional]').open=true");
  const provider = path.join(test.host.registry.dataDirectory, 'local-ai/module.json');
  const manifest = JSON.parse(fs.readFileSync(provider)); manifest.dependencies.companion = '>=99.0.0'; fs.writeFileSync(provider, JSON.stringify(manifest));
  await run('refresh()');
  assert.equal(await run(row + ".querySelector('li[data-integration-id=local-ai]').textContent.includes('Version incompatible')"), true);
  manifest.dependencies.companion = '>=1.3.1'; fs.writeFileSync(provider, JSON.stringify(manifest));
  ownerState = { status: 'running', pid: 42, endpoint: { ready: true, configured: false }, logs: [] }; await run('refresh()');
  assert.equal(await run(row + ".querySelector('li[data-integration-id=local-ai]').textContent.includes('Configuration needed')"), true);
  await run("window.savedSummary=" + row + ".querySelector('[data-group=optional] summary');savedSummary.focus()");
  ownerState.endpoint.configured = true; await run('refresh()');
  assert.equal(await run('document.activeElement===savedSummary && savedSummary.parentElement.open'), true);
  assert.equal(await run(row + ".querySelector('li[data-integration-id=local-ai]').textContent.includes('Module service ready')"), true);
  for (const entry of catalog.modules) delete entry.integrations;
  await run("refresh();document.querySelector('#tab-catalogue').click()");
  await wait(() => run("document.querySelector('#catalog [data-module-id=phone-deck]').textContent.includes('older catalogue entry')"), 'old catalogue fallback');
  assert.equal(await run("document.querySelector('#catalog [data-module-id=spotify] [data-group=optional]').textContent.includes('Spotify account')"), false);
  assert.equal(effects, 0); assert.equal(test.calls.length, 0); assert.equal(JSON.stringify(test.host.services.config), before);
  assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'), true);
  console.log('Packaged integration UI passed: friendly names, required/optional/external groups, Phone Deck base independence, absent/incompatible/stopped/unconfigured/ready owners, legacy unknown summaries, stable focus/disclosures and no install/start/cards/native dispatch.');
}
main().catch(error => { console.error(error); failed = true; }).finally(async () => { window?.destroy(); await test?.close(); app.exit(failed ? 1 : 0); });
