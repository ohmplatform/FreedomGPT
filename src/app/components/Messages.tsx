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
        marginTop: "2.5vh",
        overflowY: "scroll",
        paddingBottom: "10vh",
      }}
    >
      <>
        {messages.map((item, index) => {
          return (
            <div ref={scrollRef} key={index}>
              <Message
                user={item.user}
                message={item.message}
                image={item.image}
                id={item.id}
                key={item.id}
              />
            </div>
          );
        })}
      </>
    </div>
  );
}
