import React, { createContext, useEffect, useState } from 'react';

import { CloudModel } from '@/types/plugin';

import { offlineModels } from '@/localModels/offlineModels';
import socket from '@/socket/socket';

type ModelContextType = {
  models: CloudModel[];
  selectedModel: CloudModel;
  setSelectedModel: (model: any) => void;
  modelLoading: boolean;
  modelLoaded: boolean;
  ramUsage: {
    totalRAM: number;
    freeRAM: number;
    usedRAM: number;
  };
  cpuInfo: {
    model: string;
    speed: number;
    times: any;
  };
  diskUsage: {
    totalDisk: number;
    freeDisk: number;
  };
  setModelLoading: (loading: boolean) => void;
  setModelLoaded: (loaded: boolean) => void;
  setRamUsage: (usage: any) => void;
  setCpuInfo: (info: any) => void;
  setDiskUsage: (usage: any) => void;
  localServer: {
    serverStatus: string;
    serverMessage: string;
    model: string;
  };
  setLocalServer: (server: any) => void;

  continueLength: number;
  setContinueLength: React.Dispatch<React.SetStateAction<number>>;
  responseLength: number;
  setResponseLength: React.Dispatch<React.SetStateAction<number>>;
};

export const ModelContext = createContext<ModelContextType | undefined>(
  undefined,
);

const ModelProvider = ({ children }: { children: React.ReactNode }) => {
  const [models, setModels] = useState<CloudModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<CloudModel>(
    {} as CloudModel,
  );

  const [modelLoading, setModelLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(true);
  const [continueLength, setContinueLength] = useState<number>(0);
  const [responseLength, setResponseLength] = useState(0);
  const [ramUsage, setRamUsage] = useState({
    totalRAM: 0,
    freeRAM: 0,
    usedRAM: 0,
  });
  const [cpuInfo, setCpuInfo] = useState({
    model: '',
    speed: 0,
    times: {},
  });
  const [diskUsage, setDiskUsage] = useState({
    totalDisk: 0,
    freeDisk: 0,
  });

  type SERVER_STATUS =
    | 'running'
    | 'stopped'
    | 'loading'
    | 'error'
    | 'success'
    | 'idle'
    | 'unknown'
    | 'unavailable';

  const [localServer, setLocalServer] = useState<{
    serverStatus: SERVER_STATUS;
    serverMessage: string;
    model: string;
  }>({
    serverStatus: 'stopped',
    serverMessage: '',
    model: '',
  });

  useEffect(() => {
    socket &&
      socket.on('selected_model', (model) => {
        console.log('Selected model: ', model);
        setSelectedModel(model);
      });
  }, []);

  useEffect(() => {
    socket &&
      socket.on('model_loading', (loading) => {
        console.log('Model loading: ', loading);
        setModelLoading(loading);
      });
  }, []);

  useEffect(() => {
    socket &&
      socket.on('model_stopped', (stop) => {
        console.log('Model Stopped: ', stop);
        if (stop) {
          setLocalServer({
            serverStatus: 'stopped',
            serverMessage: 'Local server is running',
            model: selectedModel.id,
          });
        }
      });
  }, []);

  useEffect(() => {
    socket &&
      socket.on('model_loaded', (loaded) => {
        console.log('Model loaded: ', loaded);
        setModelLoaded(loaded);

        if (loaded) {
          setLocalServer({
            serverStatus: 'running',
            serverMessage: 'Local server is running',
            model: selectedModel.id,
          });
        }
      });
  }, []);

  useEffect(() => {
    socket &&
      socket.on('ram_usage', (usage) => {
        console.log('RAM usage: ', usage);
        setRamUsage(usage);
      });

    socket &&
      socket.on('cpu_info', (info) => {
        console.log('cpu_info: ', info);
        setCpuInfo(info);
      });

    socket &&
      socket.on('disk_usage', (usage) => {
        console.log('Disk usage: ', usage);
        setDiskUsage(usage);
      });
  }, []);

  const handleGetModels = () => {
    setModels(offlineModels);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const selectedModel = localStorage.getItem('selectedModel');

      if (selectedModel) {
        setSelectedModel(JSON.parse(selectedModel));
      }

      handleGetModels();
    }
  }, []);

  return (
    <ModelContext.Provider
      value={{
        models,
        selectedModel,
        setSelectedModel,

        modelLoading,
        modelLoaded,
        ramUsage,
        cpuInfo,
        diskUsage,
        setModelLoading,
        setModelLoaded,
        setRamUsage,
        setCpuInfo,
        setDiskUsage,
        localServer,
        setLocalServer,
        continueLength,
        setContinueLength,
        responseLength,
        setResponseLength,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = () => {
  const context = React.useContext(ModelContext);

  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider');
  }

  return context;
};

export default ModelProvider;
