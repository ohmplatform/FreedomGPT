import { CloudModel } from "@/types/plugin";

export const saveCloudModel = (modelData: CloudModel) => {
  const downloadedModels = getDownloadedCloudModels();

  const existingModelIndex = downloadedModels.findIndex(
    (entry: CloudModel) => entry.config.id === modelData.config.id
  );

  if (existingModelIndex !== -1) {
    downloadedModels[existingModelIndex] = modelData;
  } else {
    downloadedModels.push(modelData);
  }

  setDownloadedCloudModels(downloadedModels);
};

export const deleteModel = (id: string) => {
  const downloadedModels = getDownloadedCloudModels();

  const updatedModels = downloadedModels.filter(
    (entry: CloudModel) => entry.config.id !== id
  );

  setDownloadedCloudModels(updatedModels);
};

export const isModelKeySet = (id: string) => {
  const downloadedModels = getDownloadedCloudModels();
  return downloadedModels.some((entry: CloudModel) => entry.config.id === id);
};

export const getCurrentModelAPIKEY = (id: string) => {
  const downloadedModels = getDownloadedCloudModels();
  const existingModel = downloadedModels.find(
    (entry: CloudModel) => entry.config.id === id
  );
  return existingModel ? existingModel.config.APIKEY : "";
};

export const getDownloadedCloudModels = () => {
  const cloudModelsString = localStorage.getItem("cloudModels");
  return cloudModelsString ? JSON.parse(cloudModelsString) : [];
};

export const setDownloadedCloudModels = (models: CloudModel[]) => {
  localStorage.setItem("cloudModels", JSON.stringify(models));
};

export const isAnyCloudModelDownloaded = () => {
  const downloadedModels = getDownloadedCloudModels();
  return downloadedModels.length > 0;
};
