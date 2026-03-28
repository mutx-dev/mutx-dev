const { app } = require("electron");
const { spawn, spawnSync } = require("child_process");
const http = require("http");
const path = require("path");
const fs = require("fs");

const UI_PORT_RANGE = { min: 18900, max: 18999 };
const UI_SERVER_START_TIMEOUT_MS = 15000;
const UI_SERVER_START_ATTEMPTS = 3;
const UI_SERVER_BACKOFF_MS = [750, 1500, 3000];

let serverProcess = null;
let serverUrl = null;
let startPromise = null;
let stoppingServer = false;
const listeners = new Set();
let serverState = {
  ready: false,
  state: "stopped",
  url: null,
  port: null,
  lastError: null,
  lastExitCode: null,
  attempt: 0,
};

function notifyListeners() {
  const snapshot = getServerState();
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (error) {
      console.error("[ServerManager] Listener error:", error);
    }
  });
}

function updateServerState(updates) {
  serverState = {
    ...serverState,
    ...updates,
  };
  notifyListeners();
}

function getServerState() {
  return { ...serverState };
}

function addStateListener(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getDevelopmentRootDir() {
  return path.join(__dirname, "..", "..");
}

function getStandaloneWrapper(rootDir) {
  const wrapperPath = path.join(rootDir, "scripts", "start-standalone.mjs");
  if (!fs.existsSync(wrapperPath)) {
    return null;
  }

  return {
    scriptPath: wrapperPath,
    cwd: rootDir,
  };
}

function getPackagedStandaloneScript() {
  const resourcesPath = process.resourcesPath || "";
  const unpackedRoot = path.join(resourcesPath, "app.asar.unpacked");
  const extraResourcesRoot = resourcesPath;
  const unpackedWrapper = getStandaloneWrapper(unpackedRoot);
  const extraResourcesWrapper = getStandaloneWrapper(extraResourcesRoot);
  const unpackedScript = path.join(
    resourcesPath,
    "app.asar.unpacked",
    ".next",
    "standalone",
    "server.js",
  );
  const extraResourcesScript = path.join(resourcesPath, ".next", "standalone", "server.js");
  const packedScript = path.join(resourcesPath, "app.asar", ".next", "standalone", "server.js");

  if (unpackedWrapper) {
    return unpackedWrapper;
  }

  if (extraResourcesWrapper) {
    return extraResourcesWrapper;
  }

  if (fs.existsSync(unpackedScript)) {
    return {
      scriptPath: unpackedScript,
      cwd: path.dirname(unpackedScript),
    };
  }

  if (fs.existsSync(extraResourcesScript)) {
    return {
      scriptPath: extraResourcesScript,
      cwd: path.dirname(extraResourcesScript),
    };
  }

  if (fs.existsSync(packedScript)) {
    throw new Error(
      "Standalone Next.js server is packaged inside app.asar. Unpack `.next/standalone/**/*` so Next can chdir into its runtime directory.",
    );
  }

  return null;
}

function isPortAvailable(port) {
  const net = require("net");
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close();
      resolve(true);
    });
    server.listen(port, "127.0.0.1");
  });
}

async function findAvailablePort() {
  for (let port = UI_PORT_RANGE.min; port <= UI_PORT_RANGE.max; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error("No available port in range");
}

function getServerScript() {
  const developmentWrapper = getStandaloneWrapper(getDevelopmentRootDir());

  if (app.isPackaged) {
    return getPackagedStandaloneScript();
  }

  if (developmentWrapper) {
    return developmentWrapper;
  }

  const scriptPath = path.join(getDevelopmentRootDir(), ".next", "standalone", "server.js");
  if (fs.existsSync(scriptPath)) {
    return {
      scriptPath,
      cwd: path.dirname(scriptPath),
    };
  }
  return null;
}

function ensureStandaloneAssets() {
  if (app.isPackaged) {
    return;
  }

  const rootDir = getDevelopmentRootDir();
  const standaloneDir = path.join(rootDir, ".next", "standalone");
  const standaloneStaticDir = path.join(standaloneDir, ".next", "static");
  const standalonePublicDir = path.join(standaloneDir, "public");
  const prepareScript = path.join(rootDir, "scripts", "prepare-standalone.mjs");

  const hasStatic = fs.existsSync(standaloneStaticDir);
  const hasPublic = fs.existsSync(standalonePublicDir);
  if ((hasStatic && hasPublic) || !fs.existsSync(prepareScript)) {
    return;
  }

  const result = spawnSync(process.execPath, [prepareScript], {
    cwd: rootDir,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error("Could not prepare standalone assets for desktop UI");
  }
}

function waitForServer(url, childProcess, timeoutMs = UI_SERVER_START_TIMEOUT_MS) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      if (childProcess) {
        childProcess.removeListener("error", onError);
        childProcess.removeListener("exit", onExit);
      }
    };

    const settle = (callback, value) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      callback(value);
    };

    const onError = (error) => {
      settle(reject, error);
    };

    const onExit = (code, signal) => {
      settle(
        reject,
        new Error(`UI server exited before it became ready (code=${code}, signal=${signal || "none"})`),
      );
    };

    if (childProcess) {
      childProcess.once("error", onError);
      childProcess.once("exit", onExit);
    }

    const check = () => {
      if (settled) {
        return;
      }

      const req = http.get(url, (res) => {
        res.resume();
        settle(resolve);
      });

      req.on("error", () => {
        if (Date.now() - start >= timeoutMs) {
          settle(reject, new Error(`UI server did not start in time: ${url}`));
          return;
        }
        setTimeout(check, 250);
      });
    };

    check();
  });
}

