import React from "react";

const Loader = ({
  size = 50,
  style,
}: {
  size?: number;
  style?: React.CSSProperties;
}) => {
  return (
    <div className="loader">
      <div
        className="spinner"
        style={{
          width: size ? `${size}px` : "50px",
          height: size ? `${size}px` : "50px",
          ...style,
        }}
      ></div>
    </div>
  );
};

export default Loader;
