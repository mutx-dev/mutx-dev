const { contextBridge, ipcRenderer } = require("electron");

const bridge = {
  async call(method, params = {}) {
    return ipcRenderer.invoke("bridge-call", { method, params });
  },

  async systemInfo() {
    return ipcRenderer.invoke("bridge.systemInfo");
  },

  auth: {
    async status() {
      return ipcRenderer.invoke("bridge.authStatus");
    },
    async login(email, password) {
      return ipcRenderer.invoke("bridge.authLogin", { email, password });
    },
    async register(name, email, password) {
      return ipcRenderer.invoke("bridge.authRegister", { name, email, password });
    },
    async localBootstrap(name) {
      return ipcRenderer.invoke("bridge.authLocalBootstrap", { name });
    },
    async storeTokens(accessToken, refreshToken, apiUrl) {
      return ipcRenderer.invoke("bridge.authStoreTokens", {
        accessToken,
        refreshToken,
        apiUrl,
      });
    },
    async logout() {
      return ipcRenderer.invoke("bridge.authLogout");
    },
  },

  doctor: {
    async run() {
      return ipcRenderer.invoke("bridge.doctorRun");
    },
  },

  setup: {
    async inspectEnvironment() {
      return ipcRenderer.invoke("bridge.setupInspectEnvironment");
    },
    async start(mode, assistantName, actionType, openclawInstallMethod) {
      return ipcRenderer.invoke("bridge.setupStart", {
        mode,
        assistantName,
        actionType,
        openclawInstallMethod,
      });
    },
    async getState() {
      return ipcRenderer.invoke("bridge.setupGetState");
    },
  },

  runtime: {
    async inspect() {
      return ipcRenderer.invoke("bridge.runtimeInspect");
    },
    async resync() {
      return ipcRenderer.invoke("bridge.runtimeResync");
    },
    async openSurface(surface) {
      return ipcRenderer.invoke("bridge.runtimeOpenSurface", { surface });
    },
  },

  controlPlane: {
    async status() {
      return ipcRenderer.invoke("bridge.controlPlaneStatus");
    },
    async start() {
      return ipcRenderer.invoke("bridge.controlPlaneStart");
    },
    async stop() {
      return ipcRenderer.invoke("bridge.controlPlaneStop");
    },
  },

  assistant: {
    async overview() {
      return ipcRenderer.invoke("bridge.assistantOverview");
    },
    async sessions() {
      return ipcRenderer.invoke("bridge.assistantSessions");
    },
  },

  agents: {
    async list() {
      return ipcRenderer.invoke("bridge.agentsList");
    },
    async create(name, description, agentType) {
      return ipcRenderer.invoke("bridge.agentsCreate", { name, description, agentType });
    },
    async stop(agentId) {
      return ipcRenderer.invoke("bridge.agentsStop", { agentId });
    },
  },

  governance: {
    async status() {
      return ipcRenderer.invoke("bridge.governanceStatus");
    },
    async restart() {
      return ipcRenderer.invoke("bridge.governanceRestart");
    },
  },

  system: {
    async revealInFinder(filePath) {
      return ipcRenderer.invoke("bridge.finderReveal", { filePath });
    },
    async openTerminal(cwd) {
      return ipcRenderer.invoke("bridge.shellOpenTerminal", { cwd });
    },
    async chooseWorkspace() {
      return ipcRenderer.invoke("bridge.dialogChooseWorkspace");
    },
  },
};

contextBridge.exposeInMainWorld("mutxDesktop", {
  platform: process.platform,
  isDesktop: true,

  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getPlatform: () => ipcRenderer.invoke("get-platform"),
  getUserDataPath: () => ipcRenderer.invoke("get-user-data-path"),
  getDesktopStatus: () => ipcRenderer.invoke("get-desktop-status"),
  getRuntimeContext: () => ipcRenderer.invoke("get-runtime-context"),
  setRuntimeContext: (updates) => ipcRenderer.invoke("set-runtime-context", updates),

  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  showNotification: (options) => ipcRenderer.invoke("show-notification", options),

  minimizeWindow: () => ipcRenderer.invoke("minimize-window"),
  maximizeWindow: () => ipcRenderer.invoke("maximize-window"),
  closeWindow: () => ipcRenderer.invoke("close-window"),
  isWindowMaximized: () => ipcRenderer.invoke("is-window-maximized"),

  app: {
    openPreferences: (pane) => ipcRenderer.invoke("app-open-preferences", { pane }),
  },

  windows: {
    open: (role, payload, route) => ipcRenderer.invoke("desktop-window-open", { role, payload, route }),
    focus: (role) => ipcRenderer.invoke("desktop-window-focus", { role }),
    close: (role) => ipcRenderer.invoke("desktop-window-close", { role }),
    getState: () => ipcRenderer.invoke("desktop-window-get-state"),
    getCurrent: () => ipcRenderer.invoke("desktop-window-get-current"),
    setState: (updates) => ipcRenderer.invoke("desktop-window-update-state", updates),
  },

  ui: {
    showContextMenu: (items) => ipcRenderer.invoke("desktop-ui-show-context-menu", { items }),
  },

  navigate: (route) => ipcRenderer.send("navigate", route),
  openOnboarding: () => ipcRenderer.send("open-onboarding"),
  showMainWindow: () => ipcRenderer.send("show-main-window"),

  onNavigate: (callback) => {
    const listener = (event, route) => callback(route);
    ipcRenderer.on("navigate", listener);
    return () => ipcRenderer.removeListener("navigate", listener);
  },
  onDesktopStatusChanged: (callback) => {
    const listener = (event, status) => callback(status);
    ipcRenderer.on("desktop-status-changed", listener);
    return () => ipcRenderer.removeListener("desktop-status-changed", listener);
  },
  onWindowStateChanged: (callback) => {
    const listener = (event, state) => callback(state);
    ipcRenderer.on("desktop-window-state-changed", listener);
    return () => ipcRenderer.removeListener("desktop-window-state-changed", listener);
  },
  onDoctorResult: (callback) => {
    const listener = (event, result) => callback(result);
    ipcRenderer.on("desktop-doctor-result", listener);
    return () => ipcRenderer.removeListener("desktop-doctor-result", listener);
  },
  removeNavigateListener: () => {
    ipcRenderer.removeAllListeners("navigate");
  },
  removeDesktopStatusListener: () => {
    ipcRenderer.removeAllListeners("desktop-status-changed");
  },
  removeWindowStateListener: () => {
    ipcRenderer.removeAllListeners("desktop-window-state-changed");
  },
  removeDoctorResultListener: () => {
    ipcRenderer.removeAllListeners("desktop-doctor-result");
  },

  bridge,
});

if (typeof window !== "undefined") {
  window.mutxDesktop = window.mutxDesktop || {};
}
