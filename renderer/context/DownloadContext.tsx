import React, { createContext, useState } from "react";

export const DownloadProgressContext = createContext<{
  downloadProgress: {
    percentage: number;
    downloadedBytes: number;
    contentLength: number;
    selectedModel: string;
  };
  setDownloadProgress: React.Dispatch<
    React.SetStateAction<{
      percentage: number;
      downloadedBytes: number;
      contentLength: number;
      selectedModel: string;
    }>
  >;
  downloadStarted: {
    started: boolean;
    selectedModel: string;
  };
  setDownloadStarted: React.Dispatch<
    React.SetStateAction<{
      started: boolean;
      selectedModel: string;
    }>
  >;
}>({
  downloadProgress: {
    percentage: 0,
    downloadedBytes: 0,
    contentLength: 0,
    selectedModel: "",
  },
  setDownloadProgress: () => {},
  downloadStarted: {
    started: false,
    selectedModel: "",
  },
  setDownloadStarted: () => {},
});

const DownloadProgressProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [downloadProgress, setDownloadProgress] = useState({
    percentage: 0,
    downloadedBytes: 0,
    contentLength: 0,
    selectedModel: "",
  });
  const [downloadStarted, setDownloadStarted] = useState({
    started: false,
    selectedModel: "",
  });

  return (
    <DownloadProgressContext.Provider
      value={{
        downloadProgress,
        setDownloadProgress,
        downloadStarted,
        setDownloadStarted,
      }}
    >
      {children}
    </DownloadProgressContext.Provider>
  );
};
export default DownloadProgressProvider;
