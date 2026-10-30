const { ServiceRegistry } = require("../src/service-registry");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function fakeService(id, provides = [], requiredCapabilities = []) {
  return {
    manifest: { schemaVersion: 1, id, name: id, version: "1.0.0", description: id, provides, dependencies: { requiredCapabilities } },
    process: null,
    status: "stopped",
    async state() { return { status: this.status, logs: [] }; },
    async start() { this.status = "running"; },
    async stop() { this.status = "stopped"; },
    async restart() { this.status = "running"; }
  };
}

async function main() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "companion-service-registry-"));
  const configPath = path.join(directory, "services.json");
  const registry = new ServiceRegistry({ systemCapabilities: ["windows"], configPath });
  registry.register(fakeService("provider", ["overlay"]));
  registry.register(fakeService("consumer", [], ["windows", "overlay"]));
  registry.register(fakeService("blocked", [], ["missing"]));
  const initial = await registry.list();
  if (!initial.find((item) => item.manifest.id === "consumer").dependencies.ready) throw new Error("Provided capability was not resolved.");
  if (initial.find((item) => item.manifest.id === "blocked").dependencies.ready) throw new Error("Missing capability was not reported.");
  for (const operation of ["start", "restart"]) {
    let rejected = false;
    try { await registry.execute("blocked", operation); } catch (error) { rejected = error.message.includes("Missing required capabilities"); }
    if (!rejected || registry.get("blocked").status !== "stopped") throw new Error("Missing dependencies did not block " + operation + ".");
  }
  await registry.execute("consumer", "start");
  if ((await registry.list()).find((item) => item.manifest.id === "consumer").state.status !== "running") throw new Error("Generic service action failed.");
  await registry.setAutoStart("consumer", true);
  const restored = new ServiceRegistry({ systemCapabilities: ["windows"], configPath });
  restored.register(fakeService("consumer", [], ["windows"]));
  if (!(await restored.list())[0].autoStart) throw new Error("Automatic startup preference was not persisted.");
  await restored.startAll({ automaticOnly: true });
  if ((await restored.list())[0].state.status !== "running") throw new Error("Automatic service startup failed.");
  fs.rmSync(directory, { recursive: true, force: true });
  console.log("Companion service registry resolves capabilities, persists auto-start, and executes services.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
