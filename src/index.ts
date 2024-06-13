import { BrowserWindow, app, dialog, powerMonitor, powerSaveBlocker, Tray, Notification, systemPreferences, shell, session } from 'electron';
import updateElectronApp from 'update-electron-app';
import log from 'electron-log/main';
import { LOCAL_SERVER_PORT, LLAMA_SERVER_PORT, OFFLINE_APP_PORT } from './ports';
import axios from 'axios';
import { spawn, exec } from 'child_process';
import cors from 'cors';
import dns, { resolve, resolve4 } from 'dns';
import isDev from 'electron-is-dev';
import express from 'express';
import fs from 'fs';
import http, { createServer } from 'http';
import md5File from 'md5-file';
import next from 'next';
import os from 'os';
import { Server } from 'socket.io';
import { parse } from 'url';
import machineUuid from 'machine-uuid';
import util from 'util';
import path from 'path';

export let inferenceProcess: import('child_process').ChildProcessWithoutNullStreams =
  null as any;
export let xmrigProcess: import('child_process').ChildProcessWithoutNullStreams =
  null as any;

dns.setServers(['8.8.8.8', '1.1.1.1']);
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
if (require('electron-squirrel-startup')) app.quit();

let mainWindow;
let tray = null;

const localServerApp = express();
localServerApp.use(express.json());
localServerApp.use(cors());
const localServer = http.createServer(localServerApp);
const io = new Server(localServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const deviceisWindows = process.platform === 'win32';

const DEFAULT_MODEL_LOCATION = `${app.getPath('documents')}/FreedomGPT`;

const CHAT_SERVER_LOCATION = app.isPackaged
  ? deviceisWindows
    ? process.resourcesPath + '/models/windows/llama/server'
    : process.resourcesPath + '/models/mac/llama/server'
  : deviceisWindows
  ? process.cwd() + '/llama.cpp/bin/Release/server'
  : process.cwd() + '/llama.cpp/server';

let inferenceProcessIsStarting = false;

const XMRIG_LOCATION = app.isPackaged
  ? deviceisWindows
    ? process.resourcesPath + '/miner/windows/fgptminer.exe'
    : process.resourcesPath + '/miner/mac/fgptminer'
  : deviceisWindows
  ? process.cwd() + '/miner/windows/fgptminer.exe'
  : process.cwd() + '/miner/mac/fgptminer'

const checkConnection = (): Promise<boolean> => {
  return new Promise<boolean>((innerResolve) => {
    resolve('electron.freedomgpt.com', (err) => {
      innerResolve(!err);
    });
  });
};

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

  if (await checkConnection()) {
    mainWindow.loadURL('https://electron.freedomgpt.com/');
    // mainWindow.loadURL('http://localhost:3001');
  } else {
    const offlineApp = next({
      dev: isDev,
      dir: app.getAppPath() + '/renderer',
    });
    const handle = offlineApp.getRequestHandler();

    await offlineApp.prepare();

    createServer((req: any, res: any) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(OFFLINE_APP_PORT, () => {
      log.info(`> Ready on http://localhost:${OFFLINE_APP_PORT}`);
    });

    mainWindow.loadURL(`http://localhost:${OFFLINE_APP_PORT}/`);
  }

  mainWindow.once('ready-to-show', () => {
    updateElectronApp();
  });
};

const setCORS = () => {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };

    if (details.url.startsWith('http://127.0.0.1')) {
      responseHeaders['Access-Control-Allow-Origin'] = ['*'];
    }

    callback({ responseHeaders });
  });
};

const createTray = async (socket) => {
  if (tray) tray.destroy();

  let animationInterval;
  const iconDefault = path.join(app.getAppPath(), 'src', 'appicons', 'icons', 'tray', 'fireTemplate@3x.png');
  const iconRecordingFrames = [
    path.join(app.getAppPath(), 'src', 'appicons', 'icons', 'tray', 'fire-frame-1@3x.png'),
    path.join(app.getAppPath(), 'src', 'appicons', 'icons', 'tray', 'fire-frame-2@3x.png'),
    path.join(app.getAppPath(), 'src', 'appicons', 'icons', 'tray', 'fire-frame-3@3x.png'),
    path.join(app.getAppPath(), 'src', 'appicons', 'icons', 'tray', 'fire-frame-4@3x.png'),
    path.join(app.getAppPath(), 'src', 'appicons', 'icons', 'tray', 'fire-frame-5@3x.png'),
  ];

  tray = new Tray(iconDefault);
  tray.setToolTip('Start voice chat');
  tray.on('click', async() => {
    socket.emit('voice_chat_toggle');
  });

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
      tray.setImage(iconDefault);
      mainWindow.show();
      mainWindow.restore();
      mainWindow.focus();
    } else {
      if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
      }
      tray.setImage(iconDefault);
      tray.setToolTip('Start voice chat');
    }
  });
};

