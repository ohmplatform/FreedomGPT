import { useMessageFetching } from "../context/MessageFetch";
import { MessageType } from "../types/types";

const Reply = ({ message, id }: { message: string; id: string }) => {
  const { messageFetching, messages } = useMessageFetching();

  const trimmedMessage = message.slice(2);

  return (
    <div>
      {!messageFetching && messages[messages.length - 1].id === id && (
        <div
          dangerouslySetInnerHTML={{ __html: trimmedMessage }}
          style={{
            whiteSpace: "pre-wrap",
          }}
        />
      )}

      {messages[messages.length - 1].id !== id && (
        <div
          dangerouslySetInnerHTML={{ __html: trimmedMessage }}
          style={{
            whiteSpace: "pre-wrap",
          }}
        />
      )}
      {messageFetching && messages[messages.length - 1].id === id && (
        <p>
          {trimmedMessage}
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

export default function Message({ user, message, id }: MessageType) {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: !user ? "#444654" : "transparent",
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
        <div
          style={{
            width: "25px",
            marginLeft: "15px",
            alignItems: "flex-start",
          }}
        >
          {user ? (
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
            fontSize: "15px",
            lineHeight: "25px",
            width: "100%",
          }}
        >
          {user ? message.trim() : <Reply message={message} id={id} />}
        </div>
      </div>
    </div>
  );
}
