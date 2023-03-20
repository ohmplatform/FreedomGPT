import React, { FC } from "react";

interface ErrorProps {
  err: Error;
}

const Error: FC<ErrorProps> = ({ err }) => {
  return (
    <div
      style={{
        color: "red",
      }}
    >
      An error occurred - "{err.message}". Refresh the page and try again later.
    </div>
  );
};

export default Error;
