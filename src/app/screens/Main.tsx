import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import InitialLoader from "../components/InitialLoader";
import Input from "../components/Input";
import Messages from "../components/Messages";
import { useMessageFetching } from "../context/MessageFetch";
import { MessageType } from "../types/types";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

// const SERVERURL =
//   "https://ndwzsld45yxntt4guuji3e7gy40ubbbo.lambda-url.us-east-1.on.aws/";

export default function Main() {
  const [input, setInput] = useState<string>("");
  const [response, setResponse] = useState("");
  const {
    setMessageFetching,
    messages,
    setMessages,
    disableinput,
    setDisableinput,
  } = useMessageFetching();

  const inputRef = useRef<HTMLDivElement>(null);

  function addMessage(msg: MessageType) {
    if (msg.user) {
      //@ts-ignore
      setMessages((prev) => [...prev, msg]);
    } else {
      //@ts-ignore
      setMessages((prev) => [...prev, msg]);
    }
  }

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef.current, disableinput]);

  useEffect(() => {
    socket.on("response", (data) => {
      const result = data.output;
      const justText = result.replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        ""
      );

      if (messages.length > 0) {
        setMessageFetching(true);

        if (justText != "�" || justText != ":)") {
          setResponse((prevResponse) => prevResponse + justText);
          // //@ts-ignore
          setMessages((prev) => {
            prev[prev.length - 1].message = response;
            return [...prev];
          });
          // socket.emit("close");
        }

        // setResponse((prevResponse) => prevResponse + justText);
      }
    });

    return () => {
      socket.off("response");
      setMessageFetching(false);
      setDisableinput(false);
    };
  }, [messages]);

  const askQuestion = (message: string) => {
    const senderID = uuidv4();
    const replyID = uuidv4();

    // if (messages.length > 0) {
    //   //@ts-ignore
    //   setMessages((prev) => {
    //     prev[prev.length - 1].message = response;
    //     return [...prev];
    //   });

    //   setResponse("");
    // }
    setResponse("");

    addMessage({
      message: message,
      user: true,
      id: senderID,
    });

    socket.emit("message", message);

    addMessage({
      message: "",
      user: false,
      id: replyID,
      replyId: senderID,
    });

    //@ts-ignore
  };

  return (
    <div>
      <div
        className="main_container"
        style={{
          width: "100%",
          margin: "auto",
          height: "100vh",
          position: "relative",
          overflowY: "hidden",
        }}
      >
        {messages.length != 0 ? (
          <div
            style={{
              height: "88%",
              overflowY: "scroll",
              width: "100%",
              justifyContent: "center",
              display: "flex",
            }}
          >
            <div
              style={{
                width: "100%",
                paddingTop: "10px",
              }}
            >
              <Messages messages={messages} />
            </div>
          </div>
        ) : (
          <div
            style={{
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              display: "flex",
            }}
          >
            <div
              style={{
                width: "100%",
              }}
              className="initial_loader_wrapper"
            >
              <InitialLoader setInput={setInput} inputRef={inputRef} />
            </div>
          </div>
        )}

        <div
          style={{
            justifyContent: "center",
            alignItems: "center",
            display: "flex",
          }}
        >
          <Input
            askQuestion={askQuestion}
            input={input}
            setInput={setInput}
            inputRef={inputRef}
          />
        </div>
      </div>
    </div>
  );
}
