const electron = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { createDesktop } = require("./desktop");

// Keep preview data isolated. Building or importing this file must never adopt production data.
const previewData = path.join(electron.app.getPath("appData"), "Streaming Companion Preview");
fs.mkdirSync(previewData, { recursive: true });
electron.app.setPath("userData", previewData);

createDesktop({
  electron,
  squirrelStartup: require("electron-squirrel-startup"),
  title: "Streaming Companion Preview",
  preload: "preload.js"
});
