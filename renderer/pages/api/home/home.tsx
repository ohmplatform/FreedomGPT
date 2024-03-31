import HomeContext from "./home.context";
import { HomeInitialState, initialState } from "./home.state";
import { Chat } from "@/components/Chat/Chat";
import { Chatbar } from "@/components/Chatbar/Chatbar";
import Loader from "@/components/Loader";
import { useCreateReducer } from "@/hooks/useCreateReducer";
import useWindowSize from "@/hooks/useWindowSize";
import { Conversation } from "@/types/chat";
import { KeyValuePair } from "@/types/data";
import { FolderInterface, FolderType } from "@/types/folder";
import { OpenAIModelID, OpenAIModels, fallbackModelID } from "@/types/openai";
import { Prompt } from "@/types/prompt";
import {
  cleanConversationHistory,
  cleanSelectedConversation,
} from "@/utils/app/clean";
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from "@/utils/app/const";
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from "@/utils/app/conversation";
import { saveFolders } from "@/utils/app/folders";
import { savePrompts } from "@/utils/app/prompts";
import { getSettings } from "@/utils/app/settings";
import { GetServerSideProps, GetStaticProps } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

interface Props {
  serverSideApiKeyIsSet: boolean;
  serverSidePluginKeysSet: boolean;
  defaultModelId: OpenAIModelID;
}

