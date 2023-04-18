import { spawn } from "child_process";
import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";

const expressapp = express();
const server = http.createServer(expressapp);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const EXPRESSPORT = 8889;

let numClients = 0;

expressapp.use(
  "/assets",
  express.static(path.join(process.cwd(), "dist/assets"))
);

expressapp.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "dist/index.html"));
});

io.on("connection", (socket) => {
  if (numClients === 1) {
    console.log("Only one client allowed");
    socket.disconnect();
    return;
  }

  numClients++;

  console.log("Client Connected");
  const CHAT_APP_LOCATION = path.join(process.cwd(), "/chat");
  const FILEPATH = path.join(process.cwd(), "/ggml-alpaca-7b-q4.bin");

  let program = spawn(CHAT_APP_LOCATION, ["-m", FILEPATH]);

  socket.on("chatstart", () => {
    program = spawn(CHAT_APP_LOCATION, ["-m", FILEPATH]);
  });

  program.on("error", (err) => {
    console.error(err);
  });

  socket.on("stopResponding", () => {
    program.kill();
    program = null;
    socket.emit("chatend");
  });

  socket.on("message", (message) => {
    program.stdin.write(message + "\n");

    let closing = "";
    program.stdout.on("data", (data) => {
      let output = data.toString("utf8");

      if (output.includes(">")) {
        closing = closing.concat(">");
      }

      output = output.replace(">", "");

      const response = { result: "success", output: output };
      socket.emit("response", response);

      if (closing.includes(">>")) {
        program.kill();
        program = null;
        socket.emit("chatend");
      }
    });
  });

  socket.on("disconnect", () => {
    numClients--;
    program.kill();
    program = null;
  });
});

server.listen(EXPRESSPORT, () => {
  console.log(`Server listening on port ${EXPRESSPORT}`);
});

export default expressapp;
