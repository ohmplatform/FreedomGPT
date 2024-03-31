import { EXPRESS_SERVER_PORT } from "../../../src/ports";
import { ChatInput } from "./ChatInput";
import { ChatLoader } from "./ChatLoader";
import { ErrorMessageDiv } from "./ErrorMessageDiv";
import LocalServerHandler from "./LocalServerHandler";
import { MemoizedChatMessage } from "./MemoizedChatMessage";
import { ModelSelect } from "./ModelSelect";
import { SystemPrompt } from "./SystemPrompt";
import { useModel } from "@/context/ModelSelection";
import HomeContext from "@/pages/api/home/home.context";
import { Conversation, Message } from "@/types/chat";
import { CloudModel } from "@/types/plugin";
import { saveConversation, saveConversations } from "@/utils/app/conversation";
import { throttle } from "@/utils/data/throttle";
import { IconCaretUpFilled, IconMenu, IconSettings } from "@tabler/icons-react";
import { useTranslation } from "next-i18next";
import {
  MutableRefObject,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";

interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}

export interface ModelSettingsItem {
  value: string;
  label: string;
  summarize: boolean;
  prompt: {
    value: string;
    active: boolean;
  };
  promptSummary: {
    value: string;
    active: boolean;
  };
}

export const Chat = memo(({ stopConversationRef }: Props) => {
  const { t } = useTranslation("chat");

  const getLastMessage = () => {
    return localStorage.getItem("lastMessage");
  };
  const {
    state: {
      selectedConversation,
      conversations,
      models,
      pluginKeys,
      messageIsStreaming,
      modelError,
      loading,
      prompts,
    },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [currentMessage, setCurrentMessage] = useState<Message>();
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
  const [showModels, setShowModels] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showScrollDownButton, setShowScrollDownButton] =
    useState<boolean>(false);
  const [content, setContent] = useState<string>(getLastMessage() || "");
  const { selectedModel, setSelectedModel, modelLoading, localServer } =
    useModel();
  const {
    continueLength,
    setContinueLength,
    responseLength,
    setResponseLength,
  } = useModel();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [messageStatus, setMessageStatus] = useState<
    "sending" | "sent" | "start" | "stop"
  >("start");
  const [stopInfiniteMessage, setStopInfiniteMessage] = useState(false);

  const [modelSettings, setModelSettings] = useState<ModelSettingsItem>(
    {} as any
  );

  const handleSend = useCallback(
    async (
      message: Message,
      deleteCount = 0,
      plugin: CloudModel = selectedModel
    ) => {
      setShowModels(false);
      setShowSettings(false);
      setMessageStatus("sending");

      if (localServer.serverStatus !== "running") {
        toast.error(
          t(
            "Local server is not running. Please start the local server to continue."
          )
        );
        return;
      }

      if (selectedConversation) {
        let updatedConversation: Conversation;

        if (deleteCount) {
          const updatedMessages = [...selectedConversation.messages];
          for (let i = 0; i < deleteCount; i++) {
            updatedMessages.pop();
          }
          updatedConversation = {
            ...selectedConversation,
            messages: [...updatedMessages, message],
          };
        } else if (message.content === "continue") {
          updatedConversation = selectedConversation;
        } else {
          updatedConversation = {
            ...selectedConversation,
            messages: [...selectedConversation.messages, message],
          };
        }

        homeDispatch({
          field: "selectedConversation",
          value: updatedConversation,
        });

        if (message.content !== "continue") {
          homeDispatch({ field: "loading", value: true });
        }

        homeDispatch({ field: "messageIsStreaming", value: true });

        const chatBody = {
          model: selectedModel,
          messages: updatedConversation.messages.filter(
            (message) => !message.model
          ),
          continueMessage: message.content === "continue" ? true : false,
        };

        let body = JSON.stringify(chatBody);

        const controller = new AbortController();

        const url = `http://localhost:${EXPRESS_SERVER_PORT}/api/edge`;
        const response = await fetch(
          url,

          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            signal: controller.signal,
            body,
          }
        );

        if (!response.ok) {
          toast.error(
            t(
              `Something went wrong: ${
                response.status
              } "${await response.text()}"`
            )
          );

          return;
        }
        const data = response.body;

        if (!data) {
          homeDispatch({ field: "loading", value: false });
          homeDispatch({ field: "messageIsStreaming", value: false });
          return;
        }

        if (updatedConversation.messages.length === 1) {
          const { content } = message;
          const customName =
            content.length > 30 ? content.substring(0, 30) + "..." : content;
          updatedConversation = {
            ...updatedConversation,
            name: customName,
          };
        }
        homeDispatch({ field: "loading", value: false });
        const reader = data.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let isFirst = true;
        let text = "";
        while (!done) {
          if (stopConversationRef.current === true) {
            controller.abort();
            done = true;
            break;
          }
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          const chunkValue = decoder.decode(value);
          text += chunkValue;
          if (isFirst) {
            isFirst = false;
            let updatedMessages: Message[] = [];

            if (message.content === "continue") {
              let lastMessage =
                updatedConversation.messages[
                  updatedConversation.messages.length - 1
                ];

              let updatedLastMessage = {
                ...lastMessage,
                content: lastMessage.content + "\n" + chunkValue,
              };

              updatedMessages = [
                ...updatedConversation.messages.slice(
                  0,
                  updatedConversation.messages.length - 1
                ),
                updatedLastMessage,
              ];
            } else {
              updatedMessages = [
                ...updatedConversation.messages,
                {
                  role: "assistant",
                  content: chunkValue,
                  summarized: false,
                },
              ];
            }

            updatedConversation = {
              ...updatedConversation,
              messages: updatedMessages,
            };

            homeDispatch({
              field: "selectedConversation",
              value: updatedConversation,
            });
          } else {
            let updatedMessages: Message[] = updatedConversation.messages.map(
              (messages, index) => {
                if (index === updatedConversation.messages.length - 1) {
                  if (message.content === "continue") {
                    let lastMessage =
                      updatedConversation.messages[
                        updatedConversation.messages.length - 1
                      ];

                    let updatedLastMessage = {
                      ...lastMessage,
                      content: lastMessage.content + chunkValue,
                    };

                    return updatedLastMessage;
                  } else {
                    return {
                      ...messages,
                      content: text,
                    };
                  }
                }
                return messages;
              }
            );

            updatedConversation = {
              ...updatedConversation,
              messages: updatedMessages,
            };

            homeDispatch({
              field: "selectedConversation",
              value: updatedConversation,
            });
          }
        }
        localStorage.setItem("lastMessage" as string, "");

        saveConversation(updatedConversation);
        const updatedConversations: Conversation[] = conversations.map(
          (conversation) => {
            if (conversation.id === selectedConversation.id) {
              return updatedConversation;
            }
            return conversation;
          }
        );

        if (updatedConversations.length === 0) {
          updatedConversations.push(updatedConversation);
        }

        homeDispatch({ field: "conversations", value: updatedConversations });
        saveConversations(updatedConversations);
        homeDispatch({ field: "messageIsStreaming", value: false });
        homeDispatch({ field: "loading", value: false });
        setMessageStatus("sent");
        setResponseLength((responseLength) => responseLength + 1);
      }
    },
    [
      conversations,
      pluginKeys,
      selectedConversation,
      stopConversationRef,
      modelSettings,
      localServer,
      localServer.serverStatus,
    ]
  );

  useEffect(() => {
    if (
      messageStatus === "sent" &&
      responseLength < continueLength &&
      !stopInfiniteMessage
    ) {
      handleSend(
        {
          role: "user",
          content: "continue",
        },
        0,
        selectedModel
      );
    } else if (messageStatus === "sent" && responseLength > continueLength) {
      setResponseLength(0);
      setContinueLength(0);
    }

    return () => {};
  }, [responseLength, messageStatus, continueLength, setContinueLength]);

  useEffect(() => {
    textareaRef && textareaRef.current?.focus();

    const selectedModel = localStorage.getItem("selectedModel");
    if (selectedModel) {
      setSelectedModel(JSON.parse(selectedModel));
    }
  }, []);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const bottomTolerance = 5;

      if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
        setAutoScrollEnabled(false);
        setShowScrollDownButton(true);
      } else {
        setAutoScrollEnabled(true);
        setShowScrollDownButton(false);
      }
    }
  };

  const handleScrollDown = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  const handleModels = () => {
    setShowModels(!showModels);
    setShowSettings(false);
  };
  const handleSettings = () => {
    setShowSettings(!showSettings);
    setShowModels(false);
  };

  const toggleSidebar = () => {
    const chatBarState = localStorage.getItem("showChatbar");

    if (chatBarState) {
      homeDispatch({
        field: "showChatbar",
        value: chatBarState === "true" ? false : true,
      });
      localStorage.setItem(
        "showChatbar",
        JSON.stringify(chatBarState === "true" ? false : true)
      );
    } else {
      homeDispatch({ field: "showChatbar", value: true });
      localStorage.setItem("showChatbar", JSON.stringify(true));
    }
  };

  const onClearAll = () => {
    if (
      confirm(t<string>("Are you sure you want to clear all messages?")) &&
      selectedConversation
    ) {
      handleUpdateConversation(selectedConversation, {
        key: "messages",
        value: [],
      });
    }
  };

  const scrollDown = () => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView(true);
    }
  };
  const throttledScrollDown = throttle(scrollDown, 0);

  useEffect(() => {
    throttledScrollDown();
    selectedConversation &&
      setCurrentMessage(
        selectedConversation.messages[selectedConversation.messages.length - 2]
      );
  }, [selectedConversation, throttledScrollDown]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent | any) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target) &&
        !document.getElementById("modelToggle")?.contains(event.target) &&
        !document.getElementById("settingsToggle")?.contains(event.target)
      ) {
        setShowModels(false);
        setShowSettings(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const saveModelSettings = () => {
    let storedData = localStorage.getItem("modelSettings");
    let settings = storedData ? JSON.parse(storedData) : [];

    let itemIndex = settings.findIndex(
      ({ value }: { value: string }) => value === modelSettings.value
    );

    if (itemIndex !== -1) {
      // Item already exists, update it
      settings[itemIndex] = modelSettings;
    } else if (modelSettings.value) {
      // Item doesn't exist, add it to the array
      settings.push(modelSettings);
    }

    localStorage.setItem("modelSettings", JSON.stringify(settings));
  };

  useEffect(() => {
    saveModelSettings();
  }, [modelSettings]);

  useEffect(() => {
    const savedModelSettings = localStorage.getItem("modelSettings")
      ? JSON.parse(localStorage.getItem("modelSettings") as string)
      : [];

    const savedSelectedModelSettings = savedModelSettings.find(
      (m: { value: string }) => m.value === selectedModel.id
    );

    if (savedSelectedModelSettings) {
      setModelSettings(savedSelectedModelSettings);
    } else {
      setModelSettings((curr) => {
        return {
          value: selectedModel.id,
          label: selectedModel.name,
          summarize: false,
          prompt: {
            value: selectedModel.defaultPrompt,
            active: false,
          },
          promptSummary: {
            value: selectedModel.defaultSummaryPrompt,
            active: false,
          },
        };
      });
    }
  }, [selectedModel]);

  return (
    <div className="relative flex-1 overflow-hidden bg-white dark:bg-[#343541]">
      {modelError ? (
        <ErrorMessageDiv error={modelError} />
      ) : (
        <>
          <div
            className="max-h-full overflow-x-hidden"
            ref={chatContainerRef}
            onScroll={handleScroll}
          >
            <div className="sticky h-[58px] z-[1] top-0 flex justify-center items-center bg-neutral-100 dark:bg-[#202123] shadow ">
              <button
                className="h-[58px] px-3 py-4 cursor-pointer bg-[#202123]"
                onClick={toggleSidebar}
                disabled={messageIsStreaming}
                style={{
                  cursor:
                    loading || messageIsStreaming ? "not-allowed" : "pointer",
                  position: "absolute",
                  left: "0",
                }}
              >
                <IconMenu size={18} color={"#fff"} />
              </button>
              <div
                id="modelToggle"
                className="flex items-center grow text-left text-neutral-500 dark:text-neutral-200 border border-[#00000070] dark:border-[#ffffff70]"
                style={{
                  borderRadius: "0.375rem",
                  maxWidth: Math.min(300, window.innerWidth),
                  position: "relative",
                }}
              >
                <div className="border-r border-[#00000070] dark:border-[#ffffff70] px-4 py-1 text-xs text-right leading-tight">
                  <span className="text-[#00000097] dark:text-[#ffffff97] overflow-ellipsis whitespace-nowrap">
                    {t("Selected")}
                    <br />
                    {t("Model")}
                  </span>
                </div>

                <div className="grow flex justify-between">
                  <button
                    onClick={handleModels}
                    disabled={messageIsStreaming}
                    className="grow w-[130px] overflow-hidden overflow-ellipsis whitespace-nowrap text-left pl-4 font-bold"
                  >
                    {selectedModel.name}
                  </button>

                  {selectedModel.hasSettings && (
                    <button
                      id="settingsToggle"
                      onClick={handleSettings}
                      disabled={messageIsStreaming}
                      style={{
                        cursor:
                          loading || messageIsStreaming
                            ? "not-allowed"
                            : "pointer",
                        width: 44,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconSettings size={21} />
                    </button>
                  )}
                  <button
                    onClick={handleModels}
                    disabled={messageIsStreaming}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 44,
                      cursor:
                        loading || messageIsStreaming
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    <IconCaretUpFilled
                      size={21}
                      className={!showModels ? "rotate-180" : ""}
                    />
                  </button>
                </div>
              </div>
            </div>

            {showModels && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  paddingTop: 58,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  zIndex: 2,
                  overflow: "auto",
                }}
              >
                <div
                  ref={modalRef}
                  className="flex flex-col space-y-10 md:mx-auto md:max-w-xl md:gap-6 md:py-3 lg:max-w-2xl lg:px-0 xl:max-w-3xl"
                >
                  <ModelSelect setShowModels={setShowModels} />
                </div>
              </div>
            )}

            {showSettings && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  paddingTop: 58,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  zIndex: 2,
                  overflow: "auto",
                }}
              >
                <div
                  className="flex flex-col space-y-10 md:mx-auto md:max-w-xl md:gap-6 md:py-3 lg:max-w-2xl lg:px-0 xl:max-w-3xl"
                  ref={modalRef}
                >
                  {selectedConversation && (
                    <SystemPrompt
                      conversation={selectedConversation}
                      prompts={prompts}
                      onChangePrompt={(key, prompt) =>
                        handleUpdateConversation(selectedConversation, {
                          key: key,
                          value: prompt,
                        })
                      }
                      handleSettings={handleSettings}
                      location="popup"
                      modelSettings={modelSettings}
                      setModelSettings={setModelSettings}
                    />
                  )}
                </div>
              </div>
            )}

            {selectedConversation?.messages.map((message, index) => (
              <MemoizedChatMessage
                key={index}
                message={message}
                messageIndex={index}
                onEdit={(editedMessage) => {
                  setCurrentMessage(editedMessage);
                  handleSend(
                    editedMessage,
                    selectedConversation?.messages.length - index
                  );
                }}
              />
            ))}

            {
              <>
                {localServer.serverStatus !== "running" && (
                  <div
                    style={{
                      height: "70vh",
                      display: "flex",
                      alignItems: "center",
                      position: "relative",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <LocalServerHandler />
                  </div>
                )}
              </>
            }

            {loading && <ChatLoader />}

            {selectedConversation?.messages.length !== 0 && (
              <div
                className="h-[162px] bg-white dark:bg-[#343541]"
                ref={messagesEndRef}
              />
            )}
          </div>

          {modelLoading && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div className="flex flex-1">
                <div className="flex flex-1 justify-center items-center">
                  <div className="flex flex-col justify-center items-center">
                    <div className="mb-4">
                      <div className="flex justify-center items-center">
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderTop: "3px solid #3498db",
                            borderRight: "3px solid transparent",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Loading model
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <ChatInput
            stopConversationRef={stopConversationRef}
            textareaRef={textareaRef}
            onSend={(message, plugin) => {
              setCurrentMessage(message);
              handleSend(message, 0, plugin);
            }}
            onScrollDownClick={handleScrollDown}
            onRegenerate={(model) => {
              if (currentMessage) {
                handleSend(currentMessage, 2, model);
              }
            }}
            showScrollDownButton={showScrollDownButton}
            content={content}
            setContent={setContent}
            modelSettings={modelSettings}
            setStopInfiniteMessage={setStopInfiniteMessage}
          />
        </>
      )}
    </div>
  );
});
Chat.displayName = "Chat";
