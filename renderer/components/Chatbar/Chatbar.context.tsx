import { ChatbarInitialState } from "./Chatbar.state";
import { ActionType } from "@/hooks/useCreateReducer";
import { Conversation } from "@/types/chat";
import { SupportedExportFormats } from "@/types/export";
import { PluginKey } from "@/types/plugin";
import { Dispatch, createContext } from "react";

export interface ChatbarContextProps {
  state: ChatbarInitialState;
  dispatch: Dispatch<ActionType<ChatbarInitialState>>;
  handleDeleteConversation: (conversation: Conversation) => void;
  handleClearConversations: () => void;
  handleExportData: () => void;
  handleImportConversations: (data: SupportedExportFormats) => void;
  handlePluginKeyChange: (pluginKey: PluginKey) => void;
  handleClearPluginKey: (pluginKey: PluginKey) => void;
  handleApiKeyChange: (apiKey: string) => void;
}

const ChatbarContext = createContext<ChatbarContextProps>(undefined!);

export default ChatbarContext;
