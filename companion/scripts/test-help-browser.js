const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { spawn } = require('node:child_process');
async function main(script = 'electron-help-smoke.js') {
  const bundle = process.argv[2] || JSON.parse(fs.readFileSync(path.join(__dirname, '../out/latest-build.json'))).directory;
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'companion-help-browser-'));
  try {
    const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
    const code = await new Promise((resolve, reject) => {
      const child = spawn(require('electron'), [path.join(__dirname, script), bundle, temporary], { env, windowsHide: true, stdio: 'inherit' });
      const timeout = setTimeout(() => { child.kill(); reject(new Error('Help browser test timed out')); }, 90000);
      child.once('error', error => { clearTimeout(timeout); reject(error); }); child.once('exit', code => { clearTimeout(timeout); resolve(code); });
    });
    assert.equal(code, 0, 'Help browser failed');
  } finally { assert.ok(path.resolve(temporary).startsWith(path.resolve(os.tmpdir()) + path.sep)); fs.rmSync(temporary, { recursive: true, force: true }); }
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { main };
