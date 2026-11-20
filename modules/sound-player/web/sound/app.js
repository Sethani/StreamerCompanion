(() => {
  'use strict';
  const $ = id => document.getElementById(id), transport = StreamingTransport.create();
  let config = { library: {}, pools: {}, settings: { masterVolumePercent: 100 } }, dirty = false;
  const clone = value => JSON.parse(JSON.stringify(value));
  function mark(value = true) { dirty = value; $('dirty').textContent = value ? 'Unsaved changes' : 'Saved'; }
  function note(message, error = false) { $('feedback').textContent = message; $('feedback').className = error ? 'error' : ''; }
  function element(tag, text) { const result = document.createElement(tag); if (text) result.textContent = text; return result; }
  function identity(label, id) { const wrap = element('label', label), field = element('input'); field.value = id; field.readOnly = true; field.className = 'resource-id'; field.setAttribute('aria-label', label); field.title = 'Select and copy this ID for a Streamer.bot action'; field.onfocus = () => field.select(); wrap.append(field); return wrap; }
  function input(label, value, change, type = 'text') { const wrap = element('label', label), field = element('input'); field.type = type; if (type === 'checkbox') field.checked = value; else field.value = value; field.addEventListener('input', () => { change(type === 'checkbox' ? field.checked : field.value); mark(); }); wrap.append(field); return wrap; }
  function choices(selected, change) { const select = element('select'); select.setAttribute('aria-label', 'Registered sound'); for (const [id, sound] of Object.entries(config.library)) { const option = element('option', sound.label || id); option.value = id; select.append(option); } select.value = selected; select.onchange = () => { change(select.value); mark(); }; return select; }
  function pickers() { for (const [name, entries] of [['sound', config.library], ['pool', config.pools]]) { const select = $(name), old = select.value; select.replaceChildren(); for (const [id, item] of Object.entries(entries)) if (item.enabled !== false) { const option = element('option', item.label || id); option.value = id; select.append(option); } if ([...select.options].some(o => o.value === old)) select.value = old; } }
  function render() {
    $('library').replaceChildren();
    for (const [id, sound] of Object.entries(config.library)) { const row = element('div'); row.className = 'row'; row.append(input('Available', sound.enabled !== false, v => { sound.enabled = v; pickers(); }, 'checkbox'), input('Label', sound.label || id, v => { sound.label = v; pickers(); }), identity('Sound ID', id)); $('library').append(row); }
    $('pools').replaceChildren();
    for (const [id, pool] of Object.entries(config.pools)) {
      const root = element('div'); root.className = 'pool';
      root.append(input('Pool name', pool.label || id, v => { pool.label = v; pickers(); }), input('Available', pool.enabled !== false, v => { pool.enabled = v; pickers(); }, 'checkbox'));
      root.append(identity('Pool ID', id));
      for (const choice of pool.choices || []) { const row = element('div'); row.className = 'row'; const weight = input('Weight', choice.weight, v => { choice.weight = Number(v); }, 'number'); const field = weight.querySelector('input'); field.min = '0.001'; field.max = '1000'; field.step = 'any'; field.required = true; const remove = element('button', 'Remove choice'); remove.type = 'button'; remove.onclick = () => { pool.choices.splice(pool.choices.indexOf(choice), 1); mark(); render(); }; row.append(choices(choice.value, v => { choice.value = v; }), weight, remove); root.append(row); }
      const add = element('button', 'Add sound'); add.type = 'button'; add.onclick = () => { const sound = Object.keys(config.library)[0]; if (!sound) return note('Add a sound first.', true); pool.choices.push({ value: sound, weight: 1 }); mark(); render(); };
      const remove = element('button', 'Delete pool'); remove.type = 'button'; remove.onclick = () => { delete config.pools[id]; mark(); render(); };
      root.append(add, remove); $('pools').append(root);
    }
    $('volume').value = config.settings.masterVolumePercent; pickers();
  }
  async function run(command, args = {}) {
    const requestId = crypto.randomUUID();
    await transport.execute('walkonSound', command, { ...args, requestId });
    for (let attempt = 0; attempt < 8; attempt++) {
      await transport.refresh('walkonSound');
      const result = transport.getState('walkonSound')?.payload?.phoneDeckResults?.[requestId];
      if (result) { if (result.status !== 'completed') throw new Error(result.error || 'Sound operation rejected.'); return; }
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    throw new Error('Sound operation was not confirmed. Check the imported Sound Player actions.');
  }
  async function save() { config.settings.masterVolumePercent = Number($('volume').value); await run('Configure', { config: JSON.stringify(config) }); mark(false); note('Sound settings saved.'); }
  $('settings').onsubmit = event => { event.preventDefault(); save().catch(error => note(error.message, true)); };
  $('volume').oninput = () => mark();
  $('add-pool').onclick = () => { config.pools[crypto.randomUUID()] = { label: 'New pool', enabled: true, choices: [] }; mark(); render(); };
  $('refresh').onclick = async () => { try { const response = await fetch('/api/public/media/sound-player', { cache: 'no-store' }); if (!response.ok) throw new Error('Sound media is unavailable.'); const { media } = await response.json(); let count = 0; for (const item of media) if (!config.library[item.id]) { config.library[item.id] = { id: item.id, label: item.label, src: item.src, enabled: true }; count++; } if (count) mark(); render(); note(count ? `Added ${count} sound(s). Save to register them.` : 'No new media found.'); } catch (error) { note(error.message, true); } };
  for (const [id, command, args] of [['play', 'Play', () => ({ id: $('sound').value })], ['play-pool', 'Play Pool', () => ({ poolId: $('pool').value })], ['stop', 'Stop', () => ({})]]) $(id).onclick = async () => { try { if (dirty && command !== 'Stop') await save(); await run(command, args()); note(command === 'Stop' ? 'Sound stopped.' : 'Playback accepted. Check the overlay and OBS output.'); } catch (error) { note(error.message, true); } };
  transport.subscribe('walkonSound', event => { if (!dirty && event.payload?.config) { config = clone(event.payload.config); render(); } const current = event.payload?.current || {}; $('playback').textContent = current.lastError || (current.visible ? `${current.label || 'Sound'} · ${current.rendererId ? 'renderer claimed' : 'waiting for overlay'}` : 'Stopped'); });
  transport.subscribe('connection', health => { $('connection').textContent = health.connected ? 'Streamer.bot connected' : 'Streamer.bot disconnected'; });
  render(); transport.connect(); window.addEventListener('beforeunload', () => transport.close());
})();
