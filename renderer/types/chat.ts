import { OpenAIModel } from './openai';

export interface Message {
  role: Role;
  content: string;
  model?: string;
  summarized?: Boolean;
}

export type Role = 'assistant' | 'user';

export interface ChatBody {
  model: any;
  messages: Message[];
  key: string;
  prompt: string;
  promptSummary: string;
  temperature: number;
  continueMessage?: boolean;
  summary?: string;
  summaryCharacters?: number;
}

export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  temperature: number;
  folderId: string | null;
  summary?: string;
  summaryCharacters?: number;
}
