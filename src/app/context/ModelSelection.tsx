import React, { createContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";

export const ModelContext = createContext({
  selectedModel: "",
  modelLoading: false,
  modelLoaded: false,
  ramUsage: {
    totalRAM: 0,
    freeRAM: 0,
    usedRAM: 0,
  },
  diskUsage: {
    totalDisk: 0,
    freeDisk: 0,
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setSelectedModel: (model: string) => {},

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setModelLoading: (loading: boolean) => {},

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setModelLoaded: (loaded: boolean) => {},

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setRamUsage: (usage: any) => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDiskUsage: (usage: any) => {},
});

export const useModel = () => React.useContext(ModelContext);

const ModelProvider = ({
  children,
  socket,
}: {
  children: React.ReactNode;
  socket: Socket;
}) => {
  const [selectedModel, setSelectedModel] = useState("");
  const [modelLoading, setModelLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [ramUsage, setRamUsage] = useState({
    totalRAM: 0,
    freeRAM: 0,
    usedRAM: 0,
  });
  const [diskUsage, setDiskUsage] = useState({
    totalDisk: 0,
    freeDisk: 0,
  });

  useEffect(() => {
    socket.on("selected_model", (model) => {
      setSelectedModel(model);
    });
  }, []);

  useEffect(() => {
    socket.on("model_loading", (loading) => {
      setModelLoading(loading);
    });

    socket.on("model_loaded", (loaded) => {
      setModelLoaded(loaded);
    });
  }, []);

  useEffect(() => {
    socket.on("ram_usage", (usage) => {
      setRamUsage(usage);
    });

    socket.on("disk_usage", (usage) => {
      setDiskUsage(usage);
    });
  }, []);

  return (
    <ModelContext.Provider
      value={{
        selectedModel,
        modelLoading,
        modelLoaded,
        ramUsage,
        diskUsage,
        setSelectedModel,
        setModelLoading,
        setModelLoaded,
        setRamUsage,
        setDiskUsage,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};

export default ModelProvider;
