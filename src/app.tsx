import { ThemeProvider, createTheme } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom/client";
import { io } from "socket.io-client";
import App from "./app/App";
import DownloadProgressProvider from "./app/context/DownloadContext";
import MessageFetchProvider from "./app/context/MessageFetch";
import ModelProvider from "./app/context/ModelSelection";

const socket = io("http://localhost:8889");

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function render() {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <ModelProvider socket={socket}>
        <DownloadProgressProvider>
          <MessageFetchProvider>
            <ThemeProvider theme={darkTheme}>
              <App socket={socket} />
            </ThemeProvider>
          </MessageFetchProvider>
        </DownloadProgressProvider>
      </ModelProvider>
    </React.StrictMode>
  );
}

render();
