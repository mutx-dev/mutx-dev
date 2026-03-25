const { app, BrowserWindow, shell, Menu, Tray, Notification, ipcMain, nativeImage } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

const DEFAULT_URL = "https://app.mutx.dev";
const LOCAL_URL = "http://localhost:3000";

let mainWindow = null;
let tray = null;
let isQuitting = false;
let onboardingWindow = null;

function getDesktopUrl() {
  return process.env.MUTX_DESKTOP_URL || DEFAULT_URL;
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "MUTX",
    backgroundColor: "#0a0a0f",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadURL(getDesktopUrl());

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (Notification.isSupported()) {
        new Notification({
          title: "MUTX",
          body: "MUTX is still running in the background",
        }).show();
      }
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });
}

function createOnboardingWindow() {
  if (onboardingWindow) {
    onboardingWindow.focus();
    return;
  }

  onboardingWindow = new BrowserWindow({
    width: 900,
    height: 700,
    resizable: false,
    title: "MUTX Setup",
    backgroundColor: "#0a0a0f",
    center: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  onboardingWindow.loadURL(`${getDesktopUrl()}/onboarding`);
  onboardingWindow.setMenu(null);

  onboardingWindow.once("ready-to-show", () => {
    onboardingWindow.show();
  });

  onboardingWindow.on("closed", () => {
    onboardingWindow = null;
    if (mainWindow) {
      mainWindow.show();
    }
  });
}

function createTray() {
  const iconPath = path.join(__dirname, "..", "Resources", "icon.png");
  let trayIcon;

  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty();
    }
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open MUTX",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createMainWindow();
        }
      },
    },
    {
      label: "New Assistant",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send("navigate", "/dashboard/agents/new");
        }
      },
    },
    { type: "separator" },
    {
      label: "Dashboard",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send("navigate", "/dashboard");
        }
      },
    },
    {
      label: "Settings",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send("navigate", "/dashboard/control");
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit MUTX",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("MUTX");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

function createAppMenu() {
  const template = [
    {
      label: "MUTX",
      submenu: [
        { label: "About MUTX", role: "about" },
        { type: "separator" },
        {
          label: "Preferences...",
          accelerator: "CmdOrCtrl+,",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("navigate", "/dashboard/control");
            }
          },
        },
        { type: "separator" },
        { label: "Hide MUTX", role: "hide" },
        { label: "Hide Others", role: "hideOthers" },
        { label: "Show All", role: "unhide" },
        { type: "separator" },
        { label: "Quit MUTX", accelerator: "Cmd+Q", click: () => { isQuitting = true; app.quit(); } },
      ],
    },
    {
      label: "File",
      submenu: [
        {
          label: "New Assistant",
          accelerator: "Cmd+N",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("navigate", "/dashboard/agents/new");
            }
          },
        },
        { type: "separator" },
        {
          label: "Close Window",
          accelerator: "Cmd+W",
          role: "close",
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", role: "undo" },
        { label: "Redo", role: "redo" },
        { type: "separator" },
        { label: "Cut", role: "cut" },
        { label: "Copy", role: "copy" },
        { label: "Paste", role: "paste" },
        { label: "Select All", role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { label: "Reload", accelerator: "Cmd+R", role: "reload" },
        { label: "Force Reload", accelerator: "Cmd+Shift+R", role: "forceReload" },
        { label: "Toggle DevTools", accelerator: "Cmd+Option+I", role: "toggleDevTools" },
        { type: "separator" },
        { label: "Actual Size", accelerator: "Cmd+0", role: "resetZoom" },
        { label: "Zoom In", accelerator: "Cmd+Plus", role: "zoomIn" },
        { label: "Zoom Out", accelerator: "Cmd+-", role: "zoomOut" },
        { type: "separator" },
        { label: "Toggle Full Screen", accelerator: "Ctrl+Cmd+F", role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { label: "Minimize", role: "minimize" },
        { label: "Zoom", role: "zoom" },
        { type: "separator" },
        { label: "Bring All to Front", role: "front" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Documentation",
          click: () => {
            shell.openExternal("https://mutx.dev/docs");
          },
        },
        {
          label: "Report Issue",
          click: () => {
            shell.openExternal("https://github.com/mutx-dev/mutx-dev/issues");
          },
        },
        { type: "separator" },
        {
          label: "About",
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send("navigate", "/about");
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function setupIpcHandlers() {
  ipcMain.handle("get-app-version", () => {
    return app.getVersion();
  });

  ipcMain.handle("get-platform", () => {
    return process.platform;
  });

  ipcMain.handle("get-user-data-path", () => {
    return app.getPath("userData");
  });

  ipcMain.handle("open-external", async (event, url) => {
    await shell.openExternal(url);
  });

  ipcMain.handle("show-notification", async (event, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
      return true;
    }
    return false;
  });

  ipcMain.handle("run-cli-command", async (event, { command, args }) => {
    return new Promise((resolve) => {
      try {
        const child = spawn(command, args, {
          shell: true,
          stdio: ["ignore", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        child.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        child.on("close", (code) => {
          resolve({ code, stdout, stderr });
        });

        child.on("error", (error) => {
          resolve({ code: -1, stdout: "", stderr: error.message });
        });
      } catch (error) {
        resolve({ code: -1, stdout: "", stderr: error.message });
      }
    });
  });

  ipcMain.handle("minimize-window", () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle("maximize-window", () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle("close-window", () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.handle("is-window-maximized", () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  ipcMain.on("navigate", (event, route) => {
    if (mainWindow) {
      mainWindow.webContents.send("navigate", route);
    }
  });

  ipcMain.on("open-onboarding", () => {
    createOnboardingWindow();
  });

  ipcMain.on("close-onboarding", () => {
    if (onboardingWindow) {
      onboardingWindow.close();
    }
  });

  ipcMain.on("show-main-window", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  createAppMenu();
  createMainWindow();
  createTray();
  setupIpcHandlers();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
});
