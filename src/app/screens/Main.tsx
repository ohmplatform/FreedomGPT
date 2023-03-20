import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import InitialLoader from "../components/InitialLoader";
import Input from "../components/Input";
import Messages from "../components/Messages";
import { useMessageFetching } from "../context/MessageFetch";
import { MessageType } from "../types/types";

const SERVERURL =
  "https://ndwzsld45yxntt4guuji3e7gy40ubbbo.lambda-url.us-east-1.on.aws/";

export default function Main() {
  const [input, setInput] = useState<string>("");
  const { setMessageFetching, messages, setMessages, disableinput } =
    useMessageFetching();

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

  const askQuestion = (message: string) => {
    const senderID = uuidv4();
    const replyID = uuidv4();

    addMessage({
      message: message,
      user: true,
      id: senderID,
    });
    axios
      .post(SERVERURL, {
        query: message,
        max_length: 256,
      })
      .then((res) => {
        setMessageFetching(true);
        //@ts-ignore
        setMessages((prev) => {
          prev[prev.length - 1].message = res.data.response;
          return [...prev];
        });
      })
      .catch((err) => {
        //@ts-ignore
        setMessages((prev) => {
          prev[prev.length - 1].message = "Sorry, I cannot understand you";
          return [...prev];
        });
      });

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
                width: "50%",
                overflowY: "scroll",
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
