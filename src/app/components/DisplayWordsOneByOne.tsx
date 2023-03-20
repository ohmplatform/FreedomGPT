import { useEffect, useState } from "react";
import { useMessageFetching } from "../context/MessageFetch";

function DisplayWordsOneByOne({ words }: { words: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const {
    setMessageFetching,
    messageFetching,
    setDisableinput,
    setFetchedMessages,
  } = useMessageFetching();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!messageFetching) {
        return;
      }

      setCurrentIndex((prevIndex) => prevIndex + 1);
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
    <p>
      {words.slice(0, currentIndex).join(" ")}

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
    </p>
  );
}

export default DisplayWordsOneByOne;
