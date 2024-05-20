import { BrowserWindow, app, dialog, powerMonitor, powerSaveBlocker, Tray, Notification, nativeTheme, systemPreferences,  shell } from "electron";
import updateElectronApp from "update-electron-app";
import log from 'electron-log/main';
import { EXPRESS_SERVER_PORT, LLAMA_SERVER_PORT, NEXT_APP_PORT } from "./ports";
import axios from "axios";
import { spawn, exec } from "child_process";
import cors from "cors";
import dns, { resolve, resolve4 } from "dns";
import isDev from "electron-is-dev";
import express from "express";
import fs from "fs";
import http, { createServer } from "http";
import md5File from "md5-file";
import next from "next";
import os from "os";
import { Server } from "socket.io";
import { parse } from "url";
import machineUuid from 'machine-uuid';
import util from 'util';
import path from 'path';
import { Readable } from "stream";

export let inferenceProcess: import("child_process").ChildProcessWithoutNullStreams =
  null as any;
export let xmrigProcess: import("child_process").ChildProcessWithoutNullStreams =
  null as any;

let mainWindow;
let tray = null;

const localServerApp = express();
localServerApp.use(express.json());
localServerApp.use(cors());
const localServer = http.createServer(localServerApp);
const io = new Server(localServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const deviceisWindows = process.platform === "win32";

const DEFAULT_MODEL_LOCATION = `${app.getPath('documents')}/FreedomGPT`;

const CHAT_SERVER_LOCATION = app.isPackaged
  ? deviceisWindows
    ? process.resourcesPath + "/models/windows/llama/server"
    : process.resourcesPath + "/models/mac/llama/server"
  : deviceisWindows
  ? process.cwd() + "/llama.cpp/bin/Release/server"
  : process.cwd() + "/llama.cpp/server";
let inferenceProcessIsStarting = false;

const XMRIG_LOCATION = app.isPackaged
  ? deviceisWindows
    ? process.resourcesPath + "/miner/windows/fgptminer.exe"
    : process.resourcesPath + "/miner/mac/fgptminer"
  : deviceisWindows
  ? process.cwd() + "/miner/windows/fgptminer.exe"
  : process.cwd() + "/miner/mac/fgptminer"

const offlineApp = next({
  dev: isDev,
  dir: app.getAppPath() + "/renderer",
});
const handle = offlineApp.getRequestHandler();

const checkConnection = (simulateOffline?): Promise<boolean> => {
  return new Promise<boolean>((innerResolve) => {
    if (simulateOffline) innerResolve(false);
    resolve("electron.freedomgpt.com", (err) => {
      innerResolve(!err);
    });
  });
};

const isVCRedistInstalled = async (): Promise<boolean> => {
  const regKey = 'HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\VisualStudio\\14.0\\VC\\Runtimes\\X64';
  try {
    const { stdout } = await execAsync(`reg query "${regKey}" /v Installed /reg:64`);
    return stdout.includes('0x1');
  } catch (error) {
    log.error('Visual C++ Redistributable is not installed or an error occurred.');
    return false;
  }
};
const installVCRedist = () => {
  return new Promise<void>((resolve, reject) => {
    const vcRedistPath = path.join(app.getAppPath(), 'redist', 'vc_redist.x64.exe');
    log.info('Starting Visual C++ Redistributable installation...');

    if (!fs.existsSync(vcRedistPath)) {
      return reject(`The Visual C++ Redistributable installer was not found at the path: ${vcRedistPath}`);
    }

    const installer = spawn(vcRedistPath, ['/install', '/quiet', '/norestart']);
    installer.on('close', (code) => {
      if (code === 0) {
        log.info('Visual C++ Redistributable installation succeeded.');
        resolve();
      } else {
        log.error(`Visual C++ Redistributable installation failed with exit code: ${code}`);
        reject(`Installation failed with exit code: ${code}`);
      }
    });
  });
};

const execAsync = util.promisify(exec);

dns.setServers(['8.8.8.8', '1.1.1.1']);

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";
if (require("electron-squirrel-startup")) app.quit();

const askForMicrophonePermission = async () => {
  try {
    if (process.platform !== 'darwin') {
      console.warn('Microphone permission request is only supported on macOS.');
      return false;
    }
    const status = await systemPreferences.askForMediaAccess("microphone");
    return status;
  } catch (error) {
    log.error('Failed to ask for microphone permission', error);
    return false;
  }
};

io.on("connection", (socket) => {
  log.info("socket connected");

  machineUuid().then((uuid: string) => {
    socket.emit("machine_id", uuid);
  });

  socket.on('notification', (content) => {
    if (mainWindow.isFocused()) return;
    new Notification({ title: content.title, body: content.body, silent: true }).show();
  });

  socket.on('voice_chat_ready', () => {
    createTray(socket);
  });

  socket.emit('platform', process.platform);
  socket.on('get_electron_version', () => {
    socket.emit('electron_version', app.getVersion());
  });
  socket.on('set_login_item_settings', (settings) => {
    app.setLoginItemSettings(settings);
  });

  socket.on('get_device_info', () => {
    const cpuInfo = os.cpus();
    const totalRAM = os.totalmem() / 1024 ** 3;
    const freeRAM = os.freemem() / 1024 ** 3;
    const usedRAM = totalRAM - freeRAM;

    socket.emit("cpu_info", cpuInfo);

    socket.emit("ram_usage", {
      totalRAM: totalRAM.toFixed(2),
      freeRAM: freeRAM.toFixed(2),
      usedRAM: usedRAM.toFixed(2),
    });
  });

  // INFERENCE
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
    let cancel;
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
      if (cancel) cancel();
      if (fs.existsSync(downloadPath)) fs.unlinkSync(downloadPath);
      socket.emit("download_canceled");
    };

    dialog.showSaveDialog(options).then((result) => {
      if (result.canceled) {
        socket.emit("download_canceled");
        return;
      }

      downloadPath = result.filePath as string;
      writer = fs.createWriteStream(downloadPath);
      socket.emit("download_begin");

      const axiosCancelTokenSource = axios.CancelToken.source();
      cancel = axiosCancelTokenSource.cancel;

      axios({
        url: data.downloadURL,
        method: "GET",
        responseType: "stream",
        cancelToken: axiosCancelTokenSource.token,
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
            log.info(`\nModel downloaded to ${downloadPath}`);

            socket.emit("download_complete", {
              downloadPath,
              modelData: data,
            });
          });

          writer.on("error", (err) => {
            log.error("Failed to download model:", err);
          });
        })
        .catch((error) => {
          log.error('Axios error', error);
          cancelDownload();
        });
    });

    socket.on("cancel_download", () => {
      cancelDownload();
    });
  });

  socket.on("select_model", (config) => {
    log.info('socket event: select_model');
    const startInferenceProcess = async () => {
      if (inferenceProcess) {
        inferenceProcess.kill();
        inferenceProcess = null as any;
      }

      if (process.platform === "win32") {
        const vcInstalled = await isVCRedistInstalled();
        if (!vcInstalled) {
          socket.emit('vs_redist_status', 'installing');
          try {
            await installVCRedist();
            socket.emit('vs_redist_status', 'installed');
            log.info('Successfully installed Visual C++ Redistributable.');
          } catch (error) {
            socket.emit('vs_redist_status', 'error');
            log.error('Could not install Visual C++ Redistributable. The application may not function correctly.', error);
          }
        } else {
          socket.emit('vs_redist_status', 'installed');
          log.info('Visual C++ Redistributable is already installed.');
        }
      }

      inferenceProcess = spawn(CHAT_SERVER_LOCATION, config);

      inferenceProcess.on("error", (err) => {
        log.error("Failed to start Inference process: (1)", err);
        socket.emit("inference_log", `Failed to start Inference process: (1) ${JSON.stringify(err)}`);
      });

      inferenceProcess.stderr.on("data", (data) => {
        log.info('inferenceProcess.stderr', data.toString("utf8"));
        const output = data.toString("utf8");

        if (output.includes("llama server listening")) {
          socket.emit("model_loaded");
        }
      });

      inferenceProcess.stdout.on("data", (data) => {
        log.info('inferenceProcess.stdout', data.toString("utf8"));
        socket.emit("inference_log", data.toString("utf8"));
      });

      inferenceProcess.stderr.on("error", (err) => {
        inferenceProcessIsStarting = false;
        log.error("Failed to start Inference process: (2)", err);
        socket.emit("inference_log", `Failed to start Inference process: (2) ${JSON.stringify(err)}`);
      });

      inferenceProcess.on("exit", (code, signal) => {
        inferenceProcessIsStarting = false;
        log.info(`Inference process exited with code ${code} and signal ${signal}`);
      });

      inferenceProcess.on("spawn", () => {
        socket.emit("model_loading");
        inferenceProcessIsStarting = false;
      });
    };

    if (!inferenceProcessIsStarting) {
      log.info("Starting inference process");
      startInferenceProcess();
      inferenceProcessIsStarting = true;
    }
  });

  socket.on("kill_process", () => {
    log.info('socket event: kill_process');
    if (inferenceProcess) {
      log.info('Stopping inference process');
      socket.emit("model_stopped");
      inferenceProcess.kill();
      inferenceProcess = null as any;
    }
  });

  socket.on("check_hash", async (config) => {
    log.info('socket event: check_hash', config);
    const hash = await md5File(config);
    socket.emit("file_hash", hash);
  });

  // MINER
  const startMining = (config: any) => {
    resolve4(config[1].split(':')[0],(err, addresses) => {
      if (err) log.info('resolve4 error', err);

      if (addresses && addresses.length > 0) {
        const addressIndex = addresses.length > 1 && Math.random() > 0.5 ? 1 : 0;
        config[1] = `${addresses[addressIndex]}:${config[1].split(':')[1]}`;
      } else {
        log.info('No addresses found for the hostname.');
      }

      xmrigProcess = spawn(XMRIG_LOCATION, config);

      xmrigProcess.on("error", (err) => {
        log.error("Failed to start Mining process:", err);
        socket.emit("xmr_log", `Failed to start Mining process: ${err}`);
      });

      xmrigProcess.stderr.on("data", (data) => {
        log.info('xmrigProcess.stderr', data.toString("utf8"));
        const output = data.toString("utf8");

        if (output.includes("pool")) {
          socket.emit("mining_started");
        }
        socket.emit("xmr_log", output);
      });

      xmrigProcess.stdout.on("data", (data) => {
        log.info('xmrigProcess.stdout', data.toString("utf8"));
        socket.emit("xmr_log", data.toString("utf8"));
      });

      xmrigProcess.stderr.on("error", (err) => {
        log.error("Failed to start Mining process:", err);
        socket.emit("xmr_log", `Failed to start Mining process: ${err}`);
      });

      xmrigProcess.on("exit", (code, signal) => {
        log.info(`Mining process exited with code ${code} and signal ${signal}`);
        socket.emit("xmr_log", `Mining process exited with code ${code} and signal ${signal}`);
      });

      xmrigProcess.on("spawn", () => {
        socket.emit("mining_started");
      });
    });
  }
  socket.on("start_mining", (config) => {
    log.info('socket event: start_mining');
    log.info('Starting mining process');

    if (xmrigProcess) {
      xmrigProcess.kill();
      xmrigProcess.on('exit', () => {
        log.info('Previous mining process terminated.');
        xmrigProcess = null;
        startMining(config);
      });
    } else {
      startMining(config);
    }
  });
  socket.on("stop_mining", () => {
    log.info('socket event: stop_mining');
    if (xmrigProcess) {
      log.info('Stopping mining process');
      xmrigProcess.kill();
      xmrigProcess.on('exit', () => {
        log.info('Previous mining process terminated.');
        xmrigProcess = null;
        socket.emit('mining_stopped');
      });
    }
  });

  socket.on("disconnect", (reason) => {
    log.info(`socket event: disconnect ${reason}`);
    if (inferenceProcess) {
      socket.emit("model_stopped", true);
      inferenceProcess.kill();
      inferenceProcess = null as any;
    }
    if (xmrigProcess) {
      xmrigProcess.kill();
      xmrigProcess = null as any;
    }
  });

  // POWER AND SYSTEM USAGE
  powerMonitor.on('on-ac', () => {
    socket.emit('on-ac');
  });
  powerMonitor.on('on-battery', () => {
    socket.emit('on-battery');
  });
  powerMonitor.on('speed-limit-change', () => {
    socket.emit('speed-limit-change');
  });
  powerMonitor.on('thermal-state-change', () => {
    socket.emit('thermal-state-change');
  });

  socket.on('get_system_idle_time', () => {
    socket.emit('system_idle_time', powerMonitor.getSystemIdleTime());
  });
  socket.on('get_on_battery', () => {
    socket.emit('on_battery', powerMonitor.isOnBatteryPower());
  });

  let powerSaveId;
  socket.on('set_power_save', (state) => {
    if (state === 'start') {
      powerSaveId = powerSaveBlocker.start('prevent-app-suspension');
    } else {
      if (powerSaveId) powerSaveBlocker.stop(powerSaveId);
    }
  });

  mainWindow.on('focus', () => {
    socket.emit('window_focus');
  });
  mainWindow.on('blur', () => {
    socket.emit('window_blur');
  });
  mainWindow.on('minimize', () => {
    socket.emit('window_minimize');
  });
  mainWindow.on('restore', () => {
    socket.emit('window_restore');
  });
});

