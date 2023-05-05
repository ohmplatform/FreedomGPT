import { useEffect, useRef, useState } from "react";

import { v4 as uuidv4 } from "uuid";
import InitialLoader from "../components/InitialLoader";
import Input from "../components/Input";
import Messages from "../components/Messages";
import { useMessageFetching } from "../context/MessageFetch";
import { MessageType } from "../types/types";
import { Socket } from "socket.io-client";
import { useModel } from "../context/ModelSelection";

export default function Main({ socket }: { socket: Socket }) {
  const [input, setInput] = useState<string>("");
  const [response, setResponse] = useState("");
  const {
    setMessageFetching,
    messages,
    setMessages,
    disableinput,
    setDisableinput,
    setFetchedMessages,
    messageFetching,
  } = useMessageFetching();

  const inputRef = useRef<HTMLDivElement>(null);
  const { selectedModel } = useModel();

  function addMessage(msg: MessageType) {
    if (msg.user) {
      setMessages(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (prev) => [...prev, msg]
      );
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      setMessages((prev) => [...prev, msg]);
    }
  }

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef.current, disableinput]);

  useEffect(() => {
    socket.on("response", (result) => {
      setResponse((prevResponse) => prevResponse + result);
      if (messages.length > 0) {
        if (messageFetching) {
          setFetchedMessages(response);

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          setMessages((prev) => {
            prev[prev.length - 1].message = response;
            return [...prev];
          });
        }
      }
    });

    socket.on("chatend", () => {
      setDisableinput(false);
      setMessageFetching(false);
    });

    return () => {
      socket.off("response");
      socket.off("chatend");
    };
  }, [
    messages,
    response,
    messageFetching,
    setFetchedMessages,
    setDisableinput,
  ]);

  const askQuestion = (message: string) => {
    const senderID = uuidv4();
    const replyID = uuidv4();

    setResponse("");

    addMessage({
      message: message,
      user: true,
      id: senderID,
      model: selectedModel,
    });

    socket.emit("message", message);

    addMessage({
      message: "",
      user: false,
      id: replyID,
      model: selectedModel,
    });
  };

  return (
    <div>
      <div
        className="main_container"
        style={{
          width: "100%",
          margin: "auto",
          // height: "100vh",
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
            socket={socket}
          />
        </div>
      </div>
    </div>
  );
}
