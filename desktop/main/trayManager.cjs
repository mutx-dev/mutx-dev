const { Tray, Menu, nativeImage, _app } = require("electron");
const fs = require("fs");
const path = require("path");

let tray = null;
let _statusCallback = null;
let onToggleWindow = null;
let onOpenDashboard = null;
let onOpenSetup = null;
let onOpenTUI = null;
let onRunDoctor = null;
let onQuit = null;

function getIconPath(iconPath) {
  const candidates = [
    path.join(__dirname, "..", "Resources", iconPath || "icon.png"),
    path.join(__dirname, "..", "..", "desktop", "Resources", iconPath || "icon.png"),
    path.join(process.resourcesPath || "", "app.asar", "desktop", "Resources", iconPath || "icon.png"),
    path.join(process.resourcesPath || "", "app.asar.unpacked", "desktop", "Resources", iconPath || "icon.png"),
  ];

  return candidates.find((candidate) => candidate && fs.existsSync(candidate)) || null;
}

function createTray(iconPath) {
  let trayIcon;

  try {
    const fullPath = getIconPath(iconPath);
    trayIcon = fullPath ? nativeImage.createFromPath(fullPath) : nativeImage.createEmpty();
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty();
    }
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
  tray.setToolTip("MUTX");

  updateTrayMenu();

  tray.on("click", () => {
    if (tray && onToggleWindow) {
      onToggleWindow();
    }
  });

  return tray;
}

function updateTrayMenu(status = {}) {
  if (!tray) return;

  const {
    mode = "unknown",
    apiHealth = "unknown",
    gatewayHealth = "unknown",
    farameshHealth = "unknown",
    _authenticated = false,
    assistantName = null,
  } = status;

  const statusItems = [];

  if (assistantName) {
    statusItems.push({
      label: `Assistant: ${assistantName}`,
      enabled: false,
    });
  }

  statusItems.push(
    { label: `Mode: ${mode}`, enabled: false },
    { label: `API: ${apiHealth}`, enabled: false },
    { label: `Gateway: ${gatewayHealth}`, enabled: false },
    { label: `Governance: ${farameshHealth}`, enabled: false },
    { type: "separator" }
  );

  const template = [
    ...statusItems,
    {
      label: "Open Dashboard",
      click: () => {
        if (onOpenDashboard) onOpenDashboard();
      },
    },
    {
      label: "Open Mission Control",
      click: () => {
        if (onOpenSetup) onOpenSetup();
      },
    },
    {
      label: "Open TUI",
      click: () => {
        if (onOpenTUI) onOpenTUI();
      },
    },
    { type: "separator" },
    {
      label: "Run Doctor",
      click: () => {
        if (onRunDoctor) onRunDoctor();
      },
    },
    { type: "separator" },
    {
      label: "Quit MUTX",
      click: () => {
        if (onQuit) onQuit();
      },
    },
  ];

  const contextMenu = Menu.buildFromTemplate(template);
  tray.setContextMenu(contextMenu);
}

function setTrayStatus(status) {
  updateTrayMenu(status);
}

function setTrayCallbacks(callbacks) {
  onToggleWindow = callbacks.onToggleWindow || null;
  onOpenDashboard = callbacks.onOpenDashboard || null;
  onOpenSetup = callbacks.onOpenSetup || null;
  onOpenTUI = callbacks.onOpenTUI || null;
  onRunDoctor = callbacks.onRunDoctor || null;
  onQuit = callbacks.onQuit || null;
}

function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

function getTray() {
  return tray;
}

module.exports = {
  createTray,
  updateTrayMenu,
  setTrayStatus,
  setTrayCallbacks,
  destroyTray,
  getTray,
};
