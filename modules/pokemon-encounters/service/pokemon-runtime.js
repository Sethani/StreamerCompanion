const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { parseCatchCommand, parseCommunityMessage, parsePokemonLabel, slugFor } = require("./pokemon-core");

function createService(options = {}) {
const port = options.port ?? (Number(process.env.COMPANION_SERVICE_PORT || process.env.POKEMON_SERVICE_PORT) || 3128);
const fetcher = options.fetch || globalThis.fetch;
const dataDirectory = options.dataDirectory || process.env.COMPANION_DATA_DIRECTORY || process.env.POKEMON_DATA_DIRECTORY || path.join(process.cwd(), "pokemon-data");
const configPath = path.join(dataDirectory, "config.json");
const cacheDirectory = path.join(dataDirectory, "cache");
const artworkDirectory = path.join(cacheDirectory, "artwork");
const typeIconDirectory = fs.existsSync(path.join(__dirname, "type-icons")) ? path.join(__dirname, "type-icons") : path.join(dataDirectory, "assets/type-icons");
const ballIconDirectory = fs.existsSync(path.join(__dirname, "ball-icons")) ? path.join(__dirname, "ball-icons") : path.join(dataDirectory, "assets/ball-icons");
fs.mkdirSync(artworkDirectory, { recursive: true });
const defaultConfig = { enabled: false, durationSeconds: 90, showTimer: true, position: "bottom-right", width: 320, opacity: 88, artwork: "official-artwork", throwAnimations: true, showThrowNames: true, throwSpeedMs: 1100, throwQueueLimit: 10 };
const state = { revision: 0, encounter: null, throws: [], lastEvent: null, lastError: "" };
const catchers = new Set();

function readJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (_) { return fallback; } }
function writeJson(file, value) { const temporary = file + ".tmp"; fs.writeFileSync(temporary, JSON.stringify(value, null, 2)); fs.renameSync(temporary, file); }
function config() { return { ...defaultConfig, ...readJson(configPath, {}) }; }
function publicState() { const settings = config(); return { service: "pokemon", ready: true, revision: state.revision, enabled: settings.enabled, config: settings, encounter: state.encounter, throws: state.throws, lastEvent: state.lastEvent, lastError: state.lastError, serverTimeMs: Date.now() }; }
function touch(event) { state.revision += 1; state.lastEvent = { ...event, atMs: Date.now() }; }

