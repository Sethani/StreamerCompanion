const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { once } = require('node:events');
const { CompanionRegistry } = require('../src/module-registry');
const { HelpGuides } = require('../src/help-guides');
const { ControlApi } = require('../src/control-api');

async function main() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'companion-help-')); let api;
  try {
    const registry = new CompanionRegistry({ dataDirectory: path.join(temporary, 'modules') });
    const write = (id, documentation = 'README.md') => {
      const dir = path.join(registry.dataDirectory, id); fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'module.json'), JSON.stringify({ schemaVersion: 2, id, name: id, version: '1.0.0', description: 'Synthetic guide fixture.', documentation, streamerbot: { requiredActions: [] } }));
      fs.writeFileSync(path.join(dir, 'README.md'), '# Fixture\n\n[Other](../second/README.md#usage)');
      return dir;
    };
    const first = write('first'); write('second'); write('update-probe'); write('bad', '../secret.md');
    fs.writeFileSync(path.join(temporary, 'secret.md'), 'private');
    const help = new HelpGuides(registry);
    assert.deepEqual(help.index().map(e => e.id), ['getting-started', 'first', 'second']);
    assert.equal(help.read('first').links['../second/README.md'], 'second');
    assert.ok(help.read('getting-started').markdown.includes('Getting started'));
    assert.equal(help.read('getting-started').links['modules/first/README.md'], 'first');
    assert.equal(help.read('getting-started').links['modules/bad/../secret.md'], undefined);
    assert.equal(help.read('getting-started').links['modules/update-probe/README.md'], undefined);
    for (const id of ['../secret', '..', 'C:/private', 'first/README.md', 'update-probe', '%2e%2e', null, {}, 'missing']) assert.throws(() => help.read(id), /unavailable/);
    for (const name of ['../secret.md', 'C:/private.md', 'x\\y.md', 'module.json', 'export.sb', 'private/data.json', 'README.md:secret', './README.md']) assert.throws(() => help.file(first, name));
    fs.renameSync(path.join(first, 'README.md'), path.join(first, 'saved.md'));
    let linked = false;
    try { fs.symlinkSync(path.join(temporary, 'secret.md'), path.join(first, 'README.md')); linked = true; }
    catch (error) { if (error.code !== 'EPERM') throw error; }
    if (linked) { assert.throws(() => help.read('first'), /unavailable/); fs.unlinkSync(path.join(first, 'README.md')); }
    fs.renameSync(path.join(first, 'saved.md'), path.join(first, 'README.md'));
    const outside = path.join(temporary, 'outside'); fs.mkdirSync(outside); fs.writeFileSync(path.join(outside, 'README.md'), 'private');
    fs.symlinkSync(outside, path.join(first, 'linked'), 'junction');
    assert.throws(() => help.file(first, 'linked/README.md'), /unavailable/);
    fs.symlinkSync(first, path.join(registry.dataDirectory, 'escaped'), 'junction');
    assert.throws(() => help.read('escaped'), /unavailable/);
    api = new ControlApi({ dataDirectory: path.join(temporary, 'api'), helpGuides: help }); api.port = 0; api.start(); await once(api.server, 'listening'); api.port = api.server.address().port;
    const base = 'http://127.0.0.1:' + api.port;
    for (const target of ['index', 'guide?id=first', 'reader', 'help-reader.js', 'help.css']) assert.equal((await fetch(base + '/api/help/' + target)).status, 200);
    assert.equal((await fetch(base + '/api/help/guide?id=first')).headers.get('access-control-allow-origin'), null);
    assert.equal((await fetch(base + '/api/help/index', { headers: { Origin: 'https://example.invalid' } })).status, 403);
    assert.equal(await new Promise((resolve, reject) => { require('node:http').get(base + '/api/help/index', { headers: { Host: 'example.invalid' } }, response => { response.resume(); resolve(response.statusCode); }).on('error', reject); }), 403);
    assert.equal((await fetch(base + '/api/help/index', { method: 'POST' })).status, 405);
    assert.equal((await fetch(base + '/api/help/guide?id=..%2fsecret')).status, 404);
    assert.equal((await fetch(base + '/api/help/module.json')).status, 404);
    assert.equal((await fetch(base + '/api/modules')).status, 401);
    fs.rmSync(path.join(registry.dataDirectory, 'second'), { recursive: true });
    assert.throws(() => help.read('second'), /unavailable/);
    console.log('Help passed: declared guides only, cross-links, missing modules, traversal, symlinks/junctions, same-origin read-only routes and no private API access.');
  } finally { await api?.stop(); assert.ok(path.resolve(temporary).startsWith(path.resolve(os.tmpdir()) + path.sep)); fs.rmSync(temporary, { recursive: true, force: true }); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
