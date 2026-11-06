const overlay = document.getElementById("overlay");
const canvas = document.getElementById("wheel");
const resultEl = document.getElementById("result");
const resultSound = document.getElementById("result-sound");
const ctx = canvas.getContext("2d");
const transport = window.StreamingTransport.create();
let colors = ["#e85d75", "#f39c35", "#f3d34a", "#58b368", "#3aa7a3", "#4682d9", "#8f63d9", "#d760b8"];
let appearance = {};
let entries = [];
let activeSpinId = null;
let animationFrame = null;
let previousRotation = 0;
let soundedSpinId = null;
let refreshTimer = null;

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function getWeightedSegments() {
  const totalWeight = entries.reduce((sum, entry) => sum + Math.max(0, Number(entry.weight) || 0), 0);
  let cursor = 0;
  return entries.map((entry, index) => {
    const weight = Math.max(0, Number(entry.weight) || 0);
    const size = totalWeight > 0 ? (weight / totalWeight) * 360 : 0;
    const segment = { entry, index, startDeg: cursor, endDeg: cursor + size, centerDeg: cursor + (size / 2), size };
    cursor += size;
    return segment;
  });
}

function drawWheel() {
  const width = canvas.width;
  const height = canvas.height;
  const center = width / 2;
  const radius = (width / 2) - 20;
  const segments = getWeightedSegments();
  const visibleSegmentCount = segments.filter((segment) => segment.size > 0).length;
  const labelFontSize = Number.isFinite(Number(appearance.labelSize)) ? Math.max(12, Math.min(48, Number(appearance.labelSize))) : Math.max(17, Math.min(30, 36 - visibleSegmentCount));
  const maxLabelWidth = radius * 0.52;

  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 4;
  ctx.strokeStyle = appearance.borderColour || "rgba(255, 255, 255, 0.72)";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${labelFontSize}px system-ui, sans-serif`;

  segments.forEach((segment) => {
    if (segment.size <= 0) return;
    const start = ((segment.startDeg - 90) * Math.PI) / 180;
    const end = ((segment.endDeg - 90) * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[segment.index % colors.length];
    ctx.fill();
    ctx.stroke();

    const labelRadius = radius * 0.88;
    const labelAngle = ((segment.centerDeg - 90) * Math.PI) / 180;
    let label = segment.entry.label;
    while (label.length > 3 && ctx.measureText(label).width > maxLabelWidth) label = label.slice(0, -1);
    if (label !== segment.entry.label) label = `${label.slice(0, -3)}...`;
    ctx.save();
    ctx.translate(center + Math.cos(labelAngle) * labelRadius, center + Math.sin(labelAngle) * labelRadius);
    ctx.rotate(labelAngle + Math.PI);
    ctx.fillStyle = appearance.labelColour || "#fff";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.52)";
    ctx.lineWidth = 6;
    ctx.strokeText(label, 0, 0);
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.lineWidth = 10;
  ctx.strokeStyle = appearance.borderColour || "rgba(255, 255, 255, 0.9)";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(center, center, 74, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(20, 20, 20, 0.88)";
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = appearance.borderColour || "rgba(255, 255, 255, 0.82)";
  ctx.stroke();
}

function applyAppearance(state) {
  appearance = state.appearance || state.config?.appearance || {};
  const position = state.position || state.config?.position || {};
  const palette = Array.isArray(appearance.palette) ? appearance.palette.filter((value) => /^#[0-9a-f]{6}$/i.test(value)) : [];
  if (palette.length) colors = palette;
  const anchor = String(position.anchor || "center");
  overlay.style.justifyContent = anchor.endsWith("left") || anchor === "left" ? "start" : anchor.endsWith("right") || anchor === "right" ? "end" : "center";
  overlay.style.alignContent = anchor.startsWith("top") ? "start" : anchor.startsWith("bottom") ? "end" : "center";
  overlay.style.setProperty("--wheel-size", String(Math.max(.2, Math.min(1.5, Number(position.sizePercent || 100) / 100))));
  overlay.style.setProperty("--wheel-offset-x", `${Math.max(-50, Math.min(50, Number(position.offsetX) || 0))}vw`);
  overlay.style.setProperty("--wheel-offset-y", `${Math.max(-50, Math.min(50, Number(position.offsetY) || 0))}vh`);
  overlay.style.setProperty("--wheel-opacity", String(Math.max(.1, Math.min(1, Number(appearance.opacityPercent || 100) / 100))));
  overlay.style.setProperty("--wheel-pointer", appearance.pointerColour || "#ffffff");
  overlay.style.setProperty("--wheel-border", appearance.borderColour || "#ffffff");
  overlay.style.setProperty("--wheel-result-colour", appearance.resultColour || "#ffffff");
  const background = /^#[0-9a-f]{6}$/i.test(appearance.resultBackground || "") ? appearance.resultBackground : "#141414";
  const alpha = Math.max(0, Math.min(1, Number(appearance.resultOpacityPercent ?? 82) / 100));
  overlay.style.setProperty("--wheel-result-background", `${background}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`);
}

function getTargetRotation(spin) {
  const segment = getWeightedSegments().find((item) => item.index === spin.entryIndex);
  const centerDeg = segment ? segment.centerDeg : 0;
  const baseRotation = Math.ceil(previousRotation / 360) * 360;
  return baseRotation + (spin.rotations * 360) + (360 - centerDeg);
}

function setOverlayStatus(status) { overlay.className = `overlay ${status}`; }
function playResultSound(spinId) {
  if (!resultSound || soundedSpinId === spinId) return;
  soundedSpinId = spinId;
  resultSound.currentTime = 0;
  resultSound.play().catch(() => {});
}

function animateSpin(spin, serverTimeMs) {
  window.cancelAnimationFrame(animationFrame);
  activeSpinId = spin.id;
  const localStart = performance.now() - Math.max(0, serverTimeMs - spin.startTimeMs);
  const targetRotation = getTargetRotation(spin);
  const startRotation = previousRotation;
  resultEl.textContent = "";
  setOverlayStatus("spinning");
  function frame(now) {
    const progress = Math.min(1, (now - localStart) / spin.durationMs);
    const eased = easeOutCubic(progress);
    const rotation = startRotation + ((targetRotation - startRotation) * eased);
    canvas.style.transform = `rotate(${rotation}deg)`;
    if (progress < 1) { animationFrame = window.requestAnimationFrame(frame); return; }
    previousRotation = targetRotation;
    canvas.style.transform = `rotate(${targetRotation}deg)`;
    resultEl.textContent = spin.result;
    setOverlayStatus("result");
    playResultSound(spin.id);
  }
  animationFrame = window.requestAnimationFrame(frame);
}

async function refreshState() {
  let nextRefreshMs = 1000;
  try {
    if (!transport.getHealth().connected) throw new Error("Streamer.bot disconnected");
    await transport.refresh();
    const envelope = transport.getState("wheel");
    if (!envelope?.payload) throw new Error("Wheel state unavailable");
    const state = { ...envelope.payload, serverTimeMs: Date.now() };
    if (state.currentSpin) state.status = Date.now() >= Number(state.currentSpin.hideTimeMs) ? "idle" : Date.now() >= Number(state.currentSpin.endTimeMs) ? "result" : "spinning";
    if (state.status === "idle") state.currentSpin = null;
    applyAppearance(state);
    entries = state.currentSpin && state.currentSpin.entries ? state.currentSpin.entries : state.entries;
    drawWheel();
    if (state.currentSpin && state.currentSpin.id !== activeSpinId) { animateSpin(state.currentSpin, state.serverTimeMs); nextRefreshMs = 250; return; }
    if (state.status === "idle" && !state.currentSpin) { activeSpinId = null; resultEl.textContent = ""; setOverlayStatus("idle"); }
    else if (state.status === "result" && state.currentSpin) { resultEl.textContent = state.currentSpin.result; setOverlayStatus("result"); playResultSound(state.currentSpin.id); nextRefreshMs = 500; }
    else if (state.status === "spinning") nextRefreshMs = 250;
  } catch {
    setOverlayStatus("idle");
  } finally {
    refreshTimer = window.setTimeout(refreshState, nextRefreshMs);
  }
}

transport.connect();
refreshState();
