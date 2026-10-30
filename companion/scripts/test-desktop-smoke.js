const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawn } = require("node:child_process");

async function main() {
  assert.ok(process.argv[2], "Pass the built standalone application directory");
  const bundle = path.resolve(process.argv[2]);
  assert.ok(fs.existsSync(path.join(bundle, "resources/app.asar")));
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "companion-desktop-"));
  try {
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    const code = await new Promise((resolve, reject) => {
      const child = spawn(require("electron"), [path.join(__dirname, "electron-desktop-smoke.js"), bundle, temporary], {
        env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"]
      });
      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stderr);
      child.once("error", reject);
      child.once("exit", resolve);
    });
    assert.equal(code, 0, "Hidden desktop smoke failed");
  } finally {
    assert.ok(path.resolve(temporary).startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
