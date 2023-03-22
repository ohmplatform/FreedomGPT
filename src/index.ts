import { app, BrowserWindow, session } from "electron";
import path from "path";

import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { spawn } from "child_process";

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

const EXPRESSPORT = 3001;
const CHAT_APP_LOCATION = "/Users/jay/Desktop/alp/chat_mac";
/* Make sure to use the actual path to your app, not the relative path ( )
    Donot use ../ or ./
*/
io.on("connection", (socket) => {
  if (!connectedClient) {
    connectedClient = socket;

    console.log("A user connected");

    socket.join("myRoom");

    const program = spawn(CHAT_APP_LOCATION, []);

    socket.on("message", (message) => {
      program.stdin.write(message + "\n");
    });

    // socket.on("close", () => {
    //   program.kill();
    //   console.log("Killed", program.pid);
    //   program = spawn("/Users/jay/Desktop/alp/chat_mac", []);
    //   console.log("start", program.pid);
    // });

    program.stdout.on("data", (data) => {
      let output = data.toString().trim();
      output = output.replace(">", "");
      const response = { result: "success", output: output + " " };
      socket.emit("response", response);
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
  // Customize protocol to handle static resource.
  session.defaultSession.protocol.registerFileProtocol(
    "static",
    (request, callback) => {
      const fileUrl = request.url.replace("static://", "");
      const filePath = path.join(
        app.getAppPath(),
        ".webpack/renderer",
        fileUrl
      );
      callback(filePath);
    }
  );

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

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
