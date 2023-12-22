import { EXPRESS_SERVER_PORT, LLAMA_SERVER_PORT, NEXT_APP_PORT } from "./ports";
import axios from "axios";
import checkDiskSpace from "check-disk-space";
import { spawn } from "child_process";
import cors from "cors";
import { resolve } from "dns";
import { BrowserWindow, app, autoUpdater } from "electron";
import { dialog } from "electron";
import isDev from "electron-is-dev";
import express from "express";
import fs from "fs";
import { createServer } from "http";
import http from "http";
import next from "next";
import os from "os";
import { Server } from "socket.io";
import { Readable } from "stream";
import update from "update-electron-app";
import { parse } from "url";

const expressapp = express();
expressapp.use(express.json());
const expressServer = http.createServer(expressapp);

const io = new Server(expressServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const homeDir = app.getPath("home");

export let server: import("child_process").ChildProcessWithoutNullStreams =
  null as any;

const deviceisWindows = process.platform === "win32";

const DEFAULT_MODEL_LOCATION = homeDir + "/FreedomGPT";

const CHAT_SERVER_LOCATION = app.isPackaged
  ? deviceisWindows
    ? process.resourcesPath + "/models/windows/llama/server"
    : process.resourcesPath + "/models/mac/llama/server"
  : deviceisWindows
  ? process.cwd() + "/llama.cpp/bin/Release/server"
  : process.cwd() + "/llama.cpp/server";

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
if (require("electron-squirrel-startup")) app.quit();

expressapp.use(cors());

const nextApp = next({ dev: isDev, dir: app.getAppPath() + "/renderer" });
const handle = nextApp.getRequestHandler();

const checkConnection = (): Promise<boolean> => {
  return new Promise<boolean>((innerResolve) => {
    resolve("electron.chat.freedomgpt.com", (err) => {
      innerResolve(!err);
    });
  });
};

io.on("connection", (socket) => {
  console.log("connected");

  const getDeviceInfo = () => {
    const cpuInfo = os.cpus();
    const totalRAM = os.totalmem() / 1024 ** 3;
    const freeRAM = os.freemem() / 1024 ** 3;
    const usedRAM = totalRAM - freeRAM;

    socket.emit("cpu_info", {
      model: cpuInfo[0].model,
      speed: cpuInfo[0].speed,
      times: cpuInfo[0].times,
    });

    socket.emit("ram_usage", {
      totalRAM: totalRAM.toFixed(2),
      freeRAM: freeRAM.toFixed(2),
      usedRAM: usedRAM.toFixed(2),
    });

    checkDiskSpace("/")
      .then((diskSpace) => {
        socket.emit("disk_usage", {
          totalDisk: (diskSpace.size / 1024 ** 3).toFixed(2),
          freeDisk: (diskSpace.free / 1024 ** 3).toFixed(2),
        });
      })
      .catch((err) => {
        console.error(err);
      });
  };

  socket.on("get_device_info", () => {
    getDeviceInfo();
  });

  socket.on("delete_model", (data) => {
    fs.unlink(data, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
  });

  socket.on("choose_model", (data) => {
    const options = {
      defaultPath: DEFAULT_MODEL_LOCATION,
      buttonLabel: "Choose",

      filters: [
        {
          name: "Model",
          extensions: ["gguf"],
        },
      ],
    };

    dialog.showOpenDialog(options).then((result) => {
      if (!result.canceled) {
        const filePath = result.filePaths[0];

        socket.emit("download_complete", {
          downloadPath: filePath,
          modelData: data,
        });
      }
    });
  });

  socket.on("download_model", (data) => {
    const selectedModel = data.model;
    const fileName = data.downloadURL.split("/").pop();
    const filePath = DEFAULT_MODEL_LOCATION + "/" + fileName;

    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath);
    }

    const options = {
      defaultPath: filePath,
      buttonLabel: "Download",
    };
    let downloadPath: string = "" as string;
    let writer: fs.WriteStream = null as any;
    let lastPercentage = 0;

    const cancelDownload = () => {
      writer.close();
      fs.unlinkSync(downloadPath);
      socket.emit("download_canceled");
    };

    dialog.showSaveDialog(options).then((result) => {
      if (result.canceled) {
        socket.emit("download_canceled");
        console.log("Cancelled download");
      }
      if (!result.canceled) {
        downloadPath = result.filePath as string;
        writer = fs.createWriteStream(downloadPath);
        socket.emit("download_begin");

        axios({
          url: data.downloadURL,
          method: "GET",
          responseType: "stream",
        })
          .then((response) => {
            const contentLength = response.headers["content-length"];
            response.data.pipe(writer);

            socket.emit("download_started", {
              contentLength,
              selectedModel,
            });

            let downloadedBytes = 0;

            response.data.on("data", (chunk: any) => {
              downloadedBytes += chunk.length;
              const percentage = Math.floor(
                (downloadedBytes / Number(contentLength)) * 100
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
                modelData: data,
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

    socket.on("cancel_download", () => {
      cancelDownload();
    });
  });

  socket.on("select_model", (data: { model: string; FILEPATH: string }) => {
    if (server) {
      server.kill();
      server = null as any;
    }

    const FILEPATH = `${data.FILEPATH}`;
    server = spawn(
      CHAT_SERVER_LOCATION,
      ["-m", FILEPATH, "-c", "2048", "--port", LLAMA_SERVER_PORT],
      {
        detached: false,
        shell: true,
        windowsHide: true,
      }
    );

    server.on("error", (err) => {
      console.error("Failed to start child process:", err);
    });

    server.stderr.on("data", (data) => {
      const output = data.toString("utf8");

      if (output.includes("llama server listening")) {
        socket.emit("model_loading", false);
        socket.emit("model_loaded", true);
      }
    });

    server.stderr.on("error", (err) => {
      console.error("Failed to start child process:", err);
    });

    server.on("exit", (code, signal) => {
      console.log(
        `Child process exited with code ${code} and signal ${signal}`
      );
    });

    server.on("spawn", () => {
      socket.emit("model_loading", true);
    });
  });

  socket.on("disconnect", (reason) => {
    if (server) {
      socket.emit("model_stopped", true);
      server.kill();
      server = null as any;
    }
    console.log(`Socket disconnected: ${reason}`);
  });

  socket.on("kill_process", () => {
    if (server) {
      socket.emit("model_stopped", true);
      server.kill();
      server = null as any;
    }
  });
});

const streamingFunction = async ({ promptToSend }) => {
  const encoder = new TextEncoder();
  const stream = new Readable({
    read() {},
  });

  const fetchStreamData = async () => {
    const result = await fetch(
      `http://127.0.0.1:${LLAMA_SERVER_PORT}/completion`,
      {
        method: "POST",
        body: JSON.stringify({
          prompt: promptToSend,
          n_predict: 512,
          stream: true,
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );

    for await (const chunk of result.body as any) {
      const t = Buffer.from(chunk).toString("utf8");

      try {
        if (t.startsWith("data: ")) {
          const message = JSON.parse(t.substring(6));
          (stream as any).push(encoder.encode(message.content));

          if (message.stop) {
            (stream as any).push(null);
          }
        }
      } catch (error) {
        (stream as any).push(null);
      }
    }
  };

  fetchStreamData();

  return stream;
};

expressapp.post("/api/edge", async (req, res) => {
  const { messages, continueMessage } = req.body;

  try {
    let promptToSend = "";

    let messagesToSend = messages;

    const conversation = messagesToSend
      .map((message) => {
        if (message.role === "user") {
          return `USER: ${message.content}`;
        } else if (message.role === "assistant") {
          return `ASSISTANT: ${message.content}`;
        }
        if (continueMessage) {
          return `USER: continue`;
        }
      })
      .join("\n");

    promptToSend += `USER:\n${conversation}\nASSISTANT:`;

    try {
      const streamResponse = await streamingFunction({
        promptToSend,
      });

      res.set({ "Content-Type": "text/plain" });
      streamResponse.pipe(res);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Something went wrong");
    }
  } catch (error) {
    console.error("Error fetching the data:", error);
    res.status(500).send(`Something went wrong: ${error.message}`);
  }
});

expressServer.listen(EXPRESS_SERVER_PORT, () => {
  console.log(`Server listening on port ${EXPRESS_SERVER_PORT}`);
});

const createWindow = async () => {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      devTools: true,
    },
  });

  checkConnection().then(async (isOnline) => {
    if (isOnline) {
      console.log("Online");

      mainWindow.loadURL(`https://electron.chat.freedomgpt.com/`);
    } else {
      console.log("No connection");

      await nextApp.prepare();

      createServer((req: any, res: any) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      }).listen(NEXT_APP_PORT, () => {
        console.log(`> Ready on http://localhost:${NEXT_APP_PORT}`);
      });

      mainWindow.loadURL(`http://localhost:${NEXT_APP_PORT}/`);
    }
  });

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
