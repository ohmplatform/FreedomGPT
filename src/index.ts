import axios from "axios";
import { spawn } from "child_process";
import cors from "cors";
import diskusage from "diskusage";
import { BrowserWindow, app, autoUpdater, dialog } from "electron";
import express from "express";
import fs from "fs";
import http from "http";
import os from "os";
import { Server } from "socket.io";
import update from "update-electron-app";

const expressapp = express();
const server = http.createServer(expressapp);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
if (require("electron-squirrel-startup")) app.quit();

expressapp.use(cors());

const EXPRESSPORT = 8889;

let program: import("child_process").ChildProcessWithoutNullStreams = null;

const deviceisWindows = process.platform === "win32";

// Have not tested in windows yet
const CHAT_APP_LOCATION = app.isPackaged
  ? process.resourcesPath + "/models/mac/main"
  : deviceisWindows
  ? process.cwd() + "/llama.cpp/Release/main"
  : process.cwd() + "/llama.cpp/main";

io.on("connection", (socket) => {
  const totalRAM = os.totalmem() / 1024 ** 3;
  const freeRAM = os.freemem() / 1024 ** 3;
  const usedRAM = totalRAM - freeRAM;
  socket.emit("ram_usage", {
    totalRAM: totalRAM.toFixed(2),
    freeRAM: freeRAM.toFixed(2),
    usedRAM: usedRAM.toFixed(2),
  });

  diskusage.check("/", (err, info) => {
    if (err) {
      console.log(err);
    } else {
      const totalDisk = info.total / 1024 ** 3;
      const freeDisk = info.available / 1024 ** 3;
      socket.emit("disk_usage", {
        totalDisk: totalDisk.toFixed(2),
        freeDisk: freeDisk.toFixed(2),
      });
    }
  });

  let selectedModel: string;

  socket.on("delete_model", (data) => {
    fs.unlink(data, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
  });

  socket.emit("selected_model", selectedModel);

  socket.on("download_model", (data) => {
    selectedModel = data.model;
    const fileName = data.downloadURL.split("/").pop();
    const filePath = process.cwd() + "/" + fileName;
    const options = {
      defaultPath: filePath,
      buttonLabel: "Download",
    };
    dialog.showSaveDialog(options).then((result) => {
      if (result.canceled) {
        socket.emit("download_canceled");
      }

      if (!result.canceled) {
        const downloadPath = result.filePath;
        const writer = fs.createWriteStream(downloadPath);

        let lastPercentage = 0;

        axios({
          url: data.downloadURL,
          method: "GET",
          responseType: "stream",
        })
          .then((response) => {
            const contentLength = response.headers["content-length"];
            response.data.pipe(writer);

            let downloadedBytes = 0;

            response.data.on("data", (chunk: any) => {
              downloadedBytes += chunk.length;
              const percentage = Math.floor(
                (downloadedBytes / contentLength) * 100
              );

              if (percentage > lastPercentage) {
                lastPercentage = percentage;
                socket.emit("download_progress", {
                  percentage,
                  downloadedBytes,
                  contentLength,
                  selectedModel,
                });
              }
            });

            writer.on("finish", () => {
              console.log(`\nModel downloaded to ${downloadPath}`);

              socket.emit("download_complete", {
                downloadPath,
                selectedModel,
              });
            });

            writer.on("error", (err) => {
              console.error("Failed to download model:", err);
            });
          })
          .catch((error) => {
            console.error("Failed to download model:", error);
            if (fs.existsSync(downloadPath)) {
              fs.unlinkSync(downloadPath);
            }

            socket.emit("download_model", data);
          });
      }
    });
  });

  socket.on("select_model", (data) => {
    selectedModel = data.model;

    if (program) {
      program.kill();
    }

    const modelConfig: { [key: string]: string[] } = {
      "alpaca-7B-fast": ["-m", data.FILEPATH, "-ins"],
      "alpaca-7B-full": [
        "-m",
        data.FILEPATH,
        "--ctx_size",
        "2048",
        "-n",
        "-1",
        "-ins",
        "-b",
        "256",
        "--top_k",
        "10000",
        "--temp",
        "0.2",
        "--repeat_penalty",
        "1",
        "-t",
        "7",
      ],
      "llama-7B-fast": ["-m", data.FILEPATH, "-ins"],
      "llama-7B-full": [
        "-m",
        data.FILEPATH,
        "-ins",
        "--ctx_size",
        "2048",
        "-n",
        "-1",
        "-ins",
        "-b",
        "256",
        "--top_k",
        "10000",
        "--temp",
        "0.2",
        "--repeat_penalty",
        "1",
        "-t",
        "7",
      ],
    };

    program = spawn(CHAT_APP_LOCATION, modelConfig[selectedModel]);

    program.on("error", (err) => {
      console.error("Failed to start child process:", err);
    });

    program.stderr.on("data", (data: Buffer) => {
      const dat = data.toString("utf8");
      if (dat.includes("end your input in '\\'.")) {
        socket.emit("selected_model", selectedModel);
        socket.emit("model_loaded", true);
      }
    });

    program.on("exit", (code, signal) => {
      console.log(
        `Child process exited with code ${code} and signal ${signal}`
      );
    });

    program.stdout.on("data", (data: Buffer) => {
      let output = data.toString("utf8");
      let closing = "";

      if (output.includes(">")) {
        closing = closing.concat(">");
      }

      output = output.replace(">", "");

      socket.emit("response", output);

      if (closing.includes(">")) {
        socket.emit("chatend");
        closing = "";
      }
    });

    program.on("spawn", () => {
      console.log("spawned");
      socket.emit("model_loading", true);
      socket.emit("model_loaded", false);
    });
  });

  socket.on("stopResponding", () => {
    if (program) {
      program.kill("SIGINT");
    }
  });

  socket.on("message", (message) => {
    if (program && program.stdin) {
      program.stdin.write(message + "\n");
    }
  });

  socket.on("disconnect", (reason) => {
    if (program) {
      program.kill();
      program = null;
    }
    console.log(`Socket disconnected: ${reason}`);
  });
});

server.listen(process.env.PORT || EXPRESSPORT, () => {
  console.log(`Server listening on port ${EXPRESSPORT}`);
});

const createWindow = (): void => {
  const mainWindow = new BrowserWindow({
    height: 1080,
    width: 1080,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  // if (!app.isPackaged) {
  //   mainWindow.webContents.openDevTools();
  // }

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
