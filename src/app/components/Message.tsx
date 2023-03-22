import { MessageType } from "../types/types";
import DisplayWordsOneByOne from "./DisplayWordsOneByOne";

export default function Message({ user, message, id }: MessageType) {
  const trimmedMessage = message.trim().split(" ");

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
          {user
            ? message.trim()
            : // <DisplayWordsOneByOne words={trimmedMessage} id={id} />
              message.trim()}
        </div>
      </div>
    </div>
  );
}
