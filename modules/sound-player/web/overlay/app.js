(() => {
  'use strict';
  const player = document.getElementById('player'), transport = StreamingTransport.create(), rendererId = crypto.randomUUID();
  const observed = new Set();
  let baseline = false, pending = null, active = null, latest = null;
  const identity = current => current?.requestId && current?.startedAtMs ? `${current.requestId}:${current.startedAtMs}` : '';
  function silence() { active = null; player.pause(); player.removeAttribute('src'); player.load(); }
  async function complete(error = '') {
    const request = active; silence();
    if (request) await transport.execute('walkonSound', 'Renderer', { rendererOperation: 'complete', rendererId, startedAtMs: request.startedAtMs, playbackRequestId: request.requestId, error }).catch(() => {});
  }
  transport.subscribe('walkonSound', event => {
    const current = event.payload?.current || {}, key = identity(current); latest = current;
    if (!baseline) { baseline = true; if (key) observed.add(key); return; }
    if (!current.visible || !key) { pending = null; silence(); return; }
    if (active && identity(active) === key) { player.volume = Math.max(0, Math.min(1, Number(current.volume ?? 1))); return; }
    if (pending === key && current.rendererId === rendererId) {
      pending = null; silence(); active = { ...current };
      player.src = current.src; player.volume = Math.max(0, Math.min(1, Number(current.volume ?? 1)));
      player.play().catch(error => { if (identity(active) === key) complete(error.message); });
      return;
    }
    if (observed.has(key)) return;
    observed.add(key); pending = null; silence();
    if (current.rendererId) return;
    pending = key;
    transport.execute('walkonSound', 'Renderer', { rendererOperation: 'claim', rendererId, startedAtMs: current.startedAtMs, playbackRequestId: current.requestId })
      .then(() => transport.refresh('walkonSound')).catch(() => { if (pending === key) pending = null; });
  });
  transport.subscribe('connection', health => { if (!health.connected) { if (latest && identity(latest)) observed.add(identity(latest)); pending = null; silence(); baseline = false; } });
  player.addEventListener('ended', () => complete());
  player.addEventListener('error', () => { if (active) complete(player.error?.message || 'Audio playback failed.'); });
  transport.connect();
  window.addEventListener('beforeunload', () => { if (active) complete('Audio renderer closed.'); transport.close(); });
})();
