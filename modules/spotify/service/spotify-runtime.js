const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const port = Number(process.env.COMPANION_SERVICE_PORT || process.env.SPOTIFY_SERVICE_PORT) || 3127;
const dataDirectory = process.env.COMPANION_DATA_DIRECTORY || process.env.SPOTIFY_DATA_DIRECTORY || path.join(process.cwd(), "spotify-data");
const configPath = path.join(dataDirectory, "config.json");
const authPath = path.join(dataDirectory, "spotify-auth.json");
const scopes = "user-modify-playback-state user-read-playback-state";
const testMode = process.env.SPOTIFY_TEST_MODE === "1";
const authStates = new Set();
const announcementPath = path.join(dataDirectory, "announcement-state.json");
const runtimeLogPath = path.join(dataDirectory, "spotify-runtime.log");
const runtime = { accessToken: "", expiresAtMs: 0, fade: null, applying: false, lastError: "", currentScene: "", sceneSession: null, playbackSession: null };
const testPlayback = { isPlaying: false, startCount: 0, pauseCount: 0, volume: null };
fs.mkdirSync(dataDirectory, { recursive: true });

function logRuntime(level, value) {
  try { fs.appendFileSync(runtimeLogPath, new Date().toISOString() + " [" + level + "] " + String(value || "") + "\n"); } catch (_) {}
}

function readJson(file, fallback = {}) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (_) { return fallback; }
}

function writeJson(file, value) {
  const temporary = file + ".tmp";
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2));
  fs.renameSync(temporary, file);
}

function config() { return readJson(configPath); }
function auth() { return readJson(authPath); }
function clamp(value, minimum, maximum, fallback) { const number = Number(value); return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback; }
function redirectUri(settings) { return settings.redirectUri || "http://127.0.0.1:" + port + "/spotify/callback"; }
function configured(settings = config()) { return Boolean(settings.clientId && settings.clientSecret && auth().refreshToken); }

function sceneBindings(settings) {
  const automation = settings.sceneAutomation || {};
  if (Array.isArray(automation.bindings)) return automation.bindings;
  return (Array.isArray(automation.scenes) ? automation.scenes : []).map((scene) => ({
    scene: String(scene || "").trim(), playlist: automation.playlist || "", startVolume: automation.volume ?? "",
    normalVolume: "", fadeSeconds: "", leaveBehavior: automation.pauseOnLeave === false ? "keep" : "pause"
  })).filter((entry) => entry.scene);
}

function bindingFor(settings, scene) {
  return sceneBindings(settings).find((entry) => String(entry.scene || "").toLowerCase() === String(scene || "").toLowerCase()) || null;
}

function status() {
  const settings = config();
  const token = auth();
  return {
    service: "spotify",
    ready: true,
    configured: configured(settings),
    hasClientId: Boolean(settings.clientId),
    hasClientSecret: Boolean(settings.clientSecret),
    hasRefreshToken: Boolean(token.refreshToken),
    hasPlaylist: Boolean(settings.playlist),
    hasDeviceId: Boolean(settings.deviceId),
    redirectUri: redirectUri(settings),
    fade: runtime.fade ? { enabled: true, targetVolume: runtime.fade.targetVolume, endAtMs: runtime.fade.endAtMs } : { enabled: false },
    sceneAutomation: {
      enabled: Boolean(settings.sceneAutomation && settings.sceneAutomation.enabled),
      scenes: sceneBindings(settings).map((entry) => entry.scene),
      bindings: sceneBindings(settings),
      currentScene: runtime.currentScene,
      session: runtime.sceneSession
    },
    playbackOwnership: runtime.playbackSession,
    lastError: runtime.lastError,
    ...(testMode ? { testPlayback } : {})
  };
}

function requireCredentials(settings) {
  if (!settings.clientId || !settings.clientSecret) throw new Error("Spotify client ID and secret are not configured.");
}

async function tokenRequest(settings, fields) {
  requireCredentials(settings);
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(settings.clientId + ":" + settings.clientSecret).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams(fields)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error_description || payload.error || "Spotify token request returned " + response.status + ".");
  return payload;
}

