import { BrowserWindow, app, autoUpdater } from "electron";
import isDev from "electron-is-dev";
import { createServer } from "http";
import next from "next";
import update from "update-electron-app";
import { parse } from "url";

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
if (require("electron-squirrel-startup")) app.quit();

const nextApp = next({ dev: isDev, dir: app.getAppPath() + "/renderer" });
const handle = nextApp.getRequestHandler();
const PORT = 8889;

const createWindow = async () => {
  await nextApp.prepare();

  createServer((req: any, res: any) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });

  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      devTools: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${PORT}/`);

  mainWindow.once("ready-to-show", () => {
    update();

    autoUpdater.on("update-available", () => {
      console.log("Update available");
    });

    autoUpdater.on("update-downloaded", () => {
      console.log("Update downloaded");
      autoUpdater.quitAndInstall();
      app.quit();
    });

    autoUpdater.on("update-not-available", () => {
      console.log("Update not available");
    });

    autoUpdater.on("error", (err) => {
      console.log("Error in auto-updater. " + err);
    });

    autoUpdater.on("checking-for-update", () => {
      console.log("Checking for update...");
    });
  });
};

app.on("ready", () => {
  createWindow();
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
