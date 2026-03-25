const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mutxDesktop", {
  platform: process.platform,

  getAppVersion: () => ipcRenderer.invoke("get-app-version"),

  getPlatform: () => ipcRenderer.invoke("get-platform"),

  getUserDataPath: () => ipcRenderer.invoke("get-user-data-path"),

  openExternal: (url) => ipcRenderer.invoke("open-external", url),

  showNotification: (options) => ipcRenderer.invoke("show-notification", options),

  runCliCommand: (command, args) =>
    ipcRenderer.invoke("run-cli-command", { command, args }),

  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),

  maximizeWindow: () => ipcRenderer.invoke("maximize-window"),

  closeWindow: () => ipcRenderer.invoke("close-window"),

  isWindowMaximized: () => ipcRenderer.invoke("is-window-maximized"),

  navigate: (route) => ipcRenderer.send("navigate", route),

  openOnboarding: () => ipcRenderer.send("open-onboarding"),

  closeOnboarding: () => ipcRenderer.send("close-onboarding"),

  showMainWindow: () => ipcRenderer.send("show-main-window"),

  onNavigate: (callback) => {
    ipcRenderer.on("navigate", (event, route) => callback(route));
  },

  removeNavigateListener: () => {
    ipcRenderer.removeAllListeners("navigate");
  },
});

if (typeof window !== "undefined") {
  window.mutxDesktop = window.mutxDesktop || {};
}
