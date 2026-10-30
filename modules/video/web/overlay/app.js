"use strict";
const transport = StreamingTransport.create(), box = document.getElementById("player"), video = document.querySelector("video"), title = document.getElementById("title");
let active = null, stopSent = null;
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value)));
function hide() { box.style.display = "none"; video.pause(); video.removeAttribute("src"); video.load(); active = null; }
function stop(startedAtMs, error = "") { if (!startedAtMs || stopSent === startedAtMs) return; stopSent = startedAtMs; transport.execute("video", "Stop", { startedAtMs, error }).catch(() => {}); }
transport.subscribe("video", (event) => {
  const current = event.payload.current || {}, p = current.presentation || event.payload.config?.presentation || {};
  if (!current.visible || !current.src || !transport.getHealth().connected) { hide(); return; }
  const anchor = p.anchor || "center", x = anchor.includes("left") ? 0 : anchor.includes("right") ? 100 : 50, y = anchor.includes("top") ? 0 : anchor.includes("bottom") ? 100 : 50;
  box.style.display = "flex"; box.style.left = (x + Number(p.offsetXPercent || 0)) + "%"; box.style.top = (y + Number(p.offsetYPercent || 0)) + "%"; box.style.transform = `translate(${-x}%,${-y}%)`; box.style.width = clamp(p.widthPercent ?? 50, 10, 100) + "%"; box.style.height = "auto";
  video.style.aspectRatio = p.aspectRatio === "source" ? "auto" : (p.aspectRatio || "16:9").replace(":", "/"); video.style.objectFit = current.fit || p.fit || "contain";
  if (current.width != null) { box.style.width = Number(current.width) + "px"; box.style.height = Number(current.height || 0) > 0 ? Number(current.height) + "px" : "auto"; box.style.left = Number(current.x || 0) + "px"; box.style.top = Number(current.y || 0) + "px"; box.style.transform = "none"; }
  title.textContent = current.title || ""; title.style.display = current.title ? "block" : "none"; title.style.order = p.titlePosition === "top" ? "-1" : "1"; title.style.fontSize = clamp(p.titleSize || 24, 12, 72) + "px"; title.style.color = p.titleColour || "#f8fbff";
  const colour = /^#[a-f0-9]{6}$/i.test(p.titleBackground || "") ? p.titleBackground : "#000000"; title.style.background = colour + Math.round(clamp(p.titleOpacityPercent ?? 68, 0, 100) * 2.55).toString(16).padStart(2, "0");
  video.volume = clamp(current.volume ?? 1, 0, 1); video.muted = !!current.muted; video.loop = !!current.loop;
  if (active !== current.startedAtMs || video.getAttribute("src") !== current.src) { active = current.startedAtMs; stopSent = null; video.src = current.src; const start = active; video.play().catch(() => stop(start, "Browser playback failed.")); }
});
transport.subscribe("connection", (health) => { if (!health.connected) hide(); });
video.addEventListener("ended", () => stop(active)); video.addEventListener("error", () => stop(active, "Media failed to load."));
transport.connect(); window.addEventListener("pagehide", () => { hide(); transport.close(); });
