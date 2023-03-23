import { spawn } from "child_process";
import cors from "cors";
import { app, BrowserWindow, globalShortcut } from "electron";
import express from "express";
import http from "http";
import { Server } from "socket.io";

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

expressapp.use(cors());

let connectedClient: any = null;

const EXPRESSPORT = 8889;
const CHAT_APP_LOCATION = app.getAppPath() + "/src/models/chat";
const MODEL_LOCATION = app.getAppPath() + "/src/models/ggml-alpaca-7b-q4.bin";

/* Make sure to use the actual path to your app, not the relative path ( )
    Donot use ../ or ./
*/
io.on("connection", (socket) => {
  if (!connectedClient) {
    connectedClient = socket;

    console.log("A user connectedd");

    socket.join("myRoom");

    let program = spawn(CHAT_APP_LOCATION, ["-m", MODEL_LOCATION]);

    socket.on("chatstart", () => {
      program = spawn(CHAT_APP_LOCATION, ["-m", MODEL_LOCATION]);
      console.log("S2", program.pid);
    });

    socket.on("message", (message) => {
      console.log("M1", program.pid);
      program.stdin.write(message + "\n");
      console.log("M2", program.pid);

      program.stdout.on("data", (data) => {
        // const abc = data.toString("utf8");

        let output = data.toString("utf8");
        // console.log(output);
        output = output.replace(">", "");
        const response = { result: "success", output: output };
        socket.emit("response", response);

        if (output.includes("message__end")) {
          console.log("done");
          console.log("E1", program.pid);
          program.kill();
          program = null;
          socket.emit("chatend");
        }
      });
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  } else {
    const response = { result: "error", output: "Only one user allowed" };
    socket.emit("response", response);
  }
});

server.listen(EXPRESSPORT, () =>
  console.log(`Express Server running on port ${EXPRESSPORT}`)
);

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 1080,
    width: 1080,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("browser-window-focus", function () {
  globalShortcut.register("CommandOrControl+R", () => {
    console.log("CommandOrControl+R is pressed: Shortcut Disabled");
  });
});

app.on("browser-window-blur", function () {
  globalShortcut.unregister("CommandOrControl+R");
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
