import { PluginWithModel } from "@/types/plugin";

export const getEndpoint = (plugin: PluginWithModel | null) => {
  if (!plugin) {
    return "api/chat";
  }
  return "api/chat";
};
