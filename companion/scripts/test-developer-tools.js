const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { once } = require('node:events');
const { UiPreferences } = require('../src/ui-preferences');
const { CompanionRegistry } = require('../src/module-registry');
const { HelpGuides } = require('../src/help-guides');
const { ControlApi } = require('../src/control-api');
const { buildModules } = require('../../scripts/build-modules');

async function main() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'companion-developer-')); let api;
  try {
    const prefs = new UiPreferences(temporary);
    assert.equal(prefs.read().developerTools, false);
    prefs.setFavorite('wheel', true); prefs.setDeveloperTools(true); prefs.setFavorite('countdown', true);
    assert.equal(new UiPreferences(temporary).read().developerTools, true);
    assert.deepEqual(prefs.read().favorites, ['countdown', 'wheel']);
    const rename = fs.renameSync;
    try { fs.renameSync = () => { throw new Error('Synthetic save failure'); }; assert.throws(() => prefs.setDeveloperTools(false), /save failure/); assert.equal(prefs.read().developerTools, true); }
    finally { fs.renameSync = rename; }
    assert.throws(() => prefs.setDeveloperTools('true'), /boolean/);
    const registry = new CompanionRegistry({ dataDirectory: path.join(temporary, 'modules') });
    const packages = path.join(temporary, 'packages');
    const ids = ['archipelago', 'controller-input', 'countdown', 'embedded-widgets', 'named-timers', 'redeem-checklist', 'wheel', 'update-probe'];
    const catalog = buildModules(ids, { output: packages });
    for (const entry of catalog.modules) await registry.install(path.join(packages, path.basename(new URL(entry.package.url).pathname)));
    const help = new HelpGuides(registry, () => prefs.read().developerTools);
    prefs.setDeveloperTools(false);
    assert.equal(help.index().some(e => e.id.startsWith('developer:') || e.id === 'update-probe'), false);
    assert.throws(() => help.read('developer:wheel'), /unavailable/);
    assert.throws(() => help.read('update-probe'), /unavailable/);
    assert.ok(!help.read('wheel').markdown.includes('## Testing'));
    assert.ok(help.read('embedded-widgets').markdown.includes('Renderer recovery'));
    api = new ControlApi({ dataDirectory: path.join(temporary, 'api'), helpGuides: help, uiPreferences: prefs });
    api.port = 0; api.start(); await once(api.server, 'listening'); api.port = api.server.address().port;
    const base = 'http://127.0.0.1:' + api.port;
    assert.equal((await fetch(base + '/api/help/guide?id=developer:wheel&developerTools=true')).status, 404);
    prefs.setDeveloperTools(true);
    assert.ok(help.index().some(e => e.id === 'update-probe'));
    assert.equal(help.index().filter(e => e.developer).length, 7);
    assert.ok(help.read('developer:wheel').markdown.includes('Synthetic profiles') || help.read('developer:wheel').markdown.includes('synthetic profiles'));
    assert.equal(help.read('wheel').links['DEVELOPMENT.md'], 'developer:wheel');
    assert.equal((await fetch(base + '/api/help/guide?id=developer:wheel')).status, 200);
    for (const id of ['developer:../wheel', 'developer:wheel/DEVELOPMENT.md', 'developer:wheel:README.md']) assert.throws(() => help.read(id), /unavailable/);
    const manifest = registry.readManifest('wheel');
    assert.throws(() => registry.validate({ ...manifest, developerDocumentation: '../private.md' }), /safe relative/);
    assert.throws(() => registry.validate({ ...manifest, developerDocumentation: 'export.sb' }), /Markdown/);
    prefs.setDeveloperTools(false);
    assert.equal((await fetch(base + '/api/help/guide?id=developer:wheel')).status, 404);
    assert.deepEqual(new UiPreferences(temporary).read().favorites, ['countdown', 'wheel']);
    fs.writeFileSync(prefs.file, JSON.stringify({ schemaVersion: 1, favorites: ['wheel'] }));
    assert.equal(new UiPreferences(temporary).read().developerTools, false, 'Older preference files default off');
    console.log('Developer tools passed: default/upgrade off, persistence/favorite preservation, failed saves, seven declared packaged engineering guides, user safety guidance retained, gated HTTP/direct reads and strict guide paths.');
  } finally { await api?.stop(); assert.ok(path.resolve(temporary).startsWith(path.resolve(os.tmpdir()) + path.sep)); fs.rmSync(temporary, { recursive: true, force: true }); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
