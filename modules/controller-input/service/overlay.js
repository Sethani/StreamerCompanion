"use strict";
const box = document.getElementById("controller-box"), drawing = document.getElementById("controller-local"), testLabel = document.getElementById("test-label");
let busy = false;
function render(state) {
  box.hidden = !state?.enabled;
  if (box.hidden) return;
  const config = state.config, scale = Math.min(config.width / 700, config.height / 500);
  Object.assign(box.style, { left: config.x + "px", top: config.y + "px", width: config.width + "px", height: config.height + "px", transform: `scale(${config.scaleX}, ${config.scaleY})` });
  Object.assign(drawing.style, { left: Math.max(0, (config.width - 700 * scale) / 2) + "px", top: Math.max(0, (config.height - 500 * scale) / 2) + "px", transform: `scale(${scale})` });
  let pads = state.pads;
  if (!state.test && state.providerStatus !== "ready") {
    try { const browserPads = Array.from(navigator.getGamepads?.() || []).filter(Boolean).map(pad => ({ index: pad.index, pressed: pad.buttons.flatMap((button, index) => button.pressed || button.value > 0.15 ? [index] : []), axes: Array.from(pad.axes).map(value => Math.abs(value) >= 0.15 ? value : 0) })); if (browserPads.length) pads = browserPads; } catch (_) {}
  }
  const pad = config.controllerIndex < 0 ? pads[0] : pads.find(pad => pad.index === config.controllerIndex);
  drawing.classList.toggle("connected", !!pad);
  for (const button of drawing.querySelectorAll("[data-button]")) button.classList.toggle("pressed", !!pad?.pressed.includes(Number(button.dataset.button)));
  const sticks = drawing.querySelectorAll(".stick i"); for (let index = 0; index < sticks.length; index++) sticks[index].style.transform = `translate(${(pad?.axes[index * 2] || 0) * 12}px, ${(pad?.axes[index * 2 + 1] || 0) * 12}px)`;
  testLabel.hidden = !state.test; Object.assign(testLabel.style, { left: "0", top: "0", fontSize: "12px" });
}
async function refresh() { if (busy) return; busy = true; try { const response = await fetch("/api/controller/state", { cache: "no-store", signal: AbortSignal.timeout(1000) }); if (!response.ok) throw new Error(); render(await response.json()); } catch (_) { render(null); } finally { busy = false; } }
refresh(); setInterval(refresh, 50);