async function accessToken() {
  if (runtime.accessToken && Date.now() < runtime.expiresAtMs - 60000) return runtime.accessToken;
  const settings = config();
  const stored = auth();
  if (!stored.refreshToken) throw new Error("Spotify is not authorized. Open /spotify/login.");
  const payload = await tokenRequest(settings, { grant_type: "refresh_token", refresh_token: stored.refreshToken });
  runtime.accessToken = payload.access_token;
  runtime.expiresAtMs = Date.now() + (Number(payload.expires_in) || 3600) * 1000;
  return runtime.accessToken;
}

async function spotifyRequest(endpoint, options = {}) {
  const response = await fetch("https://api.spotify.com/v1" + endpoint, {
    ...options,
    headers: { Authorization: "Bearer " + await accessToken(), ...(options.headers || {}) }
  });
  if (!response.ok) throw new Error("Spotify " + endpoint + " returned " + response.status + ": " + (await response.text() || response.statusText));
  return response;
}

async function devices() {
  if (testMode) return [{ id: "test-device", name: "Test device", is_active: testPlayback.isPlaying, is_restricted: false }];
  const result = await spotifyRequest("/me/player/devices");
  return (await result.json()).devices || [];
}

async function ensurePlaybackDevice(settings) {
  if (testMode) return { deviceId: "test-device", transferred: false };
  const available = await devices();
  const active = available.find((device) => device.is_active && !device.is_restricted);
  if (active) return { deviceId: active.id, transferred: false };
  const preferred = settings.deviceId && available.find((device) => device.id === settings.deviceId && !device.is_restricted);
  if (!preferred) throw new Error(settings.deviceId ? "The configured Spotify device is unavailable." : "Spotify has no active playback device. Open Spotify on the stream computer or configure a device.");
  await spotifyRequest("/me/player", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ device_ids: [preferred.id], play: false }) });
  return { deviceId: preferred.id, transferred: true };
}

function playlistUri(value) {
  const raw = String(value || "").trim();
  if (raw.startsWith("spotify:playlist:")) return raw;
  try { const match = new URL(raw).pathname.match(/\/playlist\/([A-Za-z0-9]+)/); if (match) return "spotify:playlist:" + match[1]; } catch (_) {}
  const id = raw.match(/[A-Za-z0-9]{10,}/)?.[0];
  if (!id) throw new Error("Spotify playlist must be a playlist URL, URI, or ID.");
  return "spotify:playlist:" + id;
}

async function setVolume(volume) {
  if (testMode) { testPlayback.volume = Math.round(clamp(volume, 0, 100, 50)); return; }
  const settings = config();
  const query = new URLSearchParams({ volume_percent: String(Math.round(clamp(volume, 0, 100, 50))) });
  if (settings.deviceId) query.set("device_id", settings.deviceId);
  await spotifyRequest("/me/player/volume?" + query, { method: "PUT" });
}

function armFade(settings, durationSeconds) {
  const startVolume = clamp(settings.startVolume, 0, 100, NaN);
  const targetVolume = clamp(settings.onStreamVolume, 0, 100, NaN);
  const fadeSeconds = clamp(settings.fadeSeconds, 0, 3600, 0);
  if (!Number.isFinite(startVolume) || !Number.isFinite(targetVolume) || !fadeSeconds || !durationSeconds) { runtime.fade = null; return { status: "disabled" }; }
  runtime.fade = { startVolume, targetVolume, fadeMs: fadeSeconds * 1000, endAtMs: Date.now() + durationSeconds * 1000, lastVolume: startVolume };
  return { status: "armed", startVolume, targetVolume, fadeSeconds };
}

async function startPlaylist(durationSeconds, overrideSettings = null) {
  const settings = overrideSettings || config();
  const uri = playlistUri(settings.playlist);
  const volume = settings.startVolume === "" || settings.startVolume === undefined ? null : Math.round(clamp(settings.startVolume, 0, 100, 50));
  const fade = armFade(settings, Number(durationSeconds) || 0);
  if (testMode) {
    if (volume !== null) await setVolume(volume);
    testPlayback.isPlaying = true;
    testPlayback.startCount += 1;
    return { playlist: uri, shuffle: true, volume: volume === null ? "skipped" : volume, fade, playback: "started" };
  }
  const playbackDevice = await ensurePlaybackDevice(settings);
  if (volume !== null) await setVolume(volume);
  const deviceId = settings.deviceId || playbackDevice.deviceId;
  const device = deviceId ? { device_id: deviceId } : {};
  await spotifyRequest("/me/player/shuffle?" + new URLSearchParams({ state: "true", ...device }), { method: "PUT" });
  await spotifyRequest("/me/player/play" + (deviceId ? "?" + new URLSearchParams(device) : ""), {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ context_uri: uri })
  });
  return { playlist: uri, shuffle: true, volume: volume === null ? "skipped" : volume, fade, playback: "started" };
}

