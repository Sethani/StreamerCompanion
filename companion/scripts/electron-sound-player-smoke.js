'use strict';
const { app, BrowserWindow } = require('electron'), assert = require('node:assert/strict'), http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const temporary = path.resolve(process.argv[3]);
app.setPath('userData', temporary); app.commandLine.appendSwitch('disable-gpu'); app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
let server; const windows = [], root = path.resolve(__dirname, '../../modules/sound-player/web');
let revision = 1, calls = [], origin;
const payload = { config: { library: {}, pools: {}, settings: { masterVolumePercent: 100 } }, current: { visible: false }, phoneDeckResults: {}, phoneDeckVersion: 1 };
const envelope = () => ({ schemaVersion: 1, feature: 'walkonSound', revision, payload });
const transport = `window.StreamingTransport={create(){const handlers={},states={};let timer;async function refresh(){const e=await(await fetch('/state')).json();states.walkonSound=e;handlers.walkonSound?.(e);}return{subscribe(k,fn){handlers[k]=fn;},getState(k){return states[k]},async execute(feature,command,args){const r=await fetch('/command',{method:'POST',body:JSON.stringify({command,args})});if(!r.ok)throw Error('Rejected');await refresh();},refresh,getBackend(){return 'streamerbot'},connect(){handlers.connection?.({connected:true});refresh();timer=setInterval(refresh,80);},close(){clearInterval(timer)}}}};`;
function wav() { const bytes = Buffer.alloc(44 + 8000 * 2 * 4); bytes.write('RIFF'); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8); bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22); bytes.writeUInt32LE(8000, 24); bytes.writeUInt32LE(16000, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34); bytes.write('data', 36); bytes.writeUInt32LE(bytes.length - 44, 40); return bytes; }
async function wait(fn, label) { const end = Date.now() + 12000; while (Date.now() < end) { if (await fn()) return; await new Promise(r => setTimeout(r, 40)); } throw Error('Timed out: ' + label); }
async function main() {
  await app.whenReady();
  server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const send = (body, type = 'application/json') => { res.writeHead(200, { 'Content-Type': type }); res.end(type === 'application/json' ? JSON.stringify(body) : body); };
    if (url.pathname === '/state') return send(envelope());
    if (url.pathname === '/api/public/media/sound-player') return send({ media: [{ id: 'tone', label: 'Synthetic silent WAV', src: origin + '/silent.wav' }] });
    if (url.pathname === '/silent.wav') return send(wav(), 'audio/wav');
    if (url.pathname === '/command') {
      let body = ''; for await (const part of req) body += part;
      const { command, args } = JSON.parse(body); calls.push({ command, args });
      if (command === 'Configure') payload.config = JSON.parse(args.config);
      if (command === 'Play' || command === 'Play Pool') { const id = args.id || payload.config.pools[args.poolId].choices[0].value; payload.current = { ...payload.config.library[id], visible: true, volume: payload.config.settings.masterVolumePercent / 100, startedAtMs: ++revision, requestId: args.requestId, rendererId: '' }; }
      if (command === 'Stop') payload.current = { visible: false };
      if (command === 'Renderer' && args.startedAtMs === payload.current.startedAtMs && args.playbackRequestId === payload.current.requestId) { if (args.rendererOperation === 'claim' && !payload.current.rendererId) payload.current.rendererId = args.rendererId; else if (args.rendererOperation === 'complete' && payload.current.rendererId === args.rendererId) payload.current = { visible: false }; }
      if (args.requestId) payload.phoneDeckResults[args.requestId] = { status: 'completed' }; revision++; return send({});
    }
    if (url.pathname.endsWith('/streamerbot-transport.js')) return send(transport, 'application/javascript');
    if (!/^\/(sound|overlay)\/(index\.html|app\.js|styles\.css)$/.test(url.pathname)) { res.writeHead(404); return res.end(); }
    const file = path.join(root, url.pathname.slice(1)); return send(fs.readFileSync(file), file.endsWith('.html') ? 'text/html' : file.endsWith('.css') ? 'text/css' : 'application/javascript');
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r)); origin = 'http://127.0.0.1:' + server.address().port;
  async function open(page) { const window = new BrowserWindow({ show: false, width: 1100, height: 900, webPreferences: { contextIsolation: true, nodeIntegration: false } }); windows.push(window); await window.loadURL(origin + page); return window; }
  const editor = await open('/sound/index.html'), first = await open('/overlay/index.html'), second = await open('/overlay/index.html');
  for (const window of [first, second]) await window.webContents.executeJavaScript(`document.getElementById('player').muted=true`);
  await wait(() => editor.webContents.executeJavaScript(`document.getElementById('connection').textContent.includes('connected')`), 'editor state');
  await editor.webContents.executeJavaScript(`document.getElementById('refresh').click()`);
  await wait(() => editor.webContents.executeJavaScript(`document.querySelectorAll('#library .row').length===1`), 'media library');
  await editor.webContents.executeJavaScript(`document.getElementById('settings').requestSubmit()`);
  await wait(() => payload.config.library.tone, 'saved native config');
  const actionsBeforeId=calls.length;
  assert.equal(await editor.webContents.executeJavaScript(`document.querySelector('[aria-label="Sound ID"]').value`),'tone');
  assert.equal(await editor.webContents.executeJavaScript(`document.querySelector('[aria-label="Sound ID"]').readOnly`),true);
  await editor.webContents.executeJavaScript(`document.querySelector('[aria-label="Sound ID"]').focus()`);
  assert.equal(calls.length,actionsBeforeId,'Selecting an ID must not dispatch or save');
  await editor.webContents.executeJavaScript(`document.getElementById('play').click()`);
  await wait(() => payload.current.rendererId, 'one persisted renderer claim');
  const playState = async window => window.webContents.executeJavaScript(`({paused:document.getElementById('player').paused,time:document.getElementById('player').currentTime})`);
  await wait(async () => { const states = await Promise.all([playState(first), playState(second)]); return states.filter(s => !s.paused && s.time > 0).length === 1; }, 'one actual silent WAV player');
  assert.equal(calls.filter(c => c.command === 'Play').length, 1);
  await editor.webContents.executeJavaScript(`document.getElementById('stop').click()`);
  await wait(async () => (await Promise.all([playState(first), playState(second)])).every(s => s.paused), 'both players stopped');
  await editor.webContents.executeJavaScript(`document.getElementById('add-pool').click();document.querySelector('#pools .pool button').click()`);
  await editor.webContents.executeJavaScript(`document.getElementById('settings').requestSubmit()`);
  await wait(() => Object.keys(payload.config.pools).length === 1, 'saved pool');
  assert.equal(Object.values(payload.config.pools)[0].choices[0].weight, 1);
  await wait(() => editor.webContents.executeJavaScript(`document.querySelectorAll('#pools .pool').length===1`), 'pool editor remains visible');
  assert.equal(await editor.webContents.executeJavaScript(`document.querySelector('[aria-label="Pool ID"]').value`),Object.keys(payload.config.pools)[0]);
  assert.equal(await editor.webContents.executeJavaScript(`document.querySelector('[aria-label="Pool ID"]').readOnly`),true);
  await editor.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
  const image = await editor.webContents.capturePage(); fs.writeFileSync(path.join(__dirname, '../out/sound-player-editor.png'), image.toPNG());
  console.log('Sound Player Electron browser passed: actual editor media/save/pool controls and two overlay documents competing for one silent WAV playback; Stop silences both.');
}
main().then(() => { for (const window of windows) window.destroy(); server?.close(); app.quit(); }).catch(error => { console.error(error); for (const window of windows) window.destroy(); server?.close(); app.exit(1); });
