"use strict";
const select = document.getElementById("module"), frame = document.getElementById("controls"), status = document.getElementById("status");
let modules = [];
function show() {
  const selected = modules.find((item) => item.id === select.value);
  status.textContent = selected ? selected.state === "ready" ? "Ready" : selected.problem : "Install a module with controls in Companion.";
  const url = selected && !["broken", "incompatible", "missing-dependency"].includes(selected.state) ? selected.nodeUrl : "about:blank";
  if (frame.getAttribute("src") !== url) frame.src = url;
}
async function refresh() {
  try {
    const registry = await StreamingModuleRegistry.load(), old = select.value;
    modules = registry.modules.filter((item) => item.packageId !== "universal-dock" && item.nodeUrl).sort((a, b) => (a.order || 0) - (b.order || 0));
    select.replaceChildren(...modules.map((item) => { const option = document.createElement("option"); option.value = item.id; option.textContent = item.name; return option; }));
    if (modules.some((item) => item.id === old)) select.value = old;
    show();
  } catch (error) { status.textContent = error.message; frame.src = "about:blank"; }
}
select.onchange = show; refresh(); setInterval(refresh, 3000);
