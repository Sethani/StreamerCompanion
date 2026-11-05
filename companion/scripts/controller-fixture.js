const path = require("node:path");
async function fixture(directory, runtimePath) {
  const { createService } = require(runtimePath || "../../modules/controller-input/service/runtime");
  const state = { pads: [{ index: 0, connected: true, pressed: [0], axes: [0.5, -0.5, 0, 0] }], now: null, paused: false };
  let timer, stopped = false;
  const service = createService({ port: 0, dataDirectory: path.join(directory, "data"), now: () => state.now ?? Date.now(), providerFactory({ onState }) { const emit = () => { if (!state.paused) onState({ supported: true, pads: state.pads }); }; emit(); timer = setInterval(emit, 100); return { stop: async () => { clearInterval(timer); stopped = true; } }; } });
  const port = await service.start();
  return { service, state, base: "http://127.0.0.1:" + port, stopped: () => stopped, async close() { await service.stop(); } };
}
module.exports = { fixture };
