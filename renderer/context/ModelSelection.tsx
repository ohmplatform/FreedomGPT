import socket from "@/socket/socket";
import React, { createContext, useEffect, useState } from "react";

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
  setSelectedModel: (model: string) => {},
  setModelLoading: (loading: boolean) => {},
  setModelLoaded: (loaded: boolean) => {},
  setRamUsage: (usage: any) => {},
  setDiskUsage: (usage: any) => {},
  selectLocalModel: ({
    model,
    FILEPATH,
    extraArgs,
  }: {
    model: string;
    FILEPATH: string;
    extraArgs?: {
      [key: string]: string;
    };
  }) => {},
});

export const useModel = () => React.useContext(ModelContext);

const ModelProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [modelLoading, setModelLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(true);
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
      console.log("Selected model: ", model);
      setSelectedModel(model);
    });
  }, []);

  useEffect(() => {
    socket.on("model_loading", (loading) => {
      console.log("Model loading: ", loading);
      setModelLoading(loading);
    });

    socket.on("model_loaded", (loaded) => {
      console.log("Model loaded: ", loaded);
      setModelLoaded(loaded);
    });
  }, []);

  useEffect(() => {
    socket.on("ram_usage", (usage) => {
      console.log("RAM usage: ", usage);
      setRamUsage(usage);
    });

    socket.on("disk_usage", (usage) => {
      console.log("Disk usage: ", usage);
      setDiskUsage(usage);
    });
  }, []);

  const selectLocalModel = ({
    model,
    FILEPATH,
    extraArgs,
  }: {
    model: string;
    FILEPATH: string;
    extraArgs?: {
      [key: string]: string;
    };
  }) => {
    console.log(model, FILEPATH, extraArgs);

    socket.emit("select_model", {
      model,
      FILEPATH,
      extraArgs: extraArgs ? extraArgs : "",
    });
  };

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
        selectLocalModel,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};

export default ModelProvider;
