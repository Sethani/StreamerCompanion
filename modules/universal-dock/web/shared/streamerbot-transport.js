(function (global) {
  "use strict";
  class Transport {
    constructor(options = {}) {
      this.options = options; this.states = new Map(); this.listeners = new Map(); this.pending = new Map(); this.features = new Map(); this.closed = false;
      this.status = "disconnected"; this.lastError = "";
    }
    async connect() {
      if (this.connecting || this.closed || this.socket && this.socket.readyState < 2) return;
      this.connecting = true;
      try {
        await this.registry();
        const url = this.options.url || this.definition.transport?.streamerBotUrl;
        if (!/^ws:\/\/(127\.0\.0\.1|localhost):\d+\/$/.test(url || "")) throw new Error("A local Streamer.bot WebSocket is required.");
        this.socket = new WebSocket(url); this.status = "connecting";
        this.socket.addEventListener("open", async () => {
          this.status = "connected"; this.lastError = ""; this.emit("connection", this.getHealth());
          await this.request("Subscribe", { events: { General: ["Custom"], Obs: ["SceneChanged", "Connected", "Disconnected"] } }).catch(() => {});
          this.refresh().catch((error) => { this.lastError = error.message; });
        });
        this.socket.addEventListener("message", (event) => this.message(event.data));
        this.socket.addEventListener("error", () => { this.lastError = "Streamer.bot WebSocket failed."; });
        this.socket.addEventListener("close", () => {
          this.status = "disconnected"; this.states.clear(); this.emit("connection", this.getHealth());
          for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(new Error("Streamer.bot disconnected.")); }
          this.pending.clear(); this.retry();
        });
      } catch (error) { this.lastError = error.message; this.status = "disconnected"; this.emit("connection", this.getHealth()); this.retry(); }
      finally { this.connecting = false; }
    }
    retry() { if (!this.closed) { clearTimeout(this.timer); this.timer = setTimeout(() => this.connect(), 2000); } }
    close() { this.closed = true; clearTimeout(this.timer); this.socket?.close(); }
    async registry() {
      const response = await fetch("/api/public/modules", { cache: "no-store" });
      if (!response.ok) throw new Error("Companion is unavailable.");
      this.definition = await response.json(); this.features.clear();
      for (const module of this.definition.modules) if (module.transport?.feature) this.features.set(module.transport.feature, module);
    }
    getBackend(feature) { return this.features.has(feature) ? "streamerbot" : "unavailable"; }
    getState(feature) { return this.states.get(feature) || null; }
    getHealth() { return { connected: this.status === "connected", status: this.status, error: this.lastError }; }
    subscribe(feature, handler) {
      if (!this.listeners.has(feature)) this.listeners.set(feature, new Set());
      this.listeners.get(feature).add(handler);
      if (this.states.has(feature)) handler(this.states.get(feature));
      return () => this.listeners.get(feature)?.delete(handler);
    }
    emit(feature, value) { for (const handler of this.listeners.get(feature) || []) handler(value); }
    apply(value) {
      if (typeof value === "string") { try { value = JSON.parse(value); } catch (_) { return; } }
      if (!value || value.schemaVersion !== 1 || !this.features.has(value.feature) || !value.payload) return;
      if (Number(this.states.get(value.feature)?.revision || 0) > Number(value.revision || 0)) return;
      this.states.set(value.feature, value); this.emit(value.feature, value);
    }
    message(raw) {
      let message; try { message = JSON.parse(raw); } catch (_) { return; }
      const pending = this.pending.get(message.id);
      if (pending) { this.pending.delete(message.id); clearTimeout(pending.timer); if (message.status === "error") pending.reject(new Error(message.error || "Streamer.bot rejected the request.")); else pending.resolve(message); return; }
      this.apply(message); this.apply(message.data); this.apply(message.payload); this.apply(message.data?.payload);
      if (message.event?.source === "Obs") this.emit("obs", message.data || {});
    }
    request(request, body = {}) {
      if (this.socket?.readyState !== WebSocket.OPEN) return Promise.reject(new Error("Streamer.bot is disconnected."));
      const id = crypto.randomUUID();
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(request + " timed out.")); }, 4000);
        this.pending.set(id, { resolve, reject, timer }); this.socket.send(JSON.stringify({ request, id, ...body }));
      });
    }
    async refresh() {
      if (this.refreshing) return this.refreshing;
      this.refreshing = (async () => {
        await this.registry();
        const response = await this.request("GetGlobals", { persisted: true });
        const values = response.variables || response.globals || response.data?.variables || response.data?.globals || [];
        for (const module of this.features.values()) {
          const key = module.transport.stateKey;
          const value = Array.isArray(values) ? values.find((item) => (item.variableName || item.name || item.key) === key)?.value : values[key];
          this.apply(value && typeof value === "object" && Object.prototype.hasOwnProperty.call(value, "value") ? value.value : value);
        }
      })().finally(() => { this.refreshing = null; });
      return this.refreshing;
    }
    async execute(feature, command, args = {}) {
      const module = this.features.get(feature);
      if (!module) throw new Error("Feature is not installed.");
      if (module.state !== "ready") throw new Error(module.problem || "Module is not ready.");
      const name = module.transport.actionPrefix + " - " + command;
      if (!module.actions?.includes(name)) throw new Error("Action is not registered by this module.");
      return this.request("DoAction", { action: { name }, args });
    }
  }
  global.StreamingTransport = { create: (options) => new Transport(options) };
})(window);
