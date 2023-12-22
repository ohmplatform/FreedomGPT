import { PluginWithLocalModel } from "@/types/plugin";

export type LocalModel = {
  id: string;
  name: string;
  config: {
    model: string;
    downloadURL: string;
    requiredRAM: number;
    fileSize: number;
    id: string;
    description: string;
  };
  FILEPATH: string;
};

export const saveLocalModels = (
  data: { modelData: PluginWithLocalModel["config"] },
  FILEPATH: string
) => {
  const alreadyDownloaded = localStorage.getItem("downloadedModels");
  const newData = {
    id: data.modelData.id,
    name: data.modelData.id,
    config: data.modelData,
    FILEPATH: FILEPATH,
  };

  if (alreadyDownloaded) {
    const parsed: Array<{
      id: string;
      name: string;
      config: PluginWithLocalModel["config"];
    }> = JSON.parse(alreadyDownloaded);

    // Check if the ID already exists
    const existingEntry = parsed.find((entry) => entry.id === newData.id);

    if (!existingEntry) {
      // Add the new entry only if the ID doesn't exist
      const updatedData = [...parsed, newData];
      localStorage.setItem("downloadedModels", JSON.stringify(updatedData));
    }
  } else {
    localStorage.setItem("downloadedModels", JSON.stringify([newData]));
  }
};

export const deleteModel = (id: string) => {
  const alreadyDownloaded = localStorage.getItem("downloadedModels");

  if (alreadyDownloaded) {
    const parsed: Array<LocalModel> = JSON.parse(alreadyDownloaded);
    const updatedData = parsed.filter((entry) => entry.id !== id);
    localStorage.setItem("downloadedModels", JSON.stringify(updatedData));
  }
};

export const isModelDownloaded = (id: string) => {
  const alreadyDownloaded = localStorage.getItem("downloadedModels");

  if (alreadyDownloaded) {
    const parsed: Array<LocalModel> = JSON.parse(alreadyDownloaded);
    const existingEntry = parsed.find((entry) => entry.id === id);
    return existingEntry ? true : false;
  } else {
    return false;
  }
};

export const currentModelPath = (id: string) => {
  const alreadyDownloaded = localStorage.getItem("downloadedModels");

  if (alreadyDownloaded) {
    const parsed: Array<LocalModel> = JSON.parse(alreadyDownloaded);
    const existingEntry = parsed.find((entry) => entry.id === id);
    return existingEntry ? existingEntry.FILEPATH : "";
  } else {
    return "";
  }
};

export const getLocalDownloadedModels = () => {
  const localModels = localStorage.getItem("downloadedModels");
  return localModels ? JSON.parse(localModels) : [];
};

export const isAnyLocalModelDownloaded = () => {
  const localModels = localStorage.getItem("downloadedModels");
  return localModels ? JSON.parse(localModels).length > 0 : false;
};