function sceneRequestKey(scene) { return "scene:" + String(scene || "").toLowerCase(); }
function sessionRequests() { return runtime.playbackSession && runtime.playbackSession.requests || {}; }
function hasRequest(kind) { return Object.keys(sessionRequests()).some((key) => key === kind || key.startsWith(kind + ":")); }

function createPlaybackSession(startedByService) {
  runtime.playbackSession = { startedAtMs: Date.now(), startedByService: Boolean(startedByService), requests: {} };
  return runtime.playbackSession;
}

function releaseCountdown(preservePlayback = true) {
  if (!runtime.playbackSession) return;
  delete runtime.playbackSession.requests.countdown;
  if (preservePlayback) runtime.playbackSession.startedByService = false;
  if (!Object.keys(runtime.playbackSession.requests).length) runtime.playbackSession = null;
  if (runtime.sceneSession && preservePlayback) runtime.sceneSession.ownsPlayback = false;
}

async function startCountdown(durationSeconds) {
  const duration = Math.max(0, Number(durationSeconds) || 0);
  let session = runtime.playbackSession;
  let result;
  if (!session || !session.startedByService) {
    result = await startPlaylist(duration);
    session = session || createPlaybackSession(true);
    session.startedByService = true;
  } else {
    const settings = config();
    const volume = settings.startVolume === "" || settings.startVolume === undefined ? null : Math.round(clamp(settings.startVolume, 0, 100, 50));
    if (volume !== null) await setVolume(volume);
    result = { playlist: playlistUri(settings.playlist), shuffle: "preserved", volume: volume === null ? "skipped" : volume, fade: armFade(settings, duration), playback: "preserved-active-session" };
  }
  session.requests.countdown = { acquiredAtMs: Date.now(), endAtMs: duration ? Date.now() + duration * 1000 : null, preserveOnRelease: true };
  runtime.lastError = "";
  return { ...result, ownership: "countdown", sharedWithScene: hasRequest("scene") };
}

async function playbackState() {
  if (testMode) return { isPlaying: testPlayback.isPlaying, deviceId: "test-device" };
  const response = await spotifyRequest("/me/player", { method: "GET" });
  if (response.status === 204) return { isPlaying: false, deviceId: "" };
  const payload = await response.json();
  return { isPlaying: Boolean(payload.is_playing), deviceId: payload.device && payload.device.id || "" };
}

async function pausePlayback() {
  if (testMode) { testPlayback.isPlaying = false; testPlayback.pauseCount += 1; return; }
  const settings = config();
  const query = settings.deviceId ? "?" + new URLSearchParams({ device_id: settings.deviceId }) : "";
  await spotifyRequest("/me/player/pause" + query, { method: "PUT" });
}

function normalizedScenes(settings) {
  return sceneBindings(settings).map((entry) => String(entry.scene || "").trim()).filter(Boolean);
}

