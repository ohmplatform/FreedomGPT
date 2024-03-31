import { IconArrowDown, IconPlayerStop } from '@tabler/icons-react';
import { Repeat, Send } from 'iconsax-react';
import {
  KeyboardEvent,
  MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Tooltip } from 'react-tooltip';

import { useTranslation } from 'next-i18next';

import { Message } from '@/types/chat';
import { CloudModel } from '@/types/plugin';
import { Prompt } from '@/types/prompt';

import HomeContext from '@/pages/api/home/home.context';

import { ModelSettingsItem } from './Chat';
import ContinueButton from './ContinueButton';
import { PromptList } from './PromptList';
import { VariableModal } from './VariableModal';

import { useModel } from '@/context/ModelSelection';
import socket from '@/socket/socket';

interface Props {
  onSend: (message: Message, plugin: CloudModel) => void;
  onScrollDownClick: () => void;
  stopConversationRef: MutableRefObject<boolean>;
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>;
  showScrollDownButton: boolean;
  content: string;
  setContent: (newContent: string | ((prevContent: string) => string)) => void;
  modelSettings: ModelSettingsItem;
  onRegenerate: (plugin: CloudModel) => void;
  setStopInfiniteMessage: (stop: boolean) => void;
}

export const ChatInput = ({
  onSend,
  onRegenerate,
  onScrollDownClick,
  stopConversationRef,
  textareaRef,
  showScrollDownButton,
  content,
  setContent,
  modelSettings,
  setStopInfiniteMessage,
}: Props) => {
  const { t } = useTranslation('chat');

  const {
    state: { selectedConversation, messageIsStreaming, prompts, lightMode: lt },

    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showPromptList, setShowPromptList] = useState(false);
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { selectedModel, setContinueLength, setResponseLength } = useModel();

  const promptListRef = useRef<HTMLUListElement | null>(null);

  const filteredPrompts = prompts.filter((prompt) =>
    prompt.name.toLowerCase().includes(promptInputValue.toLowerCase()),
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const maxLength = selectedModel.maxLength;

    if (maxLength && value.length > maxLength) {
      alert(
        t(
          `Message limit is {{maxLength}} characters. You have entered {{valueLength}} characters.`,
          { maxLength, valueLength: value.length },
        ),
      );
      return;
    }

    localStorage.setItem('lastMessage' as string, value);
    setContent(value);
    updatePromptListVisibility(value);
  };

  const handleRegenerate = () => {
    onRegenerate(selectedModel);
    setContinueLength(0);
    setResponseLength(0);
  };

  const handleSend = (contentOverride?: string) => {
    let message = contentOverride ? contentOverride : content;

    if (messageIsStreaming) {
      return;
    }

    if (!message) {
      alert(t('Please enter a message'));
      return;
    }

    onSend({ role: 'user', content: message }, selectedModel);
    setStopInfiniteMessage(false);
    setContent('');

    if (window.innerWidth < 640 && textareaRef && textareaRef.current) {
      textareaRef.current.blur();
    }
  };

  const handleStopConversation = () => {
    stopConversationRef.current = true;

    setStopInfiniteMessage(true);

    homeDispatch({ field: 'messageIsStreaming', value: false });

    homeDispatch({ field: 'loading', value: false });
    setTimeout(() => {
      stopConversationRef.current = false;
    }, 1000);

    if (socket) socket.emit('stopResponding');
  };

  const isMobile = () => {
    const userAgent =
      typeof window.navigator === 'undefined' ? '' : navigator.userAgent;
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
    return mobileRegex.test(userAgent);
  };

  const handleInitModal = () => {
    const selectedPrompt = filteredPrompts[activePromptIndex];
    if (selectedPrompt) {
      setContent((prevContent) => {
        const newContent = prevContent?.replace(
          /\/\w*$/,
          selectedPrompt.content,
        );
        return newContent;
      });
      handlePromptSelect(selectedPrompt);
    }
    setShowPromptList(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPromptList) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : prevIndex,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex > 0 ? prevIndex - 1 : prevIndex,
        );
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setActivePromptIndex((prevIndex) =>
          prevIndex < prompts.length - 1 ? prevIndex + 1 : 0,
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleInitModal();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowPromptList(false);
      } else {
        setActivePromptIndex(0);
      }
    } else if (e.key === 'Enter' && !isTyping && !isMobile() && !e.shiftKey) {
      e.preventDefault();
      handleSend();

      setContinueLength(0);
      setResponseLength(0);
    } else if (e.key === '/' && e.metaKey) {
      e.preventDefault();
    }
  };

  const parseVariables = (content: string) => {
    const regex = /{{(.*?)}}/g;
    const foundVariables = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      foundVariables.push(match[1]);
    }

    return foundVariables;
  };

  const updatePromptListVisibility = useCallback((text: string) => {
    const match = text.match(/\/\w*$/);

    if (match) {
      setShowPromptList(true);
      setPromptInputValue(match[0].slice(1));
    } else {
      setShowPromptList(false);
      setPromptInputValue('');
    }
  }, []);

  const handlePromptSelect = (prompt: Prompt) => {
    const parsedVariables = parseVariables(prompt.content);
    setVariables(parsedVariables);

    if (parsedVariables.length > 0) {
      setIsModalVisible(true);
    } else {
      setContent((prevContent) => {
        const updatedContent = prevContent?.replace(/\/\w*$/, prompt.content);
        return updatedContent;
      });
      updatePromptListVisibility(prompt.content);
    }
  };

  const handleSubmit = (updatedVariables: string[]) => {
    const newContent = content?.replace(/{{(.*?)}}/g, (match, variable) => {
      const index = variables.indexOf(variable);
      return updatedVariables[index];
    });

    setContent(newContent);

    if (textareaRef && textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  useEffect(() => {
    if (promptListRef.current) {
      promptListRef.current.scrollTop = activePromptIndex * 30;
    }
  }, [activePromptIndex]);

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`;
      textareaRef.current.style.overflow = `${
        textareaRef?.current?.scrollHeight > 400 ? 'auto' : 'hidden'
      }`;
    }
  }, [content]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        promptListRef.current &&
        !promptListRef.current.contains(e.target as Node)
      ) {
        setShowPromptList(false);
      }
    };

    window.addEventListener('click', handleOutsideClick);

    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  return (
    <div className="absolute bottom-0 left-0 w-full border-transparent bg-gradient-to-b from-transparent via-white to-white pt-9 dark:border-white/20 dark:via-[#343541] dark:to-[#343541] md:pt-2">
      <div className="stretch mx-2 mt-4 flex flex-col last:mb-2 md:mx-4 md:mt-[52px] md:last:mb-6 lg:mx-auto lg:max-w-3xl">
        <div className="mb-3">
          {messageIsStreaming && (
            <button
              className="mx-auto flex items-center gap-2 py-2 px-2 md:px-4 rounded border border-neutral-200 bg-white text-black hover:opacity-50 dark:border-neutral-600 dark:bg-[#343541] dark:text-white"
              onClick={handleStopConversation}
            >
              <IconPlayerStop size={16} /> {t('Stop')}
            </button>
          )}

          {!messageIsStreaming &&
            selectedConversation &&
            selectedConversation.messages.length > 0 &&
            selectedConversation.messages[
              selectedConversation.messages.length - 1
            ].role !== 'user' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  alignItems: 'flex-end',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'flex-end',
                  }}
                >
                  <button
                    className="flex w-fit gap-3 rounded border dark:border-none bg-white py-2 px-4 text-black hover:opacity-50  dark:bg-[#000] dark:text-white md:mb-0 md:mt-2"
                    onClick={handleRegenerate}
                  >
                    {t('Regenerate')}

                    <Repeat
                      size={16}
                      style={{
                        marginTop: 2,
                      }}
                    />
                  </button>

                  <div>
                    <ContinueButton
                      handleSend={handleSend}
                      selectedModel={selectedModel}
                      selectedConversation={selectedConversation}
                    />
                  </div>
                </div>
              </div>
            )}
        </div>

        <div className="relative flex w-full flex-grow flex-col rounded-md border border-black/10 bg-white shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:border-gray-900/50 dark:bg-[#40414F] dark:text-white dark:shadow-[0_0_15px_rgba(0,0,0,0.10)]">
          <textarea
            ref={textareaRef}
            className={`m-0 w-full resize-none border-0 bg-transparent p-3 pr-[100px] text-black dark:bg-transparent dark:text-white md:py-3`}
            style={{
              resize: 'none',
              bottom: `${textareaRef?.current?.scrollHeight}px`,
              maxHeight: '400px',
              overflow: `${
                textareaRef.current && textareaRef.current.scrollHeight > 400
                  ? 'auto'
                  : 'hidden'
              }`,
              paddingLeft: 10,
            }}
            placeholder={t('Type your message') || ''}
            value={content}
            rows={1}
            onCompositionStart={() => setIsTyping(true)}
            onCompositionEnd={() => setIsTyping(false)}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
          />

          {messageIsStreaming ? (
            <button className="absolute right-2 top-2 rounded-sm p-1 text-neutral-800 hover:bg-neutral-200 hover:text-neutral-900 dark:bg-opacity-50 dark:text-neutral-100 dark:hover:text-neutral-200">
              <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-neutral-800 opacity-60 dark:border-neutral-100"></div>
            </button>
          ) : (
            <>
              <button
                className="absolute right-0 bottom-0 rounded-md p-1 bg-[#00f] hover:bg-blue-700 dark:text-neutral-100 dark:hover:text-neutral-200"
                onClick={() => {
                  handleSend();
                  setContinueLength(0);
                  setResponseLength(0);
                }}
                style={{
                  height: 44,
                  padding: '10px 20px',
                }}
                data-tooltip-id="cost-tooltip"
                data-tooltip-html="Each continuation of a conversation<br /> consumes credits. Please note that<br /> longer conversation threads will<br /> require more credits."
                data-tooltip-hidden={true}
              >
                <div className="flex flex-col items-center">
                  <Send size={18} variant="Bold" />
                  <span className="text-xs"></span>
                </div>
              </button>
            </>
          )}

          <Tooltip id="cost-tooltip" />

          {showScrollDownButton && (
            <div className="absolute bottom-12 right-0 top-0 lg:bottom-0 lg:-right-10">
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-300 text-gray-800 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-neutral-200"
                onClick={onScrollDownClick}
              >
                <IconArrowDown size={18} />
              </button>
            </div>
          )}

          {showPromptList && filteredPrompts.length > 0 && (
            <div className="absolute bottom-12 w-full">
              <PromptList
                activePromptIndex={activePromptIndex}
                prompts={filteredPrompts}
                onSelect={handleInitModal}
                onMouseOver={setActivePromptIndex}
                promptListRef={promptListRef}
              />
            </div>
          )}

          {isModalVisible && (
            <VariableModal
              prompt={filteredPrompts[activePromptIndex]}
              variables={variables}
              onSubmit={handleSubmit}
              onClose={() => setIsModalVisible(false)}
            />
          )}
        </div>
      </div>
      <div className="px-3 pt-4 text-center text-[12px] text-black/50 dark:text-white/50 md:px-4 md:pt-3 ">
        For questions, email{' '}
        <a
          href="mailto:contact@freedomgpt.com"
          style={{
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          contact@freedomgpt.com
        </a>
        .{' '}
      </div>

      <div className="px-3 pb-3 text-center text-[12px] text-black/50 dark:text-white/50 md:px-4 md:pb-6"></div>
    </div>
  );
};
