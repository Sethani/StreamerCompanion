const path = require("node:path");
const { CompanionHost } = require("./companion-host");

// Shared Electron shell; personal adapters are supplied only by the personal entrypoint.
function createDesktop(options) {
  const { app, BrowserWindow, dialog, ipcMain, shell, clipboard } = options.electron;
  let window;
  let host;
  let registry;
  let services;
  let controlApi;
  let quitAfterServices = false;
  let shuttingDown = false;

  function createWindow() {
    window = new BrowserWindow({
      width: 920,
      height: 680,
      minWidth: 760,
      minHeight: 520,
      backgroundColor: "#111517",
      title: options.title || "Streaming Companion",
      show: options.show !== false,
      webPreferences: {
        preload: path.join(__dirname, options.preload || "preload.js"),
        contextIsolation: true,
        nodeIntegration: false
      }
    });
    window.removeMenu();
    return window.loadFile(path.join(__dirname, "renderer", "index.html"));
  }

  let ready;
  if (options.squirrelStartup) {
    app.quit();
    ready = Promise.resolve();
  } else ready = app.whenReady().then(async () => {
    host = new CompanionHost({ ...options.hostOptions, app });
    registry = host.registry;
    services = host.services;
    controlApi = host.controlApi;
    if (options.registerServices) options.registerServices(host);
    host.start();
    await createWindow();
    await host.availableCapabilities();
    await services.startAll({ automaticOnly: true });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
  app.on("before-quit", (event) => {
    if (!host || quitAfterServices) return;
    event.preventDefault();
    if (shuttingDown) return;
    shuttingDown = true;
    Promise.allSettled([services.stopAll(), controlApi?.stop()]).finally(() => {
      quitAfterServices = true;
      app.quit();
    });
  });

  ipcMain.handle("companion:list", () => host.listModules());
  ipcMain.handle("companion:refresh", () => host.listModules());
  ipcMain.handle("companion:module-link", async (_event, { id, target, copy }) => {
    const module = (await host.listModules()).modules.find((item) => item.id === id);
    const links = { controls: module?.ui?.nodeUrl, overlay: module?.ui?.extensionOverlayUrl };
    for (const [index, link] of (module?.ui?.links || []).entries()) links["link-" + index] = link.url;
    const url = links[target];
    if (!url || !/^http:\/\/(127\.0\.0\.1|localhost):\d+\//.test(url)) throw new Error("This module link is unavailable.");
    if (copy) clipboard.writeText(url); else await shell.openExternal(url);
    return true;
  });
  ipcMain.handle("companion:import-media", async (_event, id) => {
    if (registry.readManifest(id)?.media?.kind !== "video") throw new Error("This module does not accept video media.");
    const selection = await dialog.showOpenDialog(window, { title: "Add video media", properties: ["openFile", "multiSelections"], filters: [{ name: "Videos", extensions: ["mp4", "webm", "m4v", "mov"] }] });
    if (selection.canceled) return { canceled: true };
    return { media: host.webAssets.importMedia(id, selection.filePaths) };
  });
  ipcMain.handle("companion:catalog", () => host.catalog.inventory());
  ipcMain.handle("companion:catalog-check", () => host.catalog.check());
  ipcMain.handle("companion:catalog-install", (_event, id) => host.installCatalogModule(id));
  ipcMain.handle("companion:services", () => host.listServices());
  ipcMain.handle("companion:service-action", async (_event, request) => { await host.availableCapabilities(); return services.execute(request.id, request.action); });
  ipcMain.handle("companion:services-start-all", async () => { await host.availableCapabilities(); return services.startAll(); });
  ipcMain.handle("companion:services-stop-all", () => services.stopAll());
  ipcMain.handle("companion:service-autostart", (_event, request) => services.setAutoStart(request.id, request.enabled));
  ipcMain.handle("companion:services-autostart-all", (_event, enabled) => services.setAutoStartAll(enabled));
  ipcMain.handle("companion:service-open-settings", async (_event, serviceId) => {
    const service = services.get(serviceId);
    if (!service || !service.manifest.settingsPath) throw new Error("This service does not provide a settings page.");
    const state = await service.state();
    if (!state.endpoint?.ready) throw new Error("Start " + service.manifest.name + " first.");
    await shell.openExternal(state.endpoint.url + service.manifest.settingsPath);
    return true;
  });
  ipcMain.handle("companion:api-copy-token", () => { clipboard.writeText(controlApi.token); return true; });
  ipcMain.handle("companion:api-rotate-token", () => { controlApi.rotateToken(); return true; });
  ipcMain.handle("companion:api-state", () => ({ port: controlApi.port, authPath: controlApi.authPath }));
  ipcMain.handle("companion:install", async () => {
    const selection = await dialog.showOpenDialog(window, {
      title: "Install Streaming Companion module",
      properties: ["openFile"],
      filters: [{ name: "Streaming modules", extensions: ["streammodule"] }]
    });
    if (selection.canceled || !selection.filePaths[0]) return null;
    await host.installModulePackage(selection.filePaths[0]);
    return host.listModules();
  });
  ipcMain.handle("companion:open-import", async (_event, moduleId) => {
    const target = registry.getImportFile(moduleId);
    if (!target) throw new Error("This module does not include a Streamer.bot import file yet.");
    await shell.openPath(target);
    return true;
  });
  ipcMain.handle("companion:open-docs", async (_event, moduleId) => {
    const target = registry.getDocumentationFile(moduleId);
    if (!target) throw new Error("This module does not include local documentation.");
    await shell.openPath(target);
    return true;
  });

  return { get host() { return host; }, get window() { return window; }, ready };
}

module.exports = { createDesktop };
