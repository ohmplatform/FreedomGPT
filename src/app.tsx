// import * as ReactDOM from "react-dom";
// import App from "./app/App";

// function render() {
//   ReactDOM.render(<App />, document.getElementById("root"));
// }

// render();
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import MessageFetchProvider from "./app/context/MessageFetch";

function render() {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <MessageFetchProvider>
        <App />
      </MessageFetchProvider>
    </React.StrictMode>
  );
}

// ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
//     <React.StrictMode>
//       <MessageFetchProvider>
//         <App />
//       </MessageFetchProvider>
//     </React.StrictMode>
//   );

render();
