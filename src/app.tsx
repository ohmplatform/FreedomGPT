import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import MessageFetchProvider from "./app/context/MessageFetch";
import ModelProvider from "./app/context/ModelSelection";
import { io } from "socket.io-client";

const socket = io("http://localhost:8889");

function render() {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <MessageFetchProvider>
        <ModelProvider socket={socket}>
          <App socket={socket} />
        </ModelProvider>
      </MessageFetchProvider>
    </React.StrictMode>
  );
}

render();
