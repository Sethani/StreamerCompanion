const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".mp4": "video/mp4", ".webm": "video/webm", ".m4v": "video/mp4", ".mov": "video/quicktime" };

function inside(root, relative) {
  if (typeof relative !== "string" || !relative || relative.includes("\\") || /[\x00-\x1f:]/.test(relative) || relative.split("/").some((part) => !part || part === "." || part === ".." || /[. ]$/.test(part))) throw Object.assign(new Error("Invalid asset path."), { statusCode: 400 });
  const resolved = path.resolve(root, relative);
  const base = path.resolve(root) + path.sep;
  if (!resolved.startsWith(base)) throw Object.assign(new Error("Invalid asset path."), { statusCode: 400 });
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) throw Object.assign(new Error("Asset not found."), { statusCode: 404 });
  if (!fs.realpathSync(resolved).startsWith(fs.realpathSync(root) + path.sep)) throw Object.assign(new Error("Asset outside module root."), { statusCode: 400 });
  return resolved;
}

function sendFile(request, response, file) {
  const size = fs.statSync(file).size;
  const headers = { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Accept-Ranges": "bytes" };
  let start = 0, end = size - 1, status = 200;
  if (request.headers.range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
    if (!match || !size || (!match[1] && !match[2])) { response.writeHead(416, { ...headers, "Content-Range": "bytes */" + size }); response.end(); return; }
    if (!match[1]) { start = Math.max(0, size - Number(match[2])); }
    else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) { response.writeHead(416, { ...headers, "Content-Range": "bytes */" + size }); response.end(); return; }
    status = 206; headers["Content-Range"] = "bytes " + start + "-" + end + "/" + size;
  }
  headers["Content-Length"] = size ? end - start + 1 : 0;
  response.writeHead(status, headers);
  if (request.method === "HEAD" || !size) { response.end(); return; }
  const stream = fs.createReadStream(file, { start, end });
  stream.on("error", () => response.destroy()); response.on("close", () => stream.destroy()); stream.pipe(response);
}

class WebAssets {
  constructor(options) { Object.assign(this, options); }
  base(id) { return "http://127.0.0.1:" + this.port() + "/api/public/assets/" + encodeURIComponent(id); }
  mediaDirectory(id) { return path.join(this.dataDirectory, "module-data", id, "media"); }
  index(id) { try { return JSON.parse(fs.readFileSync(path.join(this.mediaDirectory(id), "index.json"), "utf8")); } catch (_) { return []; } }
  listMedia(id) { return this.index(id).map((item) => ({ ...item, src: "http://127.0.0.1:" + this.port() + "/api/public/media/" + encodeURIComponent(id) + "/" + encodeURIComponent(item.filename), enabled: true })); }
  importMedia(id, files) {
    const manifest = this.registry.readManifest(id);
    if (manifest?.media?.kind !== "video") throw new Error("This module does not accept video media.");
    if (!Array.isArray(files) || !files.length) throw new Error("Choose a supported video file.");
    for (const file of files) if (![".mp4", ".webm", ".m4v", ".mov"].includes(path.extname(file).toLowerCase()) || !fs.statSync(file).isFile()) throw new Error("Choose a supported video file.");
    const directory = this.mediaDirectory(id); fs.mkdirSync(directory, { recursive: true });
    const entries = this.index(id);
    const created = [];
    try { for (const file of files) {
      const extension = path.extname(file).toLowerCase();
      if (![".mp4", ".webm", ".m4v", ".mov"].includes(extension) || !fs.statSync(file).isFile()) throw new Error("Choose a supported video file.");
      const mediaId = crypto.randomUUID(); const filename = mediaId + extension;
      fs.copyFileSync(file, path.join(directory, filename));
      created.push(path.join(directory, filename));
      entries.push({ id: mediaId, filename, label: path.basename(file, extension), size: fs.statSync(file).size });
    }
    fs.writeFileSync(path.join(directory, "index.json.tmp"), JSON.stringify(entries, null, 2));
    fs.renameSync(path.join(directory, "index.json.tmp"), path.join(directory, "index.json"));
    } catch (error) { for (const file of created) fs.rmSync(file, { force: true }); fs.rmSync(path.join(directory, "index.json.tmp"), { force: true }); throw error; }
    return this.listMedia(id);
  }
  async handle(request, response, url) {
    const match = /^\/api\/public\/(assets|media)\/([a-z0-9][a-z0-9-]*)(?:\/(.*))?$/.exec(url.pathname);
    if (!match) return false;
    if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405); response.end(); return true; }
    const [, kind, id, encoded] = match;
    const manifest = this.registry.readManifest(id);
    if (!manifest) throw Object.assign(new Error("Module not installed."), { statusCode: 404 });
    if (kind === "media") {
      if (manifest.media?.kind !== "video") throw Object.assign(new Error("No media for this module."), { statusCode: 404 });
      if (!encoded) {
        const body = Buffer.from(JSON.stringify({ media: this.listMedia(id) }));
        response.writeHead(200, { "Content-Type": "application/json", "Content-Length": body.length, "Cache-Control": "no-store" }); response.end(request.method === "HEAD" ? undefined : body); return true;
      }
      let filename; try { filename = decodeURIComponent(encoded); } catch (_) { throw Object.assign(new Error("Invalid media path."), { statusCode: 400 }); }
      if (!this.index(id).some((item) => item.filename === filename)) throw Object.assign(new Error("Media not found."), { statusCode: 404 });
      sendFile(request, response, inside(this.mediaDirectory(id), filename)); return true;
    }
    if (!manifest.web) throw Object.assign(new Error("Module has no browser assets."), { statusCode: 404 });
    const state = (await this.moduleStates()).states.get(id);
    if (["broken", "incompatible", "missing-dependency"].includes(state?.state)) throw Object.assign(new Error(state.problem), { statusCode: 409 });
    let relative; try { relative = decodeURIComponent(encoded || "index.html"); } catch (_) { throw Object.assign(new Error("Invalid asset path."), { statusCode: 400 }); }
    const moduleDirectory = this.registry.moduleDirectory(id);
    const root = path.join(moduleDirectory, manifest.web.root);
    if (!fs.existsSync(root)) throw Object.assign(new Error("Browser assets not found."), { statusCode: 404 });
    if (!fs.realpathSync(root).startsWith(fs.realpathSync(moduleDirectory) + path.sep)) throw Object.assign(new Error("Invalid browser asset root."), { statusCode: 400 });
    sendFile(request, response, inside(root, relative)); return true;
  }
}

module.exports = { WebAssets, inside, sendFile };
