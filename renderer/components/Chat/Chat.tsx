import { PluginKeys } from "../Chatbar/components/PluginKeys";
import NoModelImage from "../NoModelImage";
import { ChatInput } from "./ChatInput";
import { ChatLoader } from "./ChatLoader";
import { ErrorMessageDiv } from "./ErrorMessageDiv";
import { MemoizedChatMessage } from "./MemoizedChatMessage";
import { ModelSelect } from "./ModelSelect";
import { useModel } from "@/context/ModelSelection";
import HomeContext from "@/pages/api/home/home.context";
import socket from "@/socket/socket";
import { ChatBody, Conversation, Message } from "@/types/chat";
import { CloudModel, PluginWithModel } from "@/types/plugin";
import { getEndpoint } from "@/utils/app/api";
import {
  getCurrentModelAPIKEY,
  getDownloadedCloudModels,
} from "@/utils/app/cloudModels";
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from "@/utils/app/conversation";
import {
  getLocalDownloadedModels,
  isAnyLocalModelDownloaded,
} from "@/utils/app/localModels";
import { throttle } from "@/utils/data/throttle";
import { IconClearAll, IconSettings } from "@tabler/icons-react";
import axios from "axios";
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

export const Chat = memo(({ stopConversationRef }: Props) => {
  const { t } = useTranslation("chat");
  const [content, setContent] = useState<string>("");

  const {
    state: {
      selectedConversation,
      conversations,
      models,
      apiKey,
      pluginKeys,
      serverSideApiKeyIsSet,
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
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showScrollDownButton, setShowScrollDownButton] =
    useState<boolean>(false);

  const { modelLoaded, modelLoading, selectedModel, setSelectedModel } =
    useModel();

  const [latestModelResponse, setLatestModelResponse] = useState("");
  const [plugin, setPlugin] = useState<PluginWithModel | null>(null);
  const [localMessageStreaming, setLocalMessageStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(
    async (
      message: Message,
      deleteCount = 0,
      plugin: PluginWithModel | null = null
    ) => {
      setLatestModelResponse("");
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
        homeDispatch({ field: "loading", value: true });
        homeDispatch({ field: "messageIsStreaming", value: true });
        const chatBody: ChatBody = {
          model: updatedConversation.model,
          messages: updatedConversation.messages,
          key: apiKey,
          prompt: updatedConversation.prompt,
          temperature: updatedConversation.temperature,
        };

        if (plugin) {
          if (
            getDownloadedCloudModels().find(
              (model: CloudModel) => model.config.id === plugin.config.id
            )
          ) {
            console.log("plugin.config.id", plugin.config.id);

            if (updatedConversation.messages.length === 1) {
              const { content } = message;
              const customName =
                content.length > 30
                  ? content.substring(0, 30) + "..."
                  : content;
              updatedConversation = {
                ...updatedConversation,
                name: customName,
              };
            }

            const endpoint = "/api/liberty";
            const authKey = getCurrentModelAPIKEY(plugin.config.id);
            const requestData = {
              question: message.content,
              authkey: authKey,
            };

            try {
              const response = await axios.post(endpoint, requestData, {
                headers: {
                  "Content-Type": "application/json",
                },
              });

              // if (!response.data.success) {
              //   homeDispatch({ field: "loading", value: false });
              //   homeDispatch({ field: "messageIsStreaming", value: false });
              //   toast.error("Error in API KEY");
              //   return;
              // }

              const { answer } = response.data;

              console.log(answer);
              if (!response.data) {
                homeDispatch({ field: "loading", value: false });
                homeDispatch({ field: "messageIsStreaming", value: false });
                return;
              }

              const updatedMessages: Message[] = [
                ...updatedConversation.messages,
                { role: "assistant", content: answer },
              ];
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              };
              homeDispatch({
                field: "selectedConversation",
                value: updateConversation,
              });
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
              homeDispatch({
                field: "conversations",
                value: updatedConversations,
              });
              saveConversations(updatedConversations);
              homeDispatch({ field: "loading", value: false });
              homeDispatch({ field: "messageIsStreaming", value: false });

              console.log(selectedConversation);
            } catch (error) {
              console.error("An error occurred:", error);
            }
            return;
          }

          const selectedPluginId = plugin.config.id;
          const selectedPlugin = getLocalDownloadedModels().find(
            (plugin: PluginWithModel) => plugin.config.id === selectedPluginId
          );

          if (selectedPlugin) {
            socket.emit("message", message.content);

            setLocalMessageStreaming(true);

            setLatestModelResponse("");
            homeDispatch({ field: "loading", value: true });
            homeDispatch({ field: "messageIsStreaming", value: true });
            if (updatedConversation.messages.length === 1) {
              const { content } = message;
              const customName =
                content.length > 30
                  ? content.substring(0, 30) + "..."
                  : content;
              updatedConversation = {
                ...updatedConversation,
                name: customName,
              };
            }
            homeDispatch({ field: "loading", value: false });

            let isFirst = true;

            if (isFirst) {
              isFirst = false;
              const updatedMessages: Message[] = [
                ...updatedConversation.messages,
                {
                  role: "assistant",
                  content: latestModelResponse,
                },
              ];

              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              };
              homeDispatch({
                field: "selectedConversation",
                value: updatedConversation,
              });
            } else {
              const updatedMessages: Message[] =
                updatedConversation.messages.map((message, index) => {
                  if (index === updatedConversation.messages.length - 1) {
                    return {
                      ...message,
                      content: latestModelResponse,
                    };
                  }
                  return message;
                });
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              };
              homeDispatch({
                field: "selectedConversation",
                value: updatedConversation,
              });
            }

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
            homeDispatch({
              field: "conversations",
              value: updatedConversations,
            });
            saveConversations(updatedConversations);
          }
          return;
        }

        const endpoint = getEndpoint(plugin);
        let body;
        if (!plugin) {
          body = JSON.stringify(chatBody);
        }

        const controller = new AbortController();
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body,
        });
        if (!response.ok) {
          homeDispatch({ field: "loading", value: false });
          homeDispatch({ field: "messageIsStreaming", value: false });
          toast.error(response.statusText);
          return;
        }
        const data = response.body;
        if (!data) {
          homeDispatch({ field: "loading", value: false });
          homeDispatch({ field: "messageIsStreaming", value: false });
          return;
        }

        if (!plugin) {
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
              const updatedMessages: Message[] = [
                ...updatedConversation.messages,
                { role: "assistant", content: chunkValue },
              ];
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              };
              homeDispatch({
                field: "selectedConversation",
                value: updatedConversation,
              });
            } else {
              const updatedMessages: Message[] =
                updatedConversation.messages.map((message, index) => {
                  if (index === updatedConversation.messages.length - 1) {
                    return {
                      ...message,
                      content: text,
                    };
                  }
                  return message;
                });
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
        } else {
          const { answer } = await response.json();
          const updatedMessages: Message[] = [
            ...updatedConversation.messages,
            { role: "assistant", content: answer },
          ];
          updatedConversation = {
            ...updatedConversation,
            messages: updatedMessages,
          };
          homeDispatch({
            field: "selectedConversation",
            value: updateConversation,
          });
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
          homeDispatch({ field: "loading", value: false });
          homeDispatch({ field: "messageIsStreaming", value: false });
        }
      }
    },
    [
      apiKey,
      conversations,
      pluginKeys,
      selectedConversation,
      stopConversationRef,
      latestModelResponse,
    ]
  );

  useEffect(() => {
    let message = "";
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoScrollEnabled(entry.isIntersecting);
        if (entry.isIntersecting) {
          textareaRef.current?.focus();
        }
      },
      {
        root: null,
        threshold: 0.5,
      }
    );

    socket.on("response", (response: string) => {
      if (response === content) {
        return;
      }

      if (localMessageStreaming) {
        message += response;
      }

      setLatestModelResponse(message);

      if (
        selectedConversation &&
        message !== "" &&
        message !== "\n" &&
        message !== " " &&
        message !== " \n"
      ) {
        selectedConversation.messages[
          selectedConversation.messages.length - 1
        ] = {
          content: message,
          role: "assistant",
        };
      }
    });

    const messagesEndElement = messagesEndRef.current;
    socket.on("chatend", () => {
      console.log("chat ended");
      setLocalMessageStreaming(false);
      setLatestModelResponse("");
      message = "";

      homeDispatch({ field: "loading", value: false });
      homeDispatch({ field: "messageIsStreaming", value: false });
      if (messagesEndElement) {
        observer.observe(messagesEndElement);
      }
    });

    return () => {
      socket.off("response");
      socket.off("chatend");
      setLocalMessageStreaming(false);
      if (messagesEndElement) {
        observer.unobserve(messagesEndElement);
      }
    };
  }, [selectedConversation, messagesEndRef]);

  const scrollToBottom = useCallback(() => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      textareaRef.current?.focus();
    }
  }, [autoScrollEnabled]);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const bottomTolerance = 30;

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

  const handleSettings = () => {
    setShowSettings(!showSettings);
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
  const throttledScrollDown = throttle(scrollDown, 250);

  useEffect(() => {
    throttledScrollDown();
    selectedConversation &&
      setCurrentMessage(
        selectedConversation.messages[selectedConversation.messages.length - 2]
      );
  }, [selectedConversation, throttledScrollDown]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoScrollEnabled(entry.isIntersecting);
        if (entry.isIntersecting) {
          textareaRef.current?.focus();
        }
      },
      {
        root: null,
        threshold: 0.5,
      }
    );
    const messagesEndElement = messagesEndRef.current;
    if (messagesEndElement) {
      observer.observe(messagesEndElement);
    }
    return () => {
      if (messagesEndElement) {
        observer.unobserve(messagesEndElement);
      }
    };
  }, [messagesEndRef]);

  if (!localStorage.getItem("apiKey") && !isAnyLocalModelDownloaded()) {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100vw",
          position: "relative",
          flexDirection: "column",
        }}
      >
        <p
          style={{
            fontSize: "2rem",
            fontWeight: "500",
            color: "#000",
            marginBottom: "2rem",
          }}
        >
          FreedomGPT
        </p>

        <p
          style={{
            fontSize: "2rem",
            fontWeight: "300",
            color: "#000",
            marginBottom: "2rem",
          }}
        >
          No Models Connected
        </p>
        <div
          style={{
            margin: "2rem",
          }}
        >
          <NoModelImage />
        </div>
        <div
          style={{
            width: "40vw",
          }}
        >
          <PluginKeys />
        </div>
      </div>
    );
  }

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
            {selectedConversation?.messages.length === 0 ? (
              <>
                <div
                  style={{
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    position: "relative",
                    flexDirection: "column",
                  }}
                >
                  <div className="text-center text-3xl font-semibold text-gray-800 dark:text-gray-100 mt-[10vw]">
                    FreedomGPT
                  </div>

                  <div>
                    <ModelSelect setPlugin={setPlugin} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="sticky top-0 z-10 flex justify-center border border-b-neutral-300 bg-neutral-100 py-2 text-sm text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200">
                  {t("Model")}: {selectedModel.toUpperCase() || "ChatGPT"}
                  <button
                    className="ml-2 cursor-pointer hover:opacity-50"
                    onClick={handleSettings}
                  >
                    <IconSettings size={18} />
                  </button>
                  <button
                    className="ml-2 cursor-pointer hover:opacity-50"
                    onClick={onClearAll}
                  >
                    <IconClearAll size={18} />
                  </button>
                </div>
                {showSettings && (
                  <div className="flex flex-col space-y-10 md:mx-auto md:max-w-xl md:gap-6 md:py-3 md:pt-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
                    <div className="flex h-full flex-col space-y-4 border-b border-neutral-200 p-4 dark:border-neutral-600 md:rounded-lg md:border">
                      <ModelSelect setPlugin={setPlugin} />
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
                      // discard edited message and the ones that come after then resend
                      handleSend(
                        editedMessage,
                        selectedConversation?.messages.length - index
                      );
                    }}
                  />
                ))}

                {loading && <ChatLoader />}

                <div
                  className="h-[162px] bg-white dark:bg-[#343541]"
                  ref={messagesEndRef}
                />
              </>
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

          {(localStorage.getItem("apiKey") || isAnyLocalModelDownloaded()) && (
            <ChatInput
              stopConversationRef={stopConversationRef}
              textareaRef={textareaRef}
              onSend={(message, plugin) => {
                setCurrentMessage(message);
                handleSend(message, 0, plugin);
              }}
              onScrollDownClick={handleScrollDown}
              onRegenerate={(plugin) => {
                if (currentMessage) {
                  if (plugin) {
                    socket.emit("message", currentMessage.content);
                  }
                  handleSend(currentMessage, 2, plugin);
                }
              }}
              showScrollDownButton={showScrollDownButton}
              plugin={plugin}
              content={content}
              setContent={setContent}
              setPlugin={setPlugin}
            />
          )}
        </>
      )}
    </div>
  );
});
Chat.displayName = "Chat";
