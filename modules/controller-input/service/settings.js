"use strict";
const $ = id => document.getElementById(id), csrf = document.querySelector('meta[name="companion-csrf"]').content;
const fields = ["x", "y", "width", "height", "scaleX", "scaleY", "controllerIndex"];
const note = message => { $("feedback").textContent = message; };
async function api(route, body) { const response = await fetch(route, { method: body ? "POST" : "GET", headers: { "X-Companion-CSRF": csrf, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) }); const value = await response.json(); if (!response.ok) throw new Error(value.error); return value; }
function fill(config) { $("enabled").checked = config.enabled; for (const name of fields) if (config[name] !== undefined) $(name).value = config[name]; }
$("settings").onsubmit = async event => { event.preventDefault(); try { const value = await api("/api/controller/settings", { enabled: $("enabled").checked, ...Object.fromEntries(fields.map(name => [name, Number($(name).value)])) }); fill(value.config); note("Controller display saved."); } catch (error) { note(error.message); } };
$("test").onclick = () => api("/api/controller/test", {}).then(() => note("Test shown on the live overlay for ten seconds.")).catch(error => note(error.message));
$("clear").onclick = () => api("/api/controller/test", { clear: true }).then(() => note("Test cleared.")).catch(error => note(error.message));
async function status() { try { const value = await (await fetch("/api/controller/state", { cache: "no-store" })).json(); $("status").textContent = "Native input: " + value.providerStatus + " · " + value.pads.length + " connected" + (value.test ? " · test active" : ""); $("pads").textContent = value.pads.map(pad => `Index ${pad.index} · Buttons: ${pad.pressed.join(", ") || "none"} · Axes: ${pad.axes.join(", ")}`).join("\n"); } catch (_) { $("status").textContent = "Service unavailable"; } }
$("overlay-url").value = location.origin + "/overlay"; $("preview").href = $("overlay-url").value;
api("/api/controller/settings").then(value => fill(value.config)).catch(error => note(error.message)); status(); setInterval(status, 500);
