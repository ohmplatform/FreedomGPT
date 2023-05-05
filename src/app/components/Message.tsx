import { useMessageFetching } from "../context/MessageFetch";
import { MessageType } from "../types/types";

const Reply = ({ message, id }: { message: string; id: string }) => {
  const { messageFetching, messages } = useMessageFetching();

  return (
    <div>
      {!messageFetching && messages[messages.length - 1].id === id && (
        <div
          dangerouslySetInnerHTML={{ __html: message }}
          style={{
            whiteSpace: "pre-wrap",
          }}
        />
      )}

      {messages[messages.length - 1].id !== id && (
        <div
          dangerouslySetInnerHTML={{ __html: message }}
          style={{
            whiteSpace: "pre-wrap",
          }}
        />
      )}
      {messageFetching && messages[messages.length - 1].id === id && (
        <p>
          {message}
          <span
            className={`cursor`}
            style={{
              marginLeft: "5px",
            }}
          >
            ||
          </span>
        </p>
      )}
    </div>
  );
};

export default function Message({ message }: { message: MessageType }) {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: !message.user ? "#444654" : "transparent",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: "25px 0",
        borderRadius: "5px",
        marginTop: "10px",
        justifyContent: "center",
      }}
    >
      <div
        className="messages_wrapper"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          width: "100%",
          alignSelf: "center",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            color: "#fff",
            fontWeight: "bold",
            position: "absolute",
            right: "0px",
            backgroundColor: "#000",
            padding: !message.user && "5px 10px",
            marginTop: "-25px",
          }}
        >
          {!message.user && message.model.split("-").join(" ").toUpperCase()}
        </p>
        <div
          style={{
            width: "25px",
            marginLeft: "15px",
            alignItems: "flex-start",
          }}
        >
          {message.user ? (
            <p
              style={{
                fontSize: "40px",
                marginTop: "-15px",
              }}
            >
              🗣️
            </p>
          ) : (
            <p
              style={{
                fontSize: "45px",
                marginTop: "-15px",
              }}
            >
              🗽
            </p>
          )}
        </div>
        <div
          style={{
            marginLeft: "50px",
            marginRight: "15px",
            fontSize: "16px",
            lineHeight: "25px",
            width: "100%",
          }}
        >
          {message.user ? (
            message.message.trim()
          ) : (
            <Reply message={message.message} id={message.id} />
          )}
        </div>
      </div>
    </div>
  );
}