async function handleScene(sceneName) {
  const scene = String(sceneName || "").trim();
  if (!scene) throw new Error("Scene name is required.");
  const settings = config();
  const automation = settings.sceneAutomation || {};
  const scenes = normalizedScenes(settings);
  const wasScene = runtime.currentScene;
  runtime.currentScene = scene;
  if (!automation.enabled || !scenes.length) return { status: "disabled", scene };
  const isMusicScene = scenes.some((candidate) => candidate.toLowerCase() === scene.toLowerCase());
  const wasMusicScene = runtime.sceneSession && scenes.some((candidate) => candidate.toLowerCase() === String(wasScene).toLowerCase());

  if (runtime.sceneSession && !isMusicScene && wasMusicScene) {
    const session = runtime.sceneSession;
    runtime.sceneSession = null;
    if (runtime.playbackSession) delete runtime.playbackSession.requests[sceneRequestKey(wasScene)];
    if (hasRequest("countdown")) return { status: "left-countdown-kept-playback", scene, leftScene: wasScene };
    const oldBinding = bindingFor(settings, wasScene);
    const pauseOnLeave = oldBinding ? oldBinding.leaveBehavior !== "keep" : automation.pauseOnLeave !== false;
    if (session.ownsPlayback && runtime.playbackSession && runtime.playbackSession.startedByService && pauseOnLeave) {
      await pausePlayback();
      runtime.playbackSession = null;
      runtime.lastError = "";
      return { status: "paused-owned-playback", scene, leftScene: wasScene };
    }
    if (runtime.playbackSession && !Object.keys(runtime.playbackSession.requests).length) runtime.playbackSession = null;
    return { status: "left-preserved-playback", scene, leftScene: wasScene };
  }
  if (!isMusicScene) return { status: "unmanaged", scene };
  if (runtime.sceneSession && runtime.sceneSession.enteredScene.toLowerCase() !== scene.toLowerCase()) {
    if (runtime.playbackSession) {
      delete runtime.playbackSession.requests[sceneRequestKey(runtime.sceneSession.enteredScene)];
      runtime.playbackSession.requests[sceneRequestKey(scene)] = { acquiredAtMs: Date.now(), pauseOnRelease: automation.pauseOnLeave !== false };
    }
    runtime.sceneSession.enteredScene = scene;
  }
  if (runtime.sceneSession) return { status: "session-active", scene, ownsPlayback: runtime.sceneSession.ownsPlayback };

  if (runtime.playbackSession) {
    runtime.playbackSession.requests[sceneRequestKey(scene)] = { acquiredAtMs: Date.now(), pauseOnRelease: automation.pauseOnLeave !== false };
    runtime.sceneSession = { enteredScene: scene, startedAtMs: Date.now(), ownsPlayback: runtime.playbackSession.startedByService };
    return { status: "joined-active-playback", scene, ownsPlayback: runtime.sceneSession.ownsPlayback, countdownActive: hasRequest("countdown") };
  }

  const playback = await playbackState();
  if (playback.isPlaying) {
    const ownership = createPlaybackSession(false);
    ownership.requests[sceneRequestKey(scene)] = { acquiredAtMs: Date.now(), pauseOnRelease: automation.pauseOnLeave !== false };
    runtime.sceneSession = { enteredScene: scene, startedAtMs: Date.now(), ownsPlayback: false };
    runtime.lastError = "";
    return { status: "preserved-existing-playback", scene, ownsPlayback: false };
  }
  const binding = bindingFor(settings, scene) || {};
  if (binding.playlist) settings.playlist = binding.playlist;
  if (binding.startVolume !== "" && binding.startVolume !== undefined) settings.startVolume = binding.startVolume;
  if (binding.normalVolume !== "" && binding.normalVolume !== undefined) settings.onStreamVolume = binding.normalVolume;
  if (binding.fadeSeconds !== "" && binding.fadeSeconds !== undefined) settings.fadeSeconds = binding.fadeSeconds;
  const result = await startPlaylist(0, settings);
  const ownership = createPlaybackSession(true);
  ownership.requests[sceneRequestKey(scene)] = { acquiredAtMs: Date.now(), pauseOnRelease: automation.pauseOnLeave !== false };
  runtime.sceneSession = { enteredScene: scene, startedAtMs: Date.now(), ownsPlayback: true };
  runtime.lastError = "";
  return { status: "started-owned-playback", scene, ownsPlayback: true, playback: result.playback, playlist: settings.playlist, volume: settings.startVolume };
}

async function currentPlayback() {
  if (testMode) return { playing: testPlayback.isPlaying, trackId: "test-track", track: "Test Track", artists: ["Test Artist"], playlist: "Test Playlist", progressMs: 1000, durationMs: 180000 };
  const response = await spotifyRequest("/me/player", { method: "GET" });
  if (response.status === 204) return { playing: false, trackId: "", track: "", artists: [], playlist: "" };
  const payload = await response.json();
  const item = payload.item || {};
  return {
    playing: Boolean(payload.is_playing), trackId: item.id || "", track: item.name || "",
    artists: Array.isArray(item.artists) ? item.artists.map((artist) => artist.name).filter(Boolean) : [],
    playlist: payload.context && payload.context.type === "playlist" ? await playlistName(payload.context.href) : "",
    progressMs: Number(payload.progress_ms) || 0, durationMs: Number(item.duration_ms) || 0
  };
}

