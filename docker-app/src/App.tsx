import React from "react";
import Main from "./app/screens/Main";
import MessageFetchProvider from "./app/context/MessageFetch";

const App = () => {
  return (
    <>
      <MessageFetchProvider>
        <Main />
      </MessageFetchProvider>
    </>
  );
};

export default App;
