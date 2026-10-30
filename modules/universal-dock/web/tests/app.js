"use strict";
const transport = StreamingTransport.create(), status = document.getElementById("status");
const signature = new Map();
function fieldValue(rule, controls) {
  if (!rule || typeof rule !== "object") return rule;
  if (Object.prototype.hasOwnProperty.call(rule, "literal")) return rule.literal;
  const control = controls.get(rule.field);
  let value = rule.selectedData ? control?.selectedOptions?.[0]?.dataset[rule.selectedData] || "" : control?.value || "";
  if (rule.trim) value = String(value).trim();
  if (rule.number) value = Number(value) || 0;
  if (rule.min !== undefined) value = Math.max(Number(rule.min), Number(value));
  if (rule.max !== undefined) value = Math.min(Number(rule.max), Number(value));
  if (rule.multiply !== undefined) value = Number(value) * Number(rule.multiply);
  return value;
}
async function refresh() {
  const registry = await StreamingModuleRegistry.load();
  const root = document.getElementById("tests");
  for (const module of registry.modules) {
    const key = JSON.stringify([module.version, module.state, transport.getState(module.transport?.feature)?.revision]);
    if (signature.get(module.id) === key) continue;
    signature.set(module.id, key); document.getElementById("tests-" + module.id)?.remove();
    const group = document.createElement("div"); group.id = "tests-" + module.id;
    for (const test of module.tests || []) {
      const section = document.createElement("section"), heading = document.createElement("h2"), controls = new Map();
      heading.textContent = module.name + " · " + test.name; section.append(heading);
      for (const field of test.fields || []) {
        const label = document.createElement("label"), control = document.createElement(field.type === "select" ? "select" : "input");
        label.textContent = field.label; control.dataset.field = field.id;
        if (field.type === "select") {
          const library = transport.getState(module.transport?.feature)?.payload?.config?.library || {};
          for (const [id, value] of Object.entries(library)) if (value.enabled !== false) { const option = document.createElement("option"); option.value = id; option.textContent = value.label || id; option.dataset.src = value.src || ""; control.append(option); }
        } else { control.type = field.type === "number" ? "number" : "text"; if (field.value !== undefined) control.value = field.value; }
        for (const key of ["placeholder", "min", "max", "step", "maxlength"]) if (field[key] !== undefined) control.setAttribute(key, field[key]);
        controls.set(field.id, control); label.append(control); section.append(label);
      }
      const actions = document.createElement("div"); actions.className = "actions";
      for (const definition of test.buttons || []) {
        const button = document.createElement("button"); button.textContent = definition.label; button.disabled = module.state !== "ready";
        button.onclick = async () => {
          if (test.level !== "safe" && !confirm("Run " + test.name + "? This changes module state and may appear on your stream.")) return;
          button.disabled = true;
          try {
            const args = {};
            for (const [name, value] of Object.entries(definition.args || {})) {
              args[name] = fieldValue(value, controls);
            }
            if (definition.localRequest) {
              const request = definition.localRequest, target = new URL(request.url);
              if (target.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(target.hostname) || target.username || target.password) throw new Error("Tests may call only local services.");
              if (target.origin !== location.origin) {
                try { const health = await fetch(new URL("/health", target), { cache: "no-store", signal: AbortSignal.timeout(3000) }); if (!health.ok) throw new Error(); }
                catch (_) { throw new Error("This service is unavailable or does not allow shared Tests. Use its own controls; the test was not sent."); }
              }
              for (const [key, rule] of Object.entries(request.query || {})) target.searchParams.set(key, fieldValue(rule, controls));
              const method = request.method || "GET";
              if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) throw new Error("Unsupported local test method.");
              const response = await fetch(target, { method, cache: "no-store", signal: AbortSignal.timeout(5000), ...(request.body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(Object.entries(request.body).map(([key, rule]) => [key, fieldValue(rule, controls)]))) } : {}) });
              const result = await response.json().catch(() => ({}));
              if (!response.ok || result.accepted === false) throw new Error(result.error || result.reason || "Local test was rejected.");
            }
            else if (definition.readFeature) await transport.refresh();
            else await transport.execute(definition.feature || module.transport?.feature, definition.command, args);
            status.textContent = test.name + " request completed.";
          } catch (error) { status.textContent = error.message; } finally { button.disabled = module.state !== "ready"; }
        };
        actions.append(button);
      }
      section.append(actions); group.append(section);
    }
    root.append(group);
  }
  for (const id of signature.keys()) if (!registry.modules.some((item) => item.id === id)) { document.getElementById("tests-" + id)?.remove(); signature.delete(id); }
}
transport.subscribe("connection", (health) => { status.textContent = health.connected ? "Streamer.bot connected" : "Streamer.bot disconnected"; });
transport.connect(); refresh().catch((error) => { status.textContent = error.message; });
setInterval(() => refresh().catch((error) => { status.textContent = error.message; }), 3000);
