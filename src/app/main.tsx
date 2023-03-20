import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import MessageFetchProvider from "./context/MessageFetch";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MessageFetchProvider>
      <App />
    </MessageFetchProvider>
  </React.StrictMode>
);