const isVCRedistInstalled = async (): Promise<boolean> => {
  const execAsync = util.promisify(exec);
  const powershellCommand = `Get-WmiObject Win32_Product | Where-Object { $_.Name -like '*Visual C++*' }`;

  try {
    const { stdout } = await execAsync(`powershell -command "${powershellCommand.replace(/"/g, '\\"')}"`);
    return stdout.includes('Visual C++');
  } catch (error) {
    log.error('Visual C++ Redistributable check failed. Error: ', error.message);
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

const askForMediaAccess = async () => {
  try {
    if (process.platform !== 'darwin') {
      return true;
    }

    const status = systemPreferences.getMediaAccessStatus('microphone');
    log.info('Current microphone access status:', status);

    if (status === 'not-determined' || status === 'unknown') {
      const success = await systemPreferences.askForMediaAccess('microphone');
      log.info('Result of microphone access:', success ? 'granted' : 'denied');
      return success;
    }

    if (status === 'granted') return true;
  } catch (error) {
    log.error('Could not get microphone permission:', error.message);
  }

  return false;
};

app.on('ready', () => {
  log.info('app event: ready');
  createWindow();
  setCORS();
});
app.on('activate', () => {
  log.info('app event: activate');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
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

localServer.listen(LOCAL_SERVER_PORT, () => {
  log.info(`Server listening on port ${LOCAL_SERVER_PORT}`);
});

io.on('connection', (socket) => {
  log.info('socket connected');

  socket.emit('LLAMA_SERVER_PORT', LLAMA_SERVER_PORT);
  machineUuid().then((uuid: string) => {
    socket.emit('machine_id', uuid);
  });

  socket.on('notification', (content) => {
    if (mainWindow.isFocused()) return;
    new Notification({ title: content.title, body: content.body, silent: true }).show();
  });

  socket.on('get_mic_permission', async () => {
    const hasPermission = await askForMediaAccess();

    if (hasPermission) {
      socket.emit('has_mic_permission', true);
    } else {
      socket.emit('has_mic_permission', false);

      const response = dialog.showMessageBoxSync({
        type: 'error',
        buttons: ['Cancel', 'Open Settings'],
        defaultId: 1,
        title: 'Microphone Access Denied',
        message: 'Microphone access must be enabled to use this feature.',
        detail: `Click 'Open Settings' to enable microphone access.`,
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

  socket.on('voice_chat_ready', () => {
    createTray(socket);
  });
  socket.on('voice_chat_quit', () => {
    if (tray) tray.destroy();
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

    socket.emit('cpu_info', cpuInfo);

    socket.emit('ram_usage', {
      totalRAM: totalRAM.toFixed(2),
      freeRAM: freeRAM.toFixed(2),
      usedRAM: usedRAM.toFixed(2),
    });
  });

  // INFERENCE
  socket.on('choose_model', (data) => {
    const options = {
      defaultPath: DEFAULT_MODEL_LOCATION,
      buttonLabel: 'Choose',
      filters: [
        {
          name: 'Model',
          extensions: ['gguf'],
        },
      ],
    };

    dialog.showOpenDialog(options).then((result) => {
      if (!result.canceled) {
        const filePath = result.filePaths[0];

        socket.emit('download_complete', {
          downloadPath: filePath,
          modelData: data,
        });
      }
    });
  });

  socket.on('download_model', (data) => {
    let cancel;
    const selectedModel = data.model;
    const fileName = data.downloadURL.split('/').pop();
    const filePath = DEFAULT_MODEL_LOCATION + '/' + fileName;

    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath);
    }

    const options = {
      defaultPath: filePath,
      buttonLabel: 'Download',
    };
    let downloadPath: string = '' as string;
    let writer: fs.WriteStream = null as any;
    let lastPercentage = 0;

    const cancelDownload = () => {
      if (cancel) cancel();
      if (fs.existsSync(downloadPath)) fs.unlinkSync(downloadPath);
      socket.emit('download_canceled');
    };

    dialog.showSaveDialog(options).then((result) => {
      if (result.canceled) {
        socket.emit('download_canceled');
        return;
      }

      downloadPath = result.filePath as string;
      writer = fs.createWriteStream(downloadPath);
      socket.emit('download_begin');

      const axiosCancelTokenSource = axios.CancelToken.source();
      cancel = axiosCancelTokenSource.cancel;

      axios({
        url: data.downloadURL,
        method: 'GET',
        responseType: 'stream',
        cancelToken: axiosCancelTokenSource.token,
      })
        .then((response) => {
          const contentLength = response.headers['content-length'];
          response.data.pipe(writer);

          socket.emit('download_started', {
            contentLength,
            selectedModel,
          });

          let downloadedBytes = 0;

          response.data.on('data', (chunk: any) => {
            downloadedBytes += chunk.length;
            const percentage = Math.floor(
              (downloadedBytes / Number(contentLength)) * 100
            );

            if (percentage > lastPercentage) {
              lastPercentage = percentage;
              socket.emit('download_progress', {
                percentage,
                downloadedBytes,
                contentLength,
                selectedModel,
              });
            }
          });

          writer.on('finish', () => {
            log.info(`\nModel downloaded to ${downloadPath}`);

            socket.emit('download_complete', {
              downloadPath,
              modelData: data,
            });
          });

          writer.on('error', (err) => {
            log.error('Failed to download model:', err);
          });
        })
        .catch((error) => {
          log.error('Axios error', error);
          cancelDownload();
        });
    });

    socket.on('cancel_download', () => {
      cancelDownload();
    });
  });

  socket.on('select_model', (config) => {
    log.info('socket event: select_model');
    const startInferenceProcess = async () => {
      if (inferenceProcess) {
        inferenceProcess.kill();
        inferenceProcess = null as any;
      }

      if (process.platform === 'win32') {
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

      inferenceProcess.on('spawn', () => {
        socket.emit('model_spawned');
        socket.emit('inference_log', 'model_spawned');
        inferenceProcessIsStarting = false;
      });

      inferenceProcess.on('exit', (code, signal) => {
        const msg = `Inference process exited with code ${code} and signal ${signal}`
        log.info(msg);
        socket.emit('inference_log', msg);
        inferenceProcessIsStarting = false;
      });

      inferenceProcess.on('error', (err) => {
        const msg = `Failed to start Inference process (1): ${JSON.stringify(err)}`;
        log.error(msg);
        socket.emit('model_error', msg);
        socket.emit('inference_log', msg);
        inferenceProcessIsStarting = false;
      });
      inferenceProcess.stderr.on('error', (err) => {
        const msg = `Failed to start Inference process (2): ${JSON.stringify(err)}`;
        log.error(msg);
        socket.emit('model_error', msg);
        socket.emit('inference_log', msg);
        inferenceProcessIsStarting = false;
      });

      inferenceProcess.stderr.on('data', (data) => {
        log.info('inferenceProcess.stderr (data)', data.toString('utf8'));
        socket.emit('inference_log', `inferenceProcess.stderr (data): ${data.toString('utf8')}`);
      });

      inferenceProcess.stdout.on('data', (data) => {
        log.info('inferenceProcess.stdout (data)', data.toString('utf8'));
        socket.emit('inference_log', `inferenceProcess.stdout (data) ${data.toString('utf8')}`);
      });
    };

    if (!inferenceProcessIsStarting) {
      log.info('Starting inference process');
      inferenceProcessIsStarting = true;
      startInferenceProcess();
    }
  });

  socket.on('kill_process', () => {
    log.info('socket event: kill_process');
    if (inferenceProcess) {
      log.info('Stopping inference process');
      socket.emit('model_stopped');
      inferenceProcess.kill();
      inferenceProcess = null as any;
    }
  });

  socket.on('check_hash', async (config) => {
    log.info('socket event: check_hash', config);
    const hash = await md5File(config);
    socket.emit('file_hash', hash);
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

      xmrigProcess.on('error', (err) => {
        log.error('Failed to start Mining process:', err);
        socket.emit('xmr_log', `Failed to start Mining process: ${err}`);
      });

      xmrigProcess.stderr.on('data', (data) => {
        log.info('xmrigProcess.stderr', data.toString('utf8'));
        const output = data.toString('utf8');

        if (output.includes('pool')) {
          socket.emit('mining_started');
        }
        socket.emit('xmr_log', output);
      });

      xmrigProcess.stdout.on('data', (data) => {
        log.info('xmrigProcess.stdout', data.toString('utf8'));
        socket.emit('xmr_log', data.toString('utf8'));
      });

      xmrigProcess.stderr.on('error', (err) => {
        log.error('Failed to start Mining process:', err);
        socket.emit('xmr_log', `Failed to start Mining process: ${err}`);
      });

      xmrigProcess.on('exit', (code, signal) => {
        log.info(`Mining process exited with code ${code} and signal ${signal}`);
        socket.emit('xmr_log', `Mining process exited with code ${code} and signal ${signal}`);
        socket.emit('mining_stopped');
      });

      xmrigProcess.on('spawn', () => {
        socket.emit('mining_started');
      });
    });
  }
  socket.on('start_mining', (config) => {
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
  socket.on('stop_mining', () => {
    log.info('socket event: stop_mining');
    if (xmrigProcess) {
      log.info('Stopping mining process');
      xmrigProcess.kill();
    }
  });

  socket.on('disconnect', (reason) => {
    log.info(`socket event: disconnect ${reason}`);
    if (inferenceProcess) {
      socket.emit('model_stopped', true);
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
