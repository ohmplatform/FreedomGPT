import { useEffect, useState } from "react";
import { useMessageFetching } from "../context/MessageFetch";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function DisplayWordsOneByOne({
  words,
  id: messageID,
}: {
  words: any;
  id: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const {
    setMessageFetching,
    messageFetching,
    setDisableinput,
    setFetchedMessages,
    messages,
  } = useMessageFetching();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!messageFetching) {
        return;
      }

      setCurrentIndex((prevIndex) => prevIndex + 1);
      //@ts-ignore
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [currentIndex, messageFetching]);

  useEffect(() => {
    if (words.length > 0 && currentIndex === words.length) {
      setMessageFetching(false);
      setDisableinput(false);
    }
  }, [currentIndex, words.length, setMessageFetching]);

  useEffect(() => {
    // set fetched messages to the visible message till now
    setFetchedMessages(words.slice(0, currentIndex).join(" "));
  }, [currentIndex, words.length, setFetchedMessages]);

  return (
    <div>
      {messageFetching &&
        words.length > 0 &&
        messages[messages.length - 1].id === messageID &&
        words.slice(0, currentIndex).join(" ")}

      {!messageFetching &&
        messages[messages.length - 1].id === messageID &&
        words.length > 0 && (
          <div className="markdown">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              children={JSON.parse(words.join(" ") || "[]").toString()}
            />
          </div>
        )}

      {messages[messages.length - 1].id !== messageID && words.length > 0 && (
        <div className="markdown">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            children={JSON.parse(
              words.slice(0, currentIndex).join(" ") || "[]"
            ).toString()}
          />
        </div>
      )}
      {currentIndex > words.length - 1 ? (
        <></>
      ) : (
        <span
          className={`cursor`}
          style={{
            marginLeft: "5px",
          }}
        >
          ||
        </span>
      )}
    </div>
  );
}

export default DisplayWordsOneByOne;
