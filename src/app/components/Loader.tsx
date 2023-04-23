import React from "react";

const Loader = ({ size = 50 }) => {
  return (
    <div className="loader">
      <div
        className="spinner"
        style={{
          width: size ? `${size}px` : "50px",
          height: size ? `${size}px` : "50px",
        }}
      ></div>
    </div>
  );
};

export default Loader;
