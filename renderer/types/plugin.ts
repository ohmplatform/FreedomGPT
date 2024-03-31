import {
  IconClipboardText,
  IconCodeDots,
  IconPhotoPlus,
  IconPhotoSearch,
  IconShieldOff,
  IconUserPlus,
} from '@tabler/icons-react';

export interface Models {
  id: PluginID;
  name: PluginName;
  type: PluginType;
}
export interface CloudModel {
  endpoint: string;
  model: string;
  tags: string[];
  name: string;
  maxLength: number;
  tokenLimit: number;
  description: string;
  image: string;
  id: string;
  type: string[];
  isNew: boolean;
  hasSettings: boolean;
  hasInfiniteMode: boolean;
  defaultSummaryPrompt: string;
  defaultPrompt: string;
  firstMessageCost: number;
  inputCost?: number;
  outputCost?: number;
  enabled?: boolean;
  createdAt?: any;
  fileSize?: string;
  requiredRAM?: string;
  downloadURL?: string;
}

export interface SelectedModel {
  value: string;
  label: string;
}

export interface PluginKey {
  pluginId: PluginID;
}

export enum PluginID {
  LIBERTY = 'liberty',
}

export enum PluginName {
  LIBERTY = 'liberty',
}

export enum PluginType {
  TEXT = 'text',
  IMAGE = 'image',
  IMAGETOTEXT = 'imagetotext',
}

export const modelTypes = [
  {
    id: 'text',
    name: 'Text Generation',
    color: '#0004F5',
    icon: IconClipboardText,
  },
  {
    id: 'image',
    name: 'Text to Image',
    color: '#58A65C',
    icon: IconPhotoPlus,
  },
  {
    id: 'imagetotext',
    name: 'Image to Text',
    color: '#58A65C',
    icon: IconPhotoSearch,
  },
];

export const modelUseCases = [
  {
    id: 'uncensored',
    name: 'Uncensored',
    color: '#D85040',
    icon: IconShieldOff,
  },
  {
    id: 'coding',
    name: 'Coding',
    color: '#0004F5',
    icon: IconCodeDots,
  },
  {
    id: 'roleplay',
    name: 'Roleplay',
    color: '#58A65C',
    icon: IconUserPlus,
  },
];

export type PluginWithLocalModel = {
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
