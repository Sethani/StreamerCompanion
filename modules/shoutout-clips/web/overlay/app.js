(() => {
  "use strict";
  const transport = window.StreamingTransport.create();
  const layer = document.getElementById("shoutoutclip-layer"), frame = document.getElementById("shoutoutclip-frame"), label = document.getElementById("shoutoutclip-label");
  let state = null, active = "", stopSent = null;
  function embed(clipId, config) {
    const params = new URLSearchParams();
    if (config.clip?.playerMode === "mustached") {
      params.set("clipId", clipId); params.set("platform", "obs");
      return "https://mustachedmaniac.com/widgets/Twitch_Clip_Player?" + params;
    }
    params.set("clip", clipId);
    for (const parent of new Set([location.hostname || "localhost", "localhost", "127.0.0.1"])) params.append("parent", parent);
    params.set("autoplay", "true"); params.set("muted", config.clip?.muted ? "true" : "false"); params.set("preload", "auto");
    return "https://clips.twitch.tv/embed?" + params;
  }
  function hide() { active = ""; layer.className = "microlayer-clip idle"; label.textContent = ""; if (frame.hasAttribute("src")) frame.removeAttribute("src"); }
  function render() {
    if (!state) { hide(); return; }
    const config = state.config || {}, clip = state.clip || {}, box = config.clip || {}, title = config.label || {};
    const expired = Boolean(clip.hideAtMs) && Date.now() >= Number(clip.hideAtMs);
    if (!clip.visible || !clip.clipId || expired) {
      if (expired && stopSent !== clip.startedAtMs) {
        stopSent = clip.startedAtMs;
        transport.execute("shoutoutClip", "Stop", { startedAtMs: clip.startedAtMs }).catch(() => {});
      }
      hide(); return;
    }
    frame.style.left = `${box.x || 0}px`; frame.style.top = `${box.y || 0}px`;
    frame.style.width = `${box.width || 960}px`; frame.style.height = `${box.height || 540}px`;
    frame.style.transform = `scale(${box.scaleX || 1}, ${box.scaleY || 1})`;
    label.style.left = `${box.x || 0}px`; label.style.top = `${(box.y || 0) + (box.height || 540) + 12}px`; label.style.maxWidth = `${box.width || 960}px`;
    label.style.fontSize = `${Math.max(12, Math.min(64, Number(title.fontSize) || 24))}px`; label.style.color = title.textColour || "#f8fbff";
    const background = /^#[0-9a-f]{6}$/i.test(title.backgroundColour || "") ? title.backgroundColour : "#000000";
    const opacity = Math.max(0, Math.min(100, Number(title.backgroundOpacityPercent) || 0));
    label.style.background = `${background}${Math.round(opacity * 2.55).toString(16).padStart(2, "0")}`;
    layer.className = "microlayer-clip"; label.textContent = [clip.channel, clip.title].filter(Boolean).join(" - ") || "Loading shoutout clip...";
    const identity = `${clip.startedAtMs}:${clip.clipId}:${config.clip?.playerMode || "twitch"}:${Boolean(config.clip?.muted)}`;
    if (active !== identity) { active = identity; frame.src = embed(clip.clipId, config); }
  }
  transport.subscribe("shoutoutClip", event => { state = event.payload; render(); });
  transport.subscribe("connection", health => { if (!health.connected) { state = null; hide(); } });
  transport.connect(); const timer = setInterval(render, 100);
  window.addEventListener("beforeunload", () => { clearInterval(timer); transport.close(); });
})();
