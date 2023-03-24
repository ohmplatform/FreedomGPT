import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import InitialLoader from "../components/InitialLoader";
import Input from "../components/Input";
import Messages from "../components/Messages";
import { useMessageFetching } from "../context/MessageFetch";
import { MessageType } from "../types/types";

const socket = io("http://localhost:8889");

export default function Main() {
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
    socket.on("response", (data) => {
      const result = data.output;

      const justText = result.replace(
        // eslint-disable-next-line no-control-regex
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        ""
      );

      if (messages.length > 0) {
        setResponse((prevResponse) => prevResponse + justText);

        if (messageFetching) {
          setFetchedMessages(response);

          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          setMessages((prev) => {
            prev[prev.length - 1].message = response;
            return [...prev];
          });
        }

        // console.log(JSON.stringify(response));
      }

      //  if no data is returned console log the message complete
      if (result === "\n>") {
        console.log("message complete");
      }
    });

    socket.on("chatend", () => {
      socket.emit("chatstart");
      setDisableinput(false);
      setMessageFetching(false);
    });

    return () => {
      socket.off("response");
      socket.off("chatend");
    };
  }, [messages]);

  const askQuestion = (message: string) => {
    const senderID = uuidv4();
    const replyID = uuidv4();

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
            socket={socket}
          />
        </div>
      </div>
    </div>
  );
}
