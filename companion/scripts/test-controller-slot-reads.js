// Read-only live Controller acceptance in disposable module data, using a supplied private profile.
const assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { createService } = require('../../modules/archipelago/service/runtime');
async function main() {
  assert.ok(process.argv[2], 'Pass the existing private Archipelago module-data directory.');
  const source = path.resolve(process.argv[2]), root = fs.mkdtempSync(path.join(os.tmpdir(), 'controller-slot-reads-'));
  let service, active = 0, maximum = 0; const counts = { snapshot: 0, slots: 0, dashboard: 0, slotlock: 0, other: 0 };
  try {
    fs.copyFileSync(path.join(source, 'config.json'), path.join(root, 'config.json'));
    if (fs.existsSync(path.join(source, 'auth.json'))) fs.copyFileSync(path.join(source, 'auth.json'), path.join(root, 'auth.json'));
    service = createService({ dataDirectory: root, port: 0, autoPoll: false, fetch: async (address, options) => {
      assert.equal(options.method, 'GET', 'Live Controller verification allows reads only');
      const route = new URL(address).pathname;
      counts[route.endsWith('/snapshot') ? 'snapshot' : route.includes('/slots/') ? 'slots' : route.endsWith('/dashboard') ? 'dashboard' : route.endsWith('/slotlock') ? 'slotlock' : 'other']++;
      active++; maximum = Math.max(maximum, active);
      try { return await fetch(address, options); } finally { active--; }
    } });
    await service.start(); assert.equal(service.settings().connected, true, 'Controller must be reachable for passive acceptance');
    assert.ok(service.settings().config.roomId, 'Choose a room in the supplied profile first');
    const bootstraps = counts.snapshot; await service.poll(); assert.equal(service.settings().connected, true);
    const selected = service.settings().config.profiles[service.settings().config.roomId]?.slots || [];
    if (selected.length && counts.slots) assert.equal(counts.snapshot, bootstraps, 'Stable slot reads must avoid another full snapshot');
    assert.ok(maximum <= 4); assert.ok(service.publicState().players.every(player => selected.includes(player.id)));
    console.log(JSON.stringify({ connected: true, selectedSlots: selected.length, displayedSlots: service.publicState().players.length, requests: counts, maximumConcurrency: maximum, writesToController: 0 }));
  } finally {
    await service?.stop(); assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep)); fs.rmSync(root, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
