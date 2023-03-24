import React, { useState } from "react";
import { BOTTOMTEXT } from "../constants/constants";
import { useMessageFetching } from "../context/MessageFetch";
import { send } from "./Icons";

type InputProps = {
  askQuestion: (msg: string) => void;
  input: string;
  setInput: (value: string) => void;
  inputRef: React.RefObject<HTMLDivElement>;
  socket: any;
};

export default function Input({
  askQuestion,
  input,
  setInput,
  inputRef,
  socket,
}: InputProps) {
  const {
    messageFetching,
    setDisableinput,
    disableinput,
    stopFetching,
    setMessageFetching,
  } = useMessageFetching();

  function handleInputSubmit() {
    setDisableinput(true);
    setMessageFetching(true);
    if (input == "") return;
    askQuestion(input);
    setInput("");
    if (inputRef.current) {
      inputRef.current.innerText = "";
    }
  }

  const onKeyDown = (e: any) => {
    // if shift and enter are pressed together then add a new line if enter is pressed then submit the message
    if (e.key == "Enter" && !e.shiftKey && !messageFetching) {
      e.preventDefault();
      handleInputSubmit();
    }
  };

  return (
    <>
      <div
        className="input_wrapper"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "fixed",
          width: "50%",
          paddingBottom: "10px",
          bottom: 0,
        }}
      >
        <div
          className="input_box"
          style={{
            width: "100%",
            backgroundColor: "#40414f",
            borderRadius: "7px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            paddingLeft: "5px",
            padding: "10px 5px",
            position: "relative",
          }}
        >
          <div
            ref={inputRef}
            style={{
              width: "97%",
              minHeight: 26,
              outline: "none",
              border: "none",
              backgroundColor: "#40414f",
              color: "white",
              paddingLeft: "8px",
              fontSize: "16px",
              bottom: 0,
              maxHeight: 150,
              overflowY: "auto",
              paddingRight: "30px",
            }}
            contentEditable={!disableinput}
            onInput={(e) => {
              setInput(e.currentTarget.innerText);
            }}
            onKeyDownCapture={(e) => {
              onKeyDown(e);
            }}
          />

          {disableinput ? (
            <div
              style={{
                position: "absolute",
                right: "10px",
                bottom: "5px",
                width: "35px",
                height: "35px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  border: "2px solid #fff",
                  borderRadius: "50%",
                  borderTopColor: "transparent",
                  animation: "spin 1s linear infinite",
                }}
              ></div>
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  handleInputSubmit();
                }}
                style={{
                  marginRight: "20px",
                  backgroundColor: "transparent",
                  outline: "none",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  padding: "5px",
                  position: "absolute",
                  bottom: "5px",
                  right: "0px",
                  borderRadius: "15%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "35px",
                  height: "35px",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#000";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {send}
              </button>
            </>
          )}
        </div>
        <p
          style={{
            fontSize: "12.6px",
            textAlign: "center",
            marginTop: "19px",
            color: "rgb(185 185 185)",
            maxWidth: "85%",
          }}
        >
          {BOTTOMTEXT}
        </p>
      </div>

      {messageFetching && (
        <button
          onClick={() => {
            stopFetching(socket);
          }}
          style={{
            position: "absolute",
            bottom: "18vh",
            height: "35px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "transparent",
            borderRadius: "5px",
            borderWidth: "2px",
            borderColor: "white",
            borderStyle: "solid",
            color: "white",
            cursor: "pointer",
            padding: "5px",
            left: "50%",
            transform: "translateX(-50%)",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#000";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "white";
          }}
        >
          Stop Responding
        </button>
      )}
    </>
  );
}