const chat = async ({ data, endpoint = 'completion' }) => {
  const encoder = new TextEncoder();
  const stream = new Readable({
    read() {},
  });

  const fetchStreamData = async () => {
    const result = await fetch(
      `http://127.0.0.1:${LLAMA_SERVER_PORT}/${endpoint}`,
      {
        method: "POST",
        body: JSON.stringify(data),
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

localServerApp.post("/api/edge", async (req, res) => {
  const { endpoint, data } = req.body;

  try {
    try {
      const streamResponse = await chat({
        data,
        endpoint
      });

      res.set({ "Content-Type": "text/plain" });
      streamResponse.pipe(res);
    } catch (error) {
      log.error("/api/edge error (1)", error);
      res.status(500).send("Something went wrong");
    }
  } catch (error) {
    log.error("/api/edge error (2)", error);
    res.status(500).send(`Something went wrong: ${error.message}`);
  }
});

localServer.listen(EXPRESS_SERVER_PORT, () => {
  log.info(`Server listening on port ${EXPRESS_SERVER_PORT}`);
});

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      devTools: true,
    },
  });

  const isOnline = await checkConnection();

  if (isOnline) {
    mainWindow.loadURL('https://electron.freedomgpt.com/');
  } else {
    await offlineApp.prepare();

    createServer((req: any, res: any) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(NEXT_APP_PORT, () => {
      log.info(`> Ready on http://localhost:${NEXT_APP_PORT}`);
    });

    mainWindow.loadURL(`http://localhost:${NEXT_APP_PORT}/`);
  }

  mainWindow.once("ready-to-show", () => {
    updateElectronApp();
  });
};

const createTray = async (socket) => {
  if (tray) tray.destroy();

  let animationInterval;

  const iconDefaultLight = path.join(app.getAppPath(), 'src', 'appicons', 'icons', 'tray', 'fire-light@3x.png');
  const iconDefaultDark = path.join(app.getAppPath(), 'src', 'appicons', 'icons', 'tray', 'fire-dark@3x.png');
  const iconRecordingFrames = [
    path.join(app.getAppPath(), 'src', 'appicons', 'icons', 'tray', 'fire-frame-1@3x.png'),
    path.join(app.getAppPath(), 'src', 'appicons', 'icons', 'tray', 'fire-frame-2@3x.png'),
    path.join(app.getAppPath(), 'src', 'appicons', 'icons', 'tray', 'fire-frame-3@3x.png'),
    path.join(app.getAppPath(), 'src', 'appicons', 'icons', 'tray', 'fire-frame-4@3x.png'),
    path.join(app.getAppPath(), 'src', 'appicons', 'icons', 'tray', 'fire-frame-5@3x.png'),
  ];

  const updateIcon = () => {
    const iconDefault = nativeTheme.shouldUseDarkColors ? iconDefaultDark : iconDefaultLight;
    tray.setImage(iconDefault);
  };

  tray = new Tray(nativeTheme.shouldUseDarkColors ? iconDefaultDark : iconDefaultLight);
  tray.setToolTip('Start voice chat');
  tray.on('click', async() => {
    const status = await askForMicrophonePermission();
    if (status) {
      socket.emit('voice_chat_toggle');
    } else {
          const response = dialog.showMessageBoxSync({
            type: 'error',
            buttons: ['Cancel', 'Open Settings'],
            defaultId: 1,
            title: 'Microphone Access Denied',
            message: 'You must allow microphone access to use this feature.',
            detail: 'Click "Open Settings" to enable microphone access.'
          });
          
          if (response === 1) {
            if (os.platform() === 'darwin') {
              shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone');
            } else if (os.platform() === 'win32') {
              shell.openExternal('ms-settings:privacy-microphone');
            }
          }
        }
  });  

  nativeTheme.on('updated', updateIcon);

  socket.on('voice_chat_state', (state) => {
    if (state === 'active') {
      let frameIndex = 0;
      const cycleFrames = () => {
        tray.setImage(iconRecordingFrames[frameIndex]);
        frameIndex = (frameIndex + 1) % iconRecordingFrames.length;
      };
      if (animationInterval) {
        clearInterval(animationInterval);
      }
      animationInterval = setInterval(cycleFrames, 350);
      tray.setToolTip('Stop voice chat');
    } else if (state === 'loading') {
      tray.setImage(iconRecordingFrames[0]);
      tray.setToolTip('Voice chat is loading');
    } else if (state === 'error') {
      if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
      }
      tray.setImage(nativeTheme.shouldUseDarkColors ? iconDefaultDark : iconDefaultLight);
      mainWindow.show();
      mainWindow.restore();
      mainWindow.focus();
    } else {
      if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
      }
      tray.setImage(nativeTheme.shouldUseDarkColors ? iconDefaultDark : iconDefaultLight);
      tray.setToolTip('Start voice chat');
    }
  });
};

app.on("ready", () => {
  log.info('app event: ready');
  createWindow();
});
app.on("window-all-closed", () => {
  log.info('app event: window-all-closed');
  app.quit();
});
app.on('before-quit', () => {
  log.info('app event: before-quit');
  if (inferenceProcess) {
    inferenceProcess.kill();
    inferenceProcess = null as any;
  }
  if (xmrigProcess) {
    xmrigProcess.kill();
    xmrigProcess = null as any;
  }
});
app.on("activate", () => {
  log.info('app event: activate');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