function resetRunningServer() {
  serverProcess = null;
  serverUrl = null;
}

function terminateServerProcess() {
  if (!serverProcess) {
    return;
  }

  const processToStop = serverProcess;
  serverProcess = null;
  serverUrl = null;
  try {
    processToStop.kill("SIGTERM");
  } catch (error) {
    console.error("[ServerManager] Failed to stop UI server:", error);
  }
}

function attachServerListeners(childProcess, url) {
  childProcess.stdout.on("data", (data) => {
    const line = data.toString().trim();
    if (!line) {
      return;
    }
    if (line.includes("Ready") || line.includes("listening") || line.includes("started")) {
      console.log("[ServerManager] UI server ready:", url);
    }
  });

  childProcess.stderr.on("data", (data) => {
    const message = data.toString().trim();
    if (!message) {
      return;
    }
    updateServerState({ lastError: message });
    console.error("[ServerManager] Server stderr:", message);
  });

  childProcess.on("error", (error) => {
    console.error("[ServerManager] Server error:", error);
    if (serverProcess === childProcess) {
      resetRunningServer();
    }
    updateServerState({
      ready: false,
      state: "error",
      url: null,
      port: null,
      lastError: error.message,
    });
  });

  childProcess.on("exit", (code, signal) => {
    if (serverProcess === childProcess) {
      resetRunningServer();
    }

    const intentionalStop = stoppingServer;
    const exitMessage =
      code === null
        ? `UI server exited unexpectedly (signal=${signal || "none"})`
        : `UI server exited with code ${code}`;

    updateServerState({
      ready: false,
      state: intentionalStop ? "stopped" : "degraded",
      url: null,
      port: null,
      lastExitCode: code ?? null,
      lastError: intentionalStop ? null : exitMessage,
    });
  });
}

async function launchServerAttempt(serverScript, options, attempt) {
  const port = await findAvailablePort();
  const url = `http://127.0.0.1:${port}`;

  const env = {
    ...process.env,
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
    NODE_ENV: "production",
    MUTX_DESKTOP_MODE: "true",
    MUTX_DESKTOP_RUNTIME_CONTEXT_PATH: options.runtimeContextPath || "",
    NEXT_TELEMETRY_DISABLED: "1",
    ELECTRON_RUN_AS_NODE: "1",
  };

  stoppingServer = false;
  updateServerState({
    ready: false,
    state: attempt === 1 ? "starting" : "restarting",
    url,
    port,
    attempt,
    lastError: null,
    lastExitCode: null,
  });

  console.log("[ServerManager] Launching UI server:", serverScript.scriptPath);

  const childProcess = spawn(process.execPath, [serverScript.scriptPath], {
    cwd: serverScript.cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
  });

  serverProcess = childProcess;
  serverUrl = url;
  attachServerListeners(childProcess, url);

  await waitForServer(url, childProcess);

  updateServerState({
    ready: true,
    state: "ready",
    url,
    port,
    attempt,
    lastError: null,
    lastExitCode: null,
  });

  return url;
}

async function startUIServer(options = {}) {
  if (isServerRunning() && serverUrl) {
    return serverUrl;
  }

  if (startPromise) {
    return startPromise;
  }

  startPromise = (async () => {
    ensureStandaloneAssets();

    const serverScript = getServerScript();
    if (!serverScript) {
      updateServerState({
        ready: false,
        state: "error",
        lastError: "Standalone Next.js server not found. Run `npm run build` first.",
      });
      throw new Error("Standalone Next.js server not found. Run `npm run build` first.");
    }

    let lastError = null;

    for (let attempt = 1; attempt <= UI_SERVER_START_ATTEMPTS; attempt += 1) {
      try {
        return await launchServerAttempt(serverScript, options, attempt);
      } catch (error) {
        lastError = error;
        const message =
          error instanceof Error ? error.message : "UI server failed to start";

        console.error("[ServerManager] UI server startup failed:", message);
        terminateServerProcess();
        updateServerState({
          ready: false,
          state: attempt < UI_SERVER_START_ATTEMPTS ? "restarting" : "error",
          url: null,
          port: null,
          attempt,
          lastError: message,
        });

        if (attempt < UI_SERVER_START_ATTEMPTS) {
          const backoffMs =
            UI_SERVER_BACKOFF_MS[Math.min(attempt - 1, UI_SERVER_BACKOFF_MS.length - 1)];
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error("UI server failed to start");
  })().finally(() => {
    startPromise = null;
  });

  return startPromise;
}

function stopUIServer() {
  stoppingServer = true;
  terminateServerProcess();
  updateServerState({
    ready: false,
    state: "stopped",
    url: null,
    port: null,
    lastError: null,
  });
}

function getServerUrl() {
  return serverUrl;
}

function isServerRunning() {
  return serverProcess !== null && serverProcess.exitCode === null;
}

module.exports = {
  addStateListener,
  getServerState,
  startUIServer,
  stopUIServer,
  getServerUrl,
  isServerRunning,
};
