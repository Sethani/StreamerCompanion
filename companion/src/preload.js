const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("companion", {
  list: () => ipcRenderer.invoke("companion:list"),
  refresh: () => ipcRenderer.invoke("companion:refresh"),
  catalog: () => ipcRenderer.invoke("companion:catalog"),
  checkCatalog: () => ipcRenderer.invoke("companion:catalog-check"),
  installCatalog: (id) => ipcRenderer.invoke("companion:catalog-install", id),
  services: () => ipcRenderer.invoke("companion:services"),
  serviceAction: (id, action) => ipcRenderer.invoke("companion:service-action", { id, action }),
  startAllServices: () => ipcRenderer.invoke("companion:services-start-all"),
  stopAllServices: () => ipcRenderer.invoke("companion:services-stop-all"),
  setServiceAutoStart: (id, enabled) => ipcRenderer.invoke("companion:service-autostart", { id, enabled }),
  setAllServicesAutoStart: (enabled) => ipcRenderer.invoke("companion:services-autostart-all", enabled),
  openServiceSettings: (id) => ipcRenderer.invoke("companion:service-open-settings", id),
  apiState: () => ipcRenderer.invoke("companion:api-state"),
  copyApiToken: () => ipcRenderer.invoke("companion:api-copy-token"),
  rotateApiToken: () => ipcRenderer.invoke("companion:api-rotate-token"),
  install: () => ipcRenderer.invoke("companion:install"),
  openImport: (id) => ipcRenderer.invoke("companion:open-import", id),
  openDocs: (id) => ipcRenderer.invoke("companion:open-docs", id)
});