const Home = ({
  serverSideApiKeyIsSet,
  serverSidePluginKeysSet,
  defaultModelId,
}: Props) => {
  const { t } = useTranslation("chat");
  const { isMobile } = useWindowSize();

  const contextValue = useCreateReducer<HomeInitialState>({
    initialState,
  });

  const {
    state: { lightMode, folders, conversations, selectedConversation, prompts },
    dispatch,
  } = contextValue;

  const handleOpenChatbar = () => {
    dispatch({ field: "showChatbar", value: true });
    localStorage.setItem("showChatbar", JSON.stringify(true));
  };

  const stopConversationRef = useRef<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        window.addEventListener("mouseup", handleMouseUp);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      window.removeEventListener("mouseup", handleMouseUp);
      handleOpenChatbar();
    };

    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  useEffect(() => {
    handleOpenChatbar();
  }, []);

  const handleSelectConversation = (conversation: Conversation) => {
    dispatch({
      field: "selectedConversation",
      value: conversation,
    });

    saveConversation(conversation);
  };

  // FOLDER OPERATIONS  --------------------------------------------

  const handleCreateFolder = (name: string, type: FolderType) => {
    const newFolder: FolderInterface = {
      id: uuidv4(),
      name,
      type,
    };

    const updatedFolders = [...folders, newFolder];

    dispatch({ field: "folders", value: updatedFolders });
    saveFolders(updatedFolders);
  };

  const handleDeleteFolder = (folderId: string) => {
    const updatedFolders = folders.filter((f) => f.id !== folderId);
    dispatch({ field: "folders", value: updatedFolders });
    saveFolders(updatedFolders);

    const updatedConversations: Conversation[] = conversations.map((c) => {
      if (c.folderId === folderId) {
        return {
          ...c,
          folderId: null,
        };
      }

      return c;
    });

    dispatch({ field: "conversations", value: updatedConversations });
    saveConversations(updatedConversations);

    const updatedPrompts: Prompt[] = prompts.map((p) => {
      if (p.folderId === folderId) {
        return {
          ...p,
          folderId: null,
        };
      }

      return p;
    });

    dispatch({ field: "prompts", value: updatedPrompts });
    savePrompts(updatedPrompts);
  };

  const handleUpdateFolder = (folderId: string, name: string) => {
    const updatedFolders = folders.map((f) => {
      if (f.id === folderId) {
        return {
          ...f,
          name,
        };
      }

      return f;
    });

    dispatch({ field: "folders", value: updatedFolders });

    saveFolders(updatedFolders);
  };

  // CONVERSATION OPERATIONS  --------------------------------------------

  const handleNewConversation = () => {
    const lastConversation = conversations[conversations.length - 1];

    const newConversation: Conversation = {
      id: uuidv4(),
      name: t("New Conversation"),
      messages: [],
      temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
      folderId: null,
    };

    const updatedConversations = [...conversations, newConversation];

    dispatch({ field: "selectedConversation", value: newConversation });
    dispatch({ field: "conversations", value: updatedConversations });

    saveConversation(newConversation);
    saveConversations(updatedConversations);

    dispatch({ field: "loading", value: false });
  };

  const handleUpdateConversation = (
    conversation: Conversation,
    data: KeyValuePair
  ) => {
    const updatedConversation = {
      ...conversation,
      [data.key]: data.value,
    };

    const { single, all } = updateConversation(
      updatedConversation,
      conversations
    );

    dispatch({ field: "selectedConversation", value: single });
    dispatch({ field: "conversations", value: all });
  };

  useEffect(() => {
    defaultModelId &&
      dispatch({ field: "defaultModelId", value: defaultModelId });
    serverSideApiKeyIsSet &&
      dispatch({
        field: "serverSideApiKeyIsSet",
        value: serverSideApiKeyIsSet,
      });
    serverSidePluginKeysSet &&
      dispatch({
        field: "serverSidePluginKeysSet",
        value: serverSidePluginKeysSet,
      });
  }, [defaultModelId, serverSideApiKeyIsSet, serverSidePluginKeysSet]);

  // ON LOAD --------------------------------------------

  useEffect(() => {
    const settings = getSettings();
    if (settings.theme) {
      dispatch({
        field: "lightMode",
        value: settings.theme,
      });
    }

    const apiKey = localStorage.getItem("apiKey");

    if (serverSideApiKeyIsSet) {
      dispatch({ field: "apiKey", value: "" });

      localStorage.removeItem("apiKey");
    } else if (apiKey) {
      dispatch({ field: "apiKey", value: apiKey });
    }

    const pluginKeys = localStorage.getItem("pluginKeys");
    if (serverSidePluginKeysSet) {
      dispatch({ field: "pluginKeys", value: [] });
      localStorage.removeItem("pluginKeys");
    } else if (pluginKeys) {
      dispatch({ field: "pluginKeys", value: pluginKeys });
    }

    const showChatbar = localStorage.getItem("showChatbar");
    if (showChatbar) {
      dispatch({ field: "showChatbar", value: showChatbar === "true" });
    }

    const showPromptbar = localStorage.getItem("showPromptbar");
    if (showPromptbar) {
      dispatch({ field: "showPromptbar", value: showPromptbar === "true" });
    }

    const folders = localStorage.getItem("folders");
    if (folders) {
      dispatch({ field: "folders", value: JSON.parse(folders) });
    }

    const prompts = localStorage.getItem("prompts");
    if (prompts) {
      dispatch({ field: "prompts", value: JSON.parse(prompts) });
    }

    const conversationHistory = localStorage.getItem("conversationHistory");
    if (conversationHistory) {
      const parsedConversationHistory: Conversation[] =
        JSON.parse(conversationHistory);
      const cleanedConversationHistory = cleanConversationHistory(
        parsedConversationHistory
      );

      dispatch({ field: "conversations", value: cleanedConversationHistory });
    }

    const selectedConversation = localStorage.getItem("selectedConversation");
    if (selectedConversation) {
      const parsedSelectedConversation: Conversation =
        JSON.parse(selectedConversation);
      const cleanedSelectedConversation = cleanSelectedConversation(
        parsedSelectedConversation
      );

      dispatch({
        field: "selectedConversation",
        value: cleanedSelectedConversation,
      });
    } else {
      const lastConversation = conversations[conversations.length - 1];
      dispatch({
        field: "selectedConversation",
        value: {
          id: uuidv4(),
          name: t("New Conversation"),
          messages: [],
          model: OpenAIModels[defaultModelId],
          prompt: DEFAULT_SYSTEM_PROMPT,
          temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
          folderId: null,
        },
      });
    }
  }, [
    defaultModelId,
    dispatch,
    serverSideApiKeyIsSet,
    serverSidePluginKeysSet,
  ]);

  return (
    <HomeContext.Provider
      value={{
        ...contextValue,
        handleNewConversation,
        handleCreateFolder,
        handleDeleteFolder,
        handleUpdateFolder,
        handleSelectConversation,
        handleUpdateConversation,
      }}
    >
      <title>FreedomGPT</title>
      <meta
        name="description"
        content="FreedomGPT 2.0 is your launchpad for AI. No technical knowledge should be required to use the latest AI models in both a private and secure manner. Unlike ChatGPT, the Liberty model included in FreedomGPT will answer any question without censorship, judgement, or risk of ‘being reported.’"
      />
      <meta
        name="viewport"
        content="height=device-height ,width=device-width, initial-scale=1, user-scalable=no"
      />
      <link rel="icon" href="/favicon.ico" />
      {selectedConversation && (
        <main
          className={`flex w-screen flex-col text-sm text-white dark:text-white ${lightMode}`}
          style={{
            overflow: "auto",
            height: isMobile ? "90vh" : "100vh",
          }}
        >
          <div className="flex h-full w-full">
            <Chatbar />
            <Chat stopConversationRef={stopConversationRef} />
          </div>
        </main>
      )}
    </HomeContext.Provider>
  );
};
export default Home;

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  const defaultModelId =
    (process.env.DEFAULT_MODEL &&
      Object.values(OpenAIModelID).includes(
        process.env.DEFAULT_MODEL as OpenAIModelID
      ) &&
      process.env.DEFAULT_MODEL) ||
    fallbackModelID;

  let serverSidePluginKeysSet = false;

  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleCSEId = process.env.GOOGLE_CSE_ID;

  if (googleApiKey && googleCSEId) {
    serverSidePluginKeysSet = true;
  }

  return {
    props: {
      serverSideApiKeyIsSet: !!process.env.OPENAI_API_KEY,
      defaultModelId,
      serverSidePluginKeysSet,
      ...(await serverSideTranslations(locale ?? "en", [
        "common",
        "chat",
        "sidebar",
        "markdown",
        "promptbar",
        "settings",
      ])),
    },
  };
};
