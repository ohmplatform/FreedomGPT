import { KeyValuePair } from "./data";

export interface PluginKey {
  pluginId: string;
  requiredKeys: KeyValuePair[];
}

export type Model = {
  config: {
    model: string;
    downloadURL: string;
    requiredRAM: string;
    fileSize: string;
    id: string;
    description: string;
    image: string;
    tags: string[];
    name: string;
  };
};
export type CloudModel = {
  config: { description: string; model: string; id: string; APIKEY: string };
};

export type PluginWithModel = Model;
