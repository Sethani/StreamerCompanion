const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { ControlApi } = require("../src/control-api");

async function freePort() {
  const server = http.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function main() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "companion-api-"));
  const port = await freePort();
  let received = "";
  const api = new ControlApi({
    port, dataDirectory: directory,
    installPackage: async (file) => { received = fs.readFileSync(file, "utf8"); return { installed: true }; },
    listModules: async () => ({ modules: [] }),
    listServices: async () => [],
    publicModules: async () => ({ schemaVersion: 3, categories: [], modules: [] })
  });
  api.start();
  try {
    const unauthorized = await fetch(`http://127.0.0.1:${port}/api/modules`);
    if (unauthorized.status !== 401) throw new Error("Private API allowed an unauthenticated request.");
    const installed = await fetch(`http://127.0.0.1:${port}/api/modules/install`, { method: "POST", headers: { Authorization: "Bearer " + api.token, "Content-Type": "application/octet-stream" }, body: Buffer.from("module-package") });
    if (!installed.ok || received !== "module-package") throw new Error("Authenticated module upload failed.");
    const publicRegistry = await fetch(`http://127.0.0.1:${port}/api/public/modules`, { headers: { Origin: "http://127.0.0.1:7474" } });
    if (publicRegistry.headers.get("access-control-allow-origin") !== "http://127.0.0.1:7474") throw new Error("Public module registry did not allow a loopback origin.");
    console.log("Companion control API authentication and installation passed.");
  } finally {
    await api.stop();
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
