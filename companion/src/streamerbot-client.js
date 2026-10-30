const WebSocket = require("ws");
const crypto = require("node:crypto");

function getActions(url, timeoutMs = 2500) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const id = crypto.randomUUID();
    const timer = setTimeout(() => {
      socket.terminate();
      reject(new Error("Streamer.bot did not respond in time."));
    }, timeoutMs);
    const finish = (error, value) => {
      clearTimeout(timer);
      try { socket.close(); } catch {}
      if (error) reject(error); else resolve(value);
    };
    socket.once("open", () => socket.send(JSON.stringify({ request: "GetActions", id })));
    socket.once("error", () => finish(new Error("Streamer.bot WebSocket is unavailable.")));
    socket.on("message", (raw) => {
      let response;
      try { response = JSON.parse(raw.toString()); } catch { return; }
      if (response.id !== id) return;
      if (response.status === "error") return finish(new Error(response.error || "Streamer.bot rejected GetActions."));
      const list = response.actions || (response.data && response.data.actions) || [];
      finish(null, list.map((item) => item.name).filter(Boolean));
    });
  });
}

module.exports = { getActions };
