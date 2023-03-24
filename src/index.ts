import axios from "axios";
import { spawn } from "child_process";
import cors from "cors";
import { app, BrowserWindow } from "electron";
import express from "express";
import fs from "fs";
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

const EXPRESSPORT = 8889;
const CHAT_APP_LOCATION = app.getAppPath() + "/src/models/chat";
console.log("ChatAPp" + CHAT_APP_LOCATION);
const homeDir = app.getPath("home");
console.log("Home" + homeDir);
const MODEL_LOCATION = homeDir + "/FreedomGPT";
console.log("MODEL_LOCATION" + MODEL_LOCATION);
const FILEPATH = MODEL_LOCATION + "/ggml-alpaca-7b-q4.bin";
console.log("FILEPATH" + FILEPATH);
const MODEL_URL =
  "https://huggingface.co/Sosaka/Alpaca-native-4bit-ggml/resolve/main/ggml-alpaca-7b-q4.bin";
const FILESIZE = 4212727017;

const downloadFile = async (
  url: string,
  dest: string,
  loaderWindow: BrowserWindow
) => {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });
  const totalLength = response.headers["content-length"];
  const writer = fs.createWriteStream(dest);
  response.data.pipe(writer);
  return new Promise<number>((resolve, reject) => {
    writer.on("finish", () => resolve(Number(totalLength)));
    writer.on("error", reject);
    response.data.on("data", () => {
      const downloadedLength = writer.bytesWritten;
      const downloadedFileInMB = (downloadedLength / 1000000).toFixed(2);

      loaderWindow.webContents.executeJavaScript(`
      document.getElementById("downloadedFile").innerText = "${downloadedFileInMB}";
    `);
    });

    response.data.on("error", reject);
  });
};

const createLoaderWindow = (): BrowserWindow => {
  const loaderWindow = new BrowserWindow({
    height: 1080,
    width: 1080,
    alwaysOnTop: true,
  });
  loaderWindow.loadURL(
    `data:text/html,
    <!DOCTYPE html>
<html>
<head>
	<title>Loading...</title>
	<style>
		body {
			background-color: rgb(60, 59, 59);
			margin: 0;
			padding: 0;
			font-family: Arial, sans-serif;
		}
		.loader {
			position: fixed;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			text-align: center;
			color: white;
			z-index: 9999;
		}
		.loader .lds-ring {
			display: inline-block;
			position: relative;
			width: 64px;
			height: 64px;
		}
		.loader .lds-ring div {
			box-sizing: border-box;
			display: block;
			position: absolute;
			width: 51px;
			height: 51px;
			margin: 6px;
			border: 6px solid white;
			border-radius: 50%;
			animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
			border-color: white transparent transparent transparent;
		}
		.loader .lds-ring div:nth-child(1) {
			animation-delay: -0.45s;
		}
		.loader .lds-ring div:nth-child(2) {
			animation-delay: -0.3s;
		}
		.loader .lds-ring div:nth-child(3) {
			animation-delay: -0.15s;
		}
		@keyframes lds-ring {
			0% {
				transform: rotate(0deg);
			}
			100% {
				transform: rotate(360deg);
			}
		}
		.loader p {
			margin-top: 20px;
			font-size: 18px;
      width: 80vw;
		}
		.download-time {
			margin-top: 20px;
			font-size: 16px;
		}
	</style>
</head>
<body>
<div class="loader">
      <p class="checkInternet">
      </p>
    <div class="lds-ring"><div></div><div></div><div></div><div></div></div>
    <p>Please wait while we finalize the installation of your software. This process may take a several minutes depending upon your internet connection, so please refrain from closing this window and disconnecting from the internet.</p>

      <p>
          Downloaded: <span id="downloadedFile">0</span> MB / ${(
            FILESIZE / 1000000
          ).toFixed(2)}MB
      </p>
</div>
</body>
</html>
    `
  );
  return loaderWindow;
};

const checkIfFileExists = async () => {
  if (!fs.existsSync(FILEPATH)) {
    console.log("File does not exist");
    const loaderWindow = createLoaderWindow();
    if (fs.existsSync(MODEL_LOCATION)) {
      fs.rmdirSync(MODEL_LOCATION, { recursive: true });
    }
    fs.mkdirSync(MODEL_LOCATION);
    await downloadFile(MODEL_URL, FILEPATH, loaderWindow)
      .then((res) => {
        console.log(res);
        console.log("Model downloaded successfully.");
        createWindow();
        loaderWindow.close();
      })
      .catch((err) => {
        console.log(err);
        loaderWindow.close();
      });
  } else {
    console.log("File exists, but it is not the correct size");
    const mainFileSize = fs.statSync(FILEPATH).size;
    if (mainFileSize !== FILESIZE) {
      const loaderWindow = createLoaderWindow();
      if (fs.existsSync(MODEL_LOCATION)) {
        fs.rmdirSync(MODEL_LOCATION, { recursive: true });
      }
      fs.mkdirSync(MODEL_LOCATION);
      await downloadFile(MODEL_URL, FILEPATH, loaderWindow)
        .then((res) => {
          console.log(res);
          console.log("Model downloaded successfully.");
          createWindow();
          loaderWindow.close();
        })
        .catch((err) => {
          console.log(err);
          loaderWindow.close();
        });
    } else {
      createWindow();
    }
  }
};

io.on("connection", (socket) => {
  console.log("A user connecteddd");

  let program = spawn(CHAT_APP_LOCATION, ["-m", FILEPATH]);

  socket.on("chatstart", () => {
    program = spawn(CHAT_APP_LOCATION, ["-m", FILEPATH]);
    console.log("S2", program.pid);
  });

  socket.on("stopResponding", () => {
    console.log("E1", program.pid);
    program.kill();
    program = null;
    socket.emit("chatend");
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
    program.kill();
    program = null;
  });
  // } else {
  //   const response = { result: "error", output: "Only one user allowed" };
  //   socket.emit("response", response);
  // }
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
      devTools: false,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  checkIfFileExists();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// app.on("browser-window-focus", function () {
//   globalShortcut.register("CommandOrControl+R", () => {
//     console.log("CommandOrControl+R is pressed: Shortcut Disabled");
//   });
// });

// app.on("browser-window-blur", function () {
//   globalShortcut.unregister("CommandOrControl+R");
// });

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