async function playlistName(href) {
  if (!href) return "";
  const response = await fetch(href, { headers: { Authorization: "Bearer " + await accessToken() } });
  if (!response.ok) return "";
  const payload = await response.json().catch(() => ({}));
  return String(payload.name || "");
}

function announcementDecision(playback, settings = config()) {
  const announcements = settings.announcements || {};
  const saved = readJson(announcementPath, {});
  const key = playback.playing && playback.trackId ? playback.trackId : "";
  const shouldAnnounce = Boolean(announcements.nowPlayingEnabled && key && saved.lastTrackId !== key);
  return { enabled: Boolean(announcements.nowPlayingEnabled), shouldAnnounce, trackKey: key };
}

function runStreamerBotAction(name, args) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(process.env.STREAMERBOT_WEBSOCKET_URL || "ws://127.0.0.1:8080/");
    const id = crypto.randomUUID();
    let finished = false;
    const timer = setTimeout(() => done(new Error("Streamer.bot did not acknowledge the Spotify announcement.")), 4000);
    const done = (error) => { if (finished) return; finished = true; clearTimeout(timer); try { socket.close(); } catch (_) {} error ? reject(error) : resolve(); };
    socket.addEventListener("error", () => done(new Error("Streamer.bot WebSocket is unavailable.")), { once: true });
    socket.addEventListener("open", () => socket.send(JSON.stringify({ request: "DoAction", id, action: { name }, args })), { once: true });
    socket.addEventListener("message", (event) => { try { const response = JSON.parse(String(event.data)); if (response.id === id) done(response.status === "error" ? new Error(response.error || "Streamer.bot rejected the action.") : null); } catch (_) {} });
  });
}

async function tickAnnouncements() {
  const settings = config();
  if (!configured(settings) || !settings.announcements?.nowPlayingEnabled) return;
  const playback = await currentPlayback();
  const decision = announcementDecision(playback, settings);
  if (!decision.shouldAnnounce) return;
  const songText = playback.track + (playback.artists.length ? " by " + playback.artists.join(", ") : "");
  try { await runStreamerBotAction("Spotify - Send Chat", { spotifyChatMessage: "Now playing: " + songText }); writeJson(announcementPath, { lastTrackId: decision.trackKey, observedAtMs: Date.now(), announced: true }); runtime.lastError = ""; }
  catch (error) { runtime.lastError = error.message; logRuntime("warn", error.stack || error.message); }
}

async function tickFade() {
  const fade = runtime.fade;
  if (!fade || runtime.applying) return;
  const remaining = Math.max(0, fade.endAtMs - Date.now());
  if (remaining > fade.fadeMs) return;
  const progress = Math.min(1, 1 - remaining / fade.fadeMs);
  const volume = Math.round(fade.startVolume + (fade.targetVolume - fade.startVolume) * progress);
  if (volume === fade.lastVolume && remaining > 0) return;
  runtime.applying = true;
  try { await setVolume(volume); fade.lastVolume = volume; runtime.lastError = ""; if (!remaining) { runtime.fade = null; releaseCountdown(true); } }
  catch (error) { runtime.lastError = error.message; runtime.fade = null; }
  finally { runtime.applying = false; }
}

function tickOwnership() {
  const countdown = runtime.playbackSession && runtime.playbackSession.requests.countdown;
  if (countdown && countdown.endAtMs && Date.now() >= countdown.endAtMs && !runtime.fade) releaseCountdown(true);
}