async function resolvePokemon(name, slugInput = "") {
  const requestedName = String(name || "").trim().slice(0, 80);
  if (!requestedName) throw new Error("Enter a Pokemon name to test.");
  const variant = parsePokemonLabel(requestedName);
  const slug = slugInput || slugFor(name);
  const variantKey = [slug, variant.gender, variant.shiny ? "shiny" : ""].filter(Boolean).join("-");
  const metadataFile = path.join(cacheDirectory, variantKey + ".json");
  let metadata = readJson(metadataFile, null);
  if (!metadata || metadata.cacheVersion !== 3 || !Array.isArray(metadata.types)) {
    let response = await fetcher("https://pokeapi.co/api/v2/pokemon/" + encodeURIComponent(slug));
    let form = null;
    if (response.status === 404) {
      const formResponse = await fetcher("https://pokeapi.co/api/v2/pokemon-form/" + encodeURIComponent(slug));
      if (formResponse.status !== 404 && !formResponse.ok) throw new Error("PokeAPI form lookup failed (HTTP " + formResponse.status + ").");
      if (formResponse.ok) {
        form = await formResponse.json();
        const baseName = form.pokemon?.name;
        if (typeof baseName !== "string" || !/^[a-z0-9-]+$/.test(baseName)) throw new Error("PokeAPI form has no valid base Pokemon.");
        response = await fetcher("https://pokeapi.co/api/v2/pokemon/" + encodeURIComponent(baseName));
      }
    }
    if (response.status === 404) throw new Error("No Pokemon was found for \"" + requestedName + "\".");
    if (!response.ok) throw new Error("PokeAPI lookup failed for " + requestedName + " (HTTP " + response.status + ").");
    const payload = await response.json();
    // Cosmetic forms own their artwork; their linked Pokemon owns types/stats.
    const sprites = (form ? form.sprites : payload.sprites) || {};
    const latest = sprites.versions?.["generation-ix"]?.["scarlet-violet"] || {};
    const home = sprites.other?.home || {};
    const official = sprites.other?.["official-artwork"] || {};
    const female = variant.gender === "female";
    const artworkUrl = variant.shiny
      ? (female && (latest.front_shiny_female || home.front_shiny_female || sprites.front_shiny_female)) || official.front_shiny || latest.front_shiny || home.front_shiny || sprites.front_shiny
      : (female && (latest.front_female || home.front_female || sprites.front_female)) || official.front_default || latest.front_default || home.front_default || sprites.front_default;
    metadata = {
      cacheVersion: 3,
      id: payload.id,
      slug: payload.name,
      displayName: /^nidoran\s*[([]?[fm♀♂]/i.test(variant.original) ? "Nidoran" : variant.original,
      gender: variant.gender,
      shiny: variant.shiny,
      region: variant.region,
      artworkUrl: artworkUrl || "",
      types: (payload.types || []).map((entry) => ({
        id: Number(String(entry.type?.url || "").match(/\/type\/(\d+)\/?$/)?.[1]) || 0,
        name: String(entry.type?.name || ""),
        slot: Number(entry.slot) || 0
      })).filter((entry) => entry.id > 0 && entry.id <= 18 && entry.name).sort((a, b) => a.slot - b.slot)
    };
    writeJson(metadataFile, metadata);
  }
  const artworkFile = path.join(artworkDirectory, variantKey + ".png");
  if (!fs.existsSync(artworkFile) && metadata.artworkUrl) {
    const image = await fetcher(metadata.artworkUrl);
    if (!image.ok) throw new Error("Pokemon artwork returned HTTP " + image.status + ".");
    fs.writeFileSync(artworkFile, Buffer.from(await image.arrayBuffer()));
  }
  return { ...metadata, imageUrl: fs.existsSync(artworkFile) ? "/pokemon/art/" + encodeURIComponent(variantKey) + ".png" : metadata.artworkUrl };
}

async function handleMessage(sender, message) {
  const catchCommand = parseCatchCommand(message);
  if (catchCommand && String(sender || "").trim().toLowerCase().replace(/^@/, "") !== "pokemoncommunitygame") {
    if (!config().enabled) return { accepted: false, type: "disabled" };
    if (!state.encounter) return { accepted: false, type: "catch", reason: "no-encounter" };
    const settings = config();
    if (!settings.throwAnimations) return { accepted: false, type: "catch", reason: "animations-disabled" };
    const user = String(sender || "viewer").trim().replace(/^@/, "").slice(0, 40) || "viewer";
    const key = state.encounter.id + ":" + user.toLowerCase();
    if (catchers.has(key)) return { accepted: false, type: "catch", reason: "already-threw" };
    catchers.add(key);
    const thrown = { id: Date.now() + "-" + Math.random().toString(36).slice(2, 8), encounterId: state.encounter.id, user, ball: catchCommand.ball, requested: catchCommand.requested, fallback: Boolean(catchCommand.fallback), atMs: Date.now() };
    state.throws.push(thrown);
    const retained = Math.max(1, Math.min(30, Number(settings.throwQueueLimit) || 10));
    if (state.throws.length > retained) state.throws.splice(0, state.throws.length - retained);
    touch({ type: "catch", user, ball: thrown.ball });
    return { accepted: true, type: "catch", thrown };
  }
  const parsed = parseCommunityMessage(sender, message, state.encounter);
  if (parsed.type === "ignored") return { accepted: false, ...parsed };
  if (parsed.type === "clear") { const previous = state.encounter; state.encounter = null; state.throws=[];catchers.clear();touch(parsed); return { accepted: true, cleared: true, previous }; }
  const settings = config();
  if (!settings.enabled) return { accepted: false, type: "disabled" };
  const pokemon = parsed.mystery ? {
    id: null,
    slug: parsed.slug,
    displayName: parsed.name,
    imageUrl: "",
    gender: "",
    shiny: false,
    region: "",
    types: [],
    mystery: true
  } : await resolvePokemon(parsed.name, parsed.slug);
  const durationSeconds = parsed.durationSeconds || settings.durationSeconds;
  state.throws=[];catchers.clear();state.encounter = { id: Date.now() + "-" + parsed.slug, name: pokemon.displayName || parsed.name, slug: parsed.slug, pokemonId: pokemon.id, imageUrl: pokemon.imageUrl, mystery: Boolean(pokemon.mystery), gender: pokemon.gender || "", shiny: Boolean(pokemon.shiny), region: pokemon.region || "", types: pokemon.types || [], startedAtMs: Date.now(), expiresAtMs: Date.now() + durationSeconds * 1000 };
  state.lastError = ""; touch(parsed); return { accepted: true, encounter: state.encounter };
}

function sendJson(response, code, payload) { const body = Buffer.from(JSON.stringify(payload)); response.writeHead(code, { "Content-Type": "application/json", "Content-Length": body.length, "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" }); response.end(body); }
function sendFile(response, file, type, cache = "public,max-age=86400") { if (!fs.existsSync(file)) { response.writeHead(404); return response.end(); } const body = fs.readFileSync(file); response.writeHead(200, { "Content-Type": type, "Content-Length": body.length, "Cache-Control": cache, "Access-Control-Allow-Origin": "*" }); response.end(body); }
function sendArtwork(response, file) { if (!fs.existsSync(file)) { response.writeHead(404); return response.end(); } const body=fs.readFileSync(file);const type=body.subarray(0,4).toString()==="RIFF"?"image/webp":"image/png";response.writeHead(200,{"Content-Type":type,"Content-Length":body.length,"Cache-Control":"public,max-age=86400","Access-Control-Allow-Origin":"*"});response.end(body); }

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:" + port);
  try {
    if (!/^((127\.0\.0\.1|localhost)(:\d+)?)$/.test(request.headers.host || "")) return sendJson(response, 403, { error: "Local requests only." });
    if (request.method === "OPTIONS") { response.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }); return response.end(); }
    if (request.method === "GET" && ["/health", "/api/pokemon/state"].includes(url.pathname)) return sendJson(response, 200, publicState());
    if (request.method === "GET" && url.pathname === "/api/pokemon/message") return sendJson(response, 200, await handleMessage(url.searchParams.get("sender"), url.searchParams.get("message")));
    if (request.method === "GET" && url.pathname === "/api/pokemon/test") return sendJson(response, 200, await handleMessage("pokemoncommunitygame", "A wild " + (url.searchParams.get("name") || "Weedle") + " appears Catch it using !pokecatch (winners revealed in 90s)"));
    if (request.method === "GET" && url.pathname === "/api/pokemon/test-throw") return sendJson(response, 200, await handleMessage(url.searchParams.get("user") || "Alice", "!pokecatch " + (url.searchParams.get("ball") || "")));
    if (request.method === "GET" && url.pathname === "/api/pokemon/clear") { state.encounter = null; state.throws=[];catchers.clear();touch({ type: "clear", reason: "manual" }); return sendJson(response, 200, publicState()); }
    if (request.method === "GET" && url.pathname === "/api/pokemon/config") return sendJson(response, 200, config());
    if (request.method === "POST" && url.pathname === "/api/pokemon/config") { const chunks=[];for await(const chunk of request)chunks.push(chunk);const input=JSON.parse(Buffer.concat(chunks).toString("utf8")||"{}");const saved={...config(),enabled:Boolean(input.enabled),durationSeconds:Math.max(10,Math.min(600,Number(input.durationSeconds)||90)),showTimer:input.showTimer!==false,position:["top-left","top-right","bottom-left","bottom-right"].includes(input.position)?input.position:"bottom-right",width:Math.max(160,Math.min(800,Number(input.width)||320)),opacity:Math.max(10,Math.min(100,Number(input.opacity)||88)),artwork:"official-artwork",throwAnimations:input.throwAnimations!==false,showThrowNames:input.showThrowNames!==false,throwSpeedMs:Math.max(500,Math.min(2500,Number(input.throwSpeedMs)||1100)),throwQueueLimit:Math.max(1,Math.min(30,Number(input.throwQueueLimit)||10))};writeJson(configPath,saved);return sendJson(response,200,saved); }
    if (request.method === "GET" && url.pathname === "/pokemon/settings") return sendFile(response, path.join(__dirname, "pokemon-settings.html"), "text/html; charset=utf-8", "no-store");
    if (request.method === "GET" && url.pathname === "/pokemon/overlay") return sendFile(response, path.join(__dirname, "pokemon-overlay.html"), "text/html; charset=utf-8", "no-store");
    if (request.method === "GET" && url.pathname.startsWith("/pokemon/art/")) return sendArtwork(response, path.join(artworkDirectory, path.basename(decodeURIComponent(url.pathname))));
    if (request.method === "GET" && url.pathname.startsWith("/pokemon/type/")) return sendFile(response, path.join(typeIconDirectory, path.basename(decodeURIComponent(url.pathname))), "image/png");
    if (request.method === "GET" && url.pathname.startsWith("/pokemon/ball/")) return sendFile(response, path.join(ballIconDirectory, path.basename(decodeURIComponent(url.pathname))), "image/png");
    return sendJson(response, 404, { error: "Not found" });
  } catch (error) { state.lastError = error.message; sendJson(response, 502, { status: "error", error: error.message }); }
});

let expiry;
function beginExpiry() { expiry = setInterval(() => { if (state.encounter && Date.now() >= state.encounter.expiresAtMs) { state.encounter = null; state.throws=[];catchers.clear();touch({ type: "clear", reason: "deadline" }); } }, 500);
}
return { server, publicState, handleMessage, resolvePokemon,
 async start() { await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(port,"127.0.0.1",resolve)});beginExpiry();return server.address().port; },
 async stop() { clearInterval(expiry); if(server.listening) await new Promise(resolve=>server.close(resolve)); }
};
}
module.exports = { createService };
if (require.main === module) { const service=createService(); service.start().then(port=>console.log("[pokemon] service listening on loopback port "+port)).catch(()=>{console.error("Pokemon service could not start.");process.exitCode=1});for(const signal of ["SIGTERM","SIGINT"])process.on(signal,()=>service.stop().finally(()=>process.exit(0))); }
