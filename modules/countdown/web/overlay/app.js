"use strict";
const transport = StreamingTransport.create(), layer = document.getElementById("countdown-layer"), text = document.getElementById("countdown-text");
let state = null, connected = false;
function render() {
  let status = state?.status || "idle", remaining = Number(state?.remainingMs) || 0;
  if (status === "running") { remaining = Math.max(0, Number(state.endTimeMs) - Date.now()); if (remaining <= 0) status = "finished"; }
  layer.hidden = !connected || status === "idle";
  layer.className = "countdown-layer " + status;
  const seconds = Math.max(0, Math.ceil(remaining / 1000));
  text.textContent = status === "finished" ? String(state.finishedText || "Starting\nsoon").replace(/\\n/g, "\n") : [Math.floor(seconds / 60), seconds % 60].map(value => String(value).padStart(2, "0")).join(":");
}
transport.subscribe("countdown", event => { state = event.payload; render(); });
transport.subscribe("connection", health => { connected = health.connected; if (!connected) state = null; render(); });
transport.connect(); render(); setInterval(render, 100);
