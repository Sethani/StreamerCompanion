const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { buildModules } = require('../../scripts/build-modules');
const { CompanionRegistry } = require('../src/module-registry');
const { HelpGuides } = require('../src/help-guides');

async function main() {
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'companion-guide-packages-'));
try {
  const catalog = buildModules(undefined, { output: path.join(temporary, 'packages') });
  const registry = new CompanionRegistry({ dataDirectory: path.join(temporary, 'modules') });
  for (const entry of catalog.modules) await registry.install(path.join(temporary, 'packages', path.basename(new URL(entry.package.url).pathname)));
  let developerTools = false; const help = new HelpGuides(registry, () => developerTools);
  assert.equal(help.index().length, 29, 'First-run plus 27 user modules; Update Probe is developer-only');
  const engineering = registry.manifests().filter(m => m.manifest.developerDocumentation);
  assert.equal(engineering.length, 27, 'All reviewed engineering material is packaged separately; Universal Dock needs no engineering guide');
  for (const item of engineering) {
    assert.throws(() => help.read('developer:' + item.manifest.id), /unavailable/);
    const user = help.read(item.manifest.id);
    assert.ok(user.markdown.trim().startsWith('# '));
    assert.equal(user.links['DEVELOPMENT.md'], undefined, 'No engineering link target is readable by default');
  }
  assert.ok(help.read('embedded-widgets').markdown.includes('Renderer recovery'));
  assert.ok(help.read('embedded-widgets').markdown.includes('type CLOSED'));
  assert.ok(help.read('chat-archive').markdown.includes('WAL'));
  assert.ok(help.read('chat-archive').markdown.includes('forensic erasure'));
  assert.ok(help.read('pokemon-encounters').markdown.includes('The Pokemon Company'));
  assert.ok(help.read('phone-deck').markdown.includes('Lucide'));
  assert.ok(help.read('shoutout-clips').markdown.includes('provider-controlled'));
  assert.ok(help.read('archipelago').markdown.includes('Test incoming item (preview)'));
  developerTools = true;
  assert.equal(help.index().filter(e => e.developer).length, engineering.length);
  for (const item of engineering) {
    const id = item.manifest.id;
    assert.ok(help.read('developer:' + id).markdown.length > 20);
    assert.equal(help.read(id).links['DEVELOPMENT.md'], 'developer:' + id);
  }
  console.log('Guide packages passed: all 29 packages, 27 separate engineering guides, gated direct reads/links, retained recovery/backup/privacy/notices/provider limitations and safe preview instructions.');
} finally { assert.ok(path.resolve(temporary).startsWith(path.resolve(os.tmpdir()) + path.sep)); fs.rmSync(temporary, { recursive: true, force: true }); }

}
main().catch(error=>{console.error(error);process.exitCode=1;});
