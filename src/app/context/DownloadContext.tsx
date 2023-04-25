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
}>({
  downloadProgress: {
    percentage: 0,
    downloadedBytes: 0,
    contentLength: 0,
    selectedModel: "",
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDownloadProgress: () => {},
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

  return (
    <DownloadProgressContext.Provider
      value={{
        downloadProgress,
        setDownloadProgress,
      }}
    >
      {children}
    </DownloadProgressContext.Provider>
  );
};
export default DownloadProgressProvider;
