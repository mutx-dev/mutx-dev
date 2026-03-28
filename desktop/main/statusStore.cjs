const { app } = require("electron");
const path = require("path");
const fs = require("fs");

let state = {
  mode: "unknown",
  apiUrl: null,
  apiHealth: "unknown",
  authenticated: false,
  user: null,
  openclaw: {
    binaryPath: null,
    health: "unknown",
    gatewayUrl: null,
  },
  faramesh: {
    available: false,
    socketPath: null,
    health: "unknown",
  },
  uiServer: {
    ready: false,
    state: "unknown",
    url: null,
    port: null,
    lastError: null,
    lastExitCode: null,
    attempt: 0,
  },
  localControlPlane: {
    ready: false,
    path: null,
    state: "unknown",
    exists: null,
    lastError: null,
  },
  runtime: {
    state: "unknown",
    lastError: null,
  },
  assistant: {
    found: false,
    name: null,
    agentId: null,
    workspace: null,
    gatewayStatus: null,
    sessionCount: 0,
    state: "unknown",
    lastError: null,
  },
  bridge: {
    ready: false,
    state: "unknown",
    pythonCommand: null,
    scriptPath: null,
    lastError: null,
    lastExitCode: null,
  },
  cliAvailable: false,
  mutxVersion: null,
  lastUpdated: null,
};

let listeners = new Set();

function getState() {
  return { ...state };
}

function updateState(updates) {
  state = { ...state, ...updates, lastUpdated: new Date().toISOString() };
  notifyListeners();
}

function updateOpenclaw(updates) {
  state.openclaw = { ...state.openclaw, ...updates };
  state.lastUpdated = new Date().toISOString();
  notifyListeners();
}

function updateFaramesh(updates) {
  state.faramesh = { ...state.faramesh, ...updates };
  state.lastUpdated = new Date().toISOString();
  notifyListeners();
}

function updateUiServer(updates) {
  state.uiServer = { ...state.uiServer, ...updates };
  state.lastUpdated = new Date().toISOString();
  notifyListeners();
}

function updateAssistant(updates) {
  state.assistant = { ...state.assistant, ...updates };
  state.lastUpdated = new Date().toISOString();
  notifyListeners();
}

function updateLocalControlPlane(updates) {
  state.localControlPlane = { ...state.localControlPlane, ...updates };
  state.lastUpdated = new Date().toISOString();
  notifyListeners();
}

function updateRuntime(updates) {
  state.runtime = { ...state.runtime, ...updates };
  state.lastUpdated = new Date().toISOString();
  notifyListeners();
}

function updateAuth(authData) {
  state.authenticated = authData.authenticated;
  state.user = authData.user;
  state.lastUpdated = new Date().toISOString();
  notifyListeners();
}

function updateBridge(updates) {
  state.bridge = { ...state.bridge, ...updates };
  state.lastUpdated = new Date().toISOString();
  notifyListeners();
}

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener({ ...state });
    } catch (e) {
      console.error("[StatusStore] Listener error:", e);
    }
  });
}

function addListener(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getPrefsPath() {
  return path.join(app.getPath("userData"), "desktop-prefs.json");
}

function loadPrefs() {
  const prefsPath = getPrefsPath();
  try {
    if (fs.existsSync(prefsPath)) {
      const data = fs.readFileSync(prefsPath, "utf8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("[StatusStore] Failed to load prefs:", e);
  }
  return {};
}

function savePrefs(prefs) {
  const prefsPath = getPrefsPath();
  try {
    fs.writeFileSync(prefsPath, JSON.stringify(prefs, null, 2), "utf8");
  } catch (e) {
    console.error("[StatusStore] Failed to save prefs:", e);
  }
}

module.exports = {
  getState,
  updateState,
  updateOpenclaw,
  updateFaramesh,
  updateUiServer,
  updateAssistant,
  updateLocalControlPlane,
  updateRuntime,
  updateAuth,
  updateBridge,
  addListener,
  loadPrefs,
  savePrefs,
};
