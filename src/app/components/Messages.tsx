import { useEffect, useRef } from "react";
import { MessageType } from "../types/types";
import Message from "./Message";

type MessagesProps = {
  messages: MessageType[];
};

export default function Messages({ messages }: MessagesProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(updateScroll, [messages]);

  function updateScroll() {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div
      className="msg_cont"
      style={{
        width: "100%",
        margin: "auto",
        marginTop: "3.5vh",
        overflowY: "scroll",
        paddingBottom: "22vh",
      }}
    >
      <>
        {messages.map((message, index) => {
          return (
            <div ref={scrollRef} key={index}>
              <Message message={message} key={message.id} />
            </div>
          );
        })}
      </>
    </div>
  );
}
