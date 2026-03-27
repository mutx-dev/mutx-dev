const { app, BrowserWindow, shell } = require("electron");

const DEFAULT_URL = "https://mutx.dev";

function getDesktopUrl() {
  // Allow local development shells to point to localhost.
  return process.env.MUTX_DESKTOP_URL || DEFAULT_URL;
}

function isSafeExternalUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:";
  } catch {
    return false;
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalUrl(url)) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.loadURL(getDesktopUrl()).catch((error) => {
    const escapedMessage = String(error).replace(/</g, "&lt;").replace(/>/g, "&gt;");
    mainWindow.loadURL(
      `data:text/html,` +
        encodeURIComponent(
          `<h2>Unable to load MUTX</h2><p>${escapedMessage}</p><p>Set MUTX_DESKTOP_URL to a reachable URL and relaunch.</p>`
        )
    );
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