function json(response, code, payload) { const body = Buffer.from(JSON.stringify(payload)); response.writeHead(code, { "Content-Type": "application/json", "Content-Length": body.length, "Cache-Control": "no-store" }); response.end(body); }
function text(response, code, payload) { const body = Buffer.from(String(payload)); response.writeHead(code, { "Content-Type": "text/plain; charset=utf-8", "Content-Length": body.length }); response.end(body); }

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:" + port);
  try {
    if (request.method === "GET" && ["/health", "/api/spotify/state"].includes(url.pathname)) return json(response, 200, status());
    if (request.method === "GET" && url.pathname === "/api/spotify/scene") return json(response, 200, await handleScene(url.searchParams.get("scene")));
    if (request.method === "GET" && url.pathname === "/api/spotify/config") {
      const settings = config();
      return json(response, 200, { clientId: settings.clientId || "", hasClientSecret: Boolean(settings.clientSecret), hasRefreshToken: Boolean(auth().refreshToken), redirectUri: redirectUri(settings), playlist: settings.playlist || "", startVolume: settings.startVolume ?? "", onStreamVolume: settings.onStreamVolume ?? "", fadeSeconds: settings.fadeSeconds ?? "", deviceId: settings.deviceId || "", sceneAutomation: { ...(settings.sceneAutomation || {}), bindings: sceneBindings(settings) }, announcements: settings.announcements || { songCommandEnabled: false, playlistCommandEnabled: false, nowPlayingEnabled: false } });
    }
    if (request.method === "POST" && url.pathname === "/api/spotify/config") {
      const chunks = []; for await (const chunk of request) chunks.push(chunk);
      const input = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      const settings = config();
      if (Object.prototype.hasOwnProperty.call(input, "clientId")) settings.clientId = String(input.clientId || "").trim();
      if (String(input.clientSecret || "").trim()) settings.clientSecret = String(input.clientSecret).trim();
      if (input.clearClientSecret === true) settings.clientSecret = "";
      if (Object.prototype.hasOwnProperty.call(input, "defaultPlaylist")) settings.playlist = String(input.defaultPlaylist || "").trim();
      if (Object.prototype.hasOwnProperty.call(input, "defaultDeviceId")) settings.deviceId = String(input.defaultDeviceId || "").trim();
      if (Object.prototype.hasOwnProperty.call(input, "defaultStartVolume")) settings.startVolume = input.defaultStartVolume === "" ? "" : Math.round(clamp(input.defaultStartVolume, 0, 100, 80));
      if (Object.prototype.hasOwnProperty.call(input, "defaultOnStreamVolume")) settings.onStreamVolume = input.defaultOnStreamVolume === "" ? "" : Math.round(clamp(input.defaultOnStreamVolume, 0, 100, 35));
      if (Object.prototype.hasOwnProperty.call(input, "defaultFadeSeconds")) settings.fadeSeconds = input.defaultFadeSeconds === "" ? "" : Math.round(clamp(input.defaultFadeSeconds, 0, 3600, 30));
      const legacyScenes = Array.isArray(input.scenes) ? input.scenes : String(input.scenes || "").split(/\r?\n/);
      const suppliedBindings = Array.isArray(input.bindings) ? input.bindings : legacyScenes.filter((scene) => String(scene || "").trim()).map((scene) => ({
        scene, playlist: input.playlist, startVolume: input.volume, leaveBehavior: input.pauseOnLeave === false ? "keep" : "pause"
      }));
      const bindings = suppliedBindings.map((entry) => ({
        scene: String(entry.scene || "").trim(), playlist: String(entry.playlist || "").trim(),
        startVolume: entry.startVolume === "" || entry.startVolume == null ? "" : Math.round(clamp(entry.startVolume, 0, 100, 50)),
        normalVolume: entry.normalVolume === "" || entry.normalVolume == null ? "" : Math.round(clamp(entry.normalVolume, 0, 100, 20)),
        fadeSeconds: entry.fadeSeconds === "" || entry.fadeSeconds == null ? "" : Math.round(clamp(entry.fadeSeconds, 0, 3600, 30)),
        leaveBehavior: entry.leaveBehavior === "keep" ? "keep" : "pause"
      })).filter((entry) => entry.scene).slice(0, 50);
      settings.sceneAutomation = {
        enabled: Boolean(input.enabled),
        bindings,
        scenes: bindings.map((entry) => entry.scene)
      };
      settings.announcements = { songCommandEnabled: Boolean(input.songCommandEnabled), playlistCommandEnabled: Boolean(input.playlistCommandEnabled), nowPlayingEnabled: Boolean(input.nowPlayingEnabled) };
      writeJson(configPath, settings);
      return json(response, 200, { saved: true, sceneAutomation: settings.sceneAutomation, announcements: settings.announcements });
    }
    if (request.method === "GET" && url.pathname === "/spotify/settings") {
      const page = fs.readFileSync(path.join(__dirname, "spotify-settings.html"));
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Content-Length": page.length, "Cache-Control": "no-store" }); return response.end(page);
    }
    if (request.method === "GET" && url.pathname === "/api/spotify/stream-start") return json(response, 200, await startCountdown(clamp(url.searchParams.get("durationSeconds"), 0, 86400, 0)));
    if (request.method === "GET" && url.pathname === "/api/spotify/countdown/release") { runtime.fade = null; releaseCountdown(url.searchParams.get("preserve") !== "false"); return json(response, 200, { released: true, playbackOwnership: runtime.playbackSession }); }
    if (request.method === "GET" && url.pathname === "/spotify/devices") return json(response, 200, { devices: await devices() });
    if (request.method === "GET" && url.pathname === "/api/spotify/current") {
      const playback = await currentPlayback();
      const announcements = config().announcements || {};
      return json(response, 200, { ...playback, songCommandEnabled: Boolean(announcements.songCommandEnabled), playlistCommandEnabled: Boolean(announcements.playlistCommandEnabled), nowPlayingEnabled: Boolean(announcements.nowPlayingEnabled), songText: playback.track ? playback.track + (playback.artists.length ? " by " + playback.artists.join(", ") : "") : "Nothing is currently playing.", playlistText: playback.playlist || "The current playlist name is unavailable." });
    }
    if (request.method === "GET" && url.pathname === "/spotify/login") {
      const settings = config(); requireCredentials(settings); const state = crypto.randomBytes(16).toString("hex"); authStates.add(state);
      const target = "https://accounts.spotify.com/authorize?" + new URLSearchParams({ client_id: settings.clientId, response_type: "code", redirect_uri: redirectUri(settings), scope: scopes, state, show_dialog: "true" });
      response.writeHead(302, { Location: target }); return response.end();
    }
    if (request.method === "GET" && url.pathname === "/spotify/callback") {
      if (!url.searchParams.get("code") || !authStates.delete(url.searchParams.get("state"))) return text(response, 400, "Spotify authorization state did not match.");
      const settings = config();
      const payload = await tokenRequest(settings, { grant_type: "authorization_code", code: url.searchParams.get("code"), redirect_uri: redirectUri(settings) });
      if (payload.refresh_token) writeJson(authPath, { refreshToken: payload.refresh_token, createdAtMs: Date.now(), createdAt: new Date().toISOString(), scope: payload.scope || "" });
      runtime.accessToken = payload.access_token || ""; runtime.expiresAtMs = Date.now() + (Number(payload.expires_in) || 3600) * 1000;
      return text(response, 200, "Spotify authorization saved. You may close this page.");
    }
    return json(response, 404, { error: "Not found" });
  } catch (error) { runtime.lastError = error.message; logRuntime("error", error.stack || error.message); json(response, 502, { status: "error", error: error.message }); }
});

const fadeTimer = setInterval(() => { tickOwnership(); tickFade().catch(() => {}); }, 1000);
const announcementTimer = setInterval(() => { tickAnnouncements().catch((error) => { runtime.lastError = error.message; logRuntime("error", error.stack || error.message); }); }, Math.max(250, Number(process.env.SPOTIFY_ANNOUNCEMENT_INTERVAL_MS) || 15000));
server.on("error", (error) => logRuntime("fatal", error.stack || error.message));
process.on("uncaughtException", (error) => { logRuntime("fatal", error.stack || error.message); process.exitCode = 1; });
process.on("unhandledRejection", (error) => logRuntime("error", error && (error.stack || error.message) || error));
server.listen(port, "127.0.0.1", () => { logRuntime("info", "service listening on http://127.0.0.1:" + port); console.log("[spotify] service listening on http://127.0.0.1:" + port); });
function shutdown() { clearInterval(fadeTimer); clearInterval(announcementTimer); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 2000).unref(); }
process.on("SIGTERM", shutdown); process.on("SIGINT", shutdown);
