const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { InstalledService } = require("../src/installed-service");

async function freePort() {
  const server = http.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "companion-service-"));
  const moduleDirectory = path.join(root, "module");
  const dataDirectory = path.join(root, "data");
  fs.mkdirSync(moduleDirectory);
  const port = await freePort();
  fs.writeFileSync(path.join(moduleDirectory, "runtime.js"), `const http=require("node:http"),fs=require("node:fs"),path=require("node:path");fs.mkdirSync(process.env.COMPANION_DATA_DIRECTORY,{recursive:true});fs.writeFileSync(path.join(process.env.COMPANION_DATA_DIRECTORY,"started.txt"),"yes");const server=http.createServer((q,r)=>{const b=JSON.stringify({service:"test",ready:true});r.writeHead(200,{"Content-Type":"application/json"});r.end(b)});server.listen(Number(process.env.COMPANION_SERVICE_PORT),"127.0.0.1");process.on("SIGTERM",()=>server.close(()=>process.exit(0)));`);
  const service = new InstalledService({
    app: {}, moduleDirectory, dataDirectory,
    manifest: { id: "test-service", name: "Test Service", version: "1.0.0", service: { entry: "runtime.js", port, healthPath: "/health", healthService: "test" } }
  });
  try {
    const started = await service.start();
    if (started.status !== "running" || !started.endpoint.ready) throw new Error("Installed service did not become healthy.");
    if (!fs.existsSync(path.join(dataDirectory, "started.txt"))) throw new Error("Installed service did not receive its private data directory.");
    await service.stop();
    if ((await service.state()).status !== "stopped") throw new Error("Installed service did not stop.");
    console.log("Installable service lifecycle passed.");
  } finally {
    await service.stop().catch(() => {});
    fs.rmSync(root, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
