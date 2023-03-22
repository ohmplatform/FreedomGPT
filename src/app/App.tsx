import Main from "./screens/Main";

const App = () => {
  return <Main />;
};

export default App;

// import { useEffect, useState } from "react";
// import io from "socket.io-client";

// const socket = io("http://localhost:3001");

// function App() {
//   const [message, setMessage] = useState("");
//   const [response, setResponse] = useState("");

//   useEffect(() => {
//     socket.on("response", (data) => {
//       const result = data.output;
//       const justText = result.replace(
//         /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
//         ""
//       );
//       setResponse((prevResponse) => prevResponse + justText);
//     });

//     return () => {
//       socket.off("response");
//     };
//   }, []);

//   const sendMessage = () => {
//     setResponse("");
//     setMessage("");
//     socket.emit("message", message);
//   };

//   return (
//     <div>
//       <input value={message} onChange={(e) => setMessage(e.target.value)} />
//       <button onClick={sendMessage}>Send</button>
//       <p>{response}</p>
//     </div>
//   );
// }

// export default App;
