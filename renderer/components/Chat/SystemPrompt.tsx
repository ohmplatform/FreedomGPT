import {
  FC,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useTranslation } from 'next-i18next';

import { Conversation } from '@/types/chat';
import { Prompt } from '@/types/prompt';

import { ModelSettingsItem } from './Chat';
import { PromptList } from './PromptList';
import { VariableModal } from './VariableModal';

import { useModel } from '@/context/ModelSelection';

interface Props {
  conversation: Conversation;
  prompts: Prompt[];
  onChangePrompt: (key: string, prompt: string) => void;
  handleSettings: () => void;
  location: string;
  modelSettings: ModelSettingsItem;
  setModelSettings: React.Dispatch<React.SetStateAction<ModelSettingsItem>>;
}

export const SystemPrompt: FC<Props> = ({
  conversation,
  prompts,
  onChangePrompt,
  handleSettings,
  location,
  modelSettings,
  setModelSettings,
}) => {
  const { t } = useTranslation('chat');
  const { selectedModel } = useModel();

  const [promptConversation, setPromptConversation] = useState<string>('');
  const [promptSummary, setPromptSummary] = useState<string>('');

  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [showPromptList, setShowPromptList] = useState(false);
  const [promptInputValue, setPromptInputValue] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const promptListRef = useRef<HTMLUListElement | null>(null);

  const filteredPrompts = prompts.filter((prompt) =>
    prompt.name.toLowerCase().includes(promptInputValue.toLowerCase()),
  );

  const handleModelSettingsChange = (value: string, prompt: string) => {
    const updatedModelSettings = { ...modelSettings };

    if (prompt === 'prompt') {
      updatedModelSettings.prompt.active = value === 'default' ? false : true;
    } else if (prompt === 'promptSummary') {
      updatedModelSettings.promptSummary.active =
        value === 'default' ? false : true;
    }

    setModelSettings(updatedModelSettings);
  };

  const [promptIsSaving, setPromptIsSaving] = useState(false);
  const [promptIsSaved, setPromptIsSaved] = useState(false);
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const maxLength = selectedModel.maxLength;

    setPromptIsSaving(true);
    setPromptIsSaved(false);

    if (value.length > maxLength) {
      alert(
        t(
          `Prompt limit is {{maxLength}} characters. You have entered {{valueLength}} characters.`,
          { maxLength, valueLength: value.length },
        ),
      );
      return;
    }

    setPromptConversation(value);
    updatePromptListVisibility(value);

    const updatedModelSettings = { ...modelSettings };
    updatedModelSettings.prompt.value = e.target.value;
    setModelSettings(updatedModelSettings);
  };
  useEffect(() => {
    if (promptIsSaving) {
      const timeoutId = setTimeout(() => {
        setPromptIsSaving(false);
        setPromptIsSaved(true);
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [promptIsSaving]);

  const [promptSummaryIsSaving, setPromptSummaryIsSaving] = useState(false);
  const [promptSummaryIsSaved, setPromptSummaryIsSaved] = useState(false);
  const handlePromptSummaryChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = e.target.value;

    setPromptSummaryIsSaving(true);
    setPromptSummaryIsSaved(false);
    setPromptSummary(value);

    const updatedModelSettings = { ...modelSettings };
    updatedModelSettings.promptSummary.value = e.target.value;
    setModelSettings(updatedModelSettings);
  };
  useEffect(() => {
    if (promptSummaryIsSaving) {
      const timeoutId = setTimeout(() => {
        setPromptSummaryIsSaving(false);
        setPromptSummaryIsSaved(true);
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [promptSummaryIsSaving]);

  const handleInitModal = () => {
    const selectedPrompt = filteredPrompts[activePromptIndex];
    setPromptConversation((prevVal) => {
      const newContent = prevVal?.replace(/\/\w*$/, selectedPrompt.content);
      return newContent;
    });
    handlePromptSelect(selectedPrompt);
    setShowPromptList(false);
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
      const updatedContent = promptConversation?.replace(
        /\/\w*$/,
        prompt.content,
      );

      setPromptConversation(updatedContent);
      onChangePrompt('prompt', updatedContent);
      updatePromptListVisibility(prompt.content);
    }
  };

  const handleSubmit = (updatedVariables: string[]) => {
    const newContent = promptConversation?.replace(
      /{{(.*?)}}/g,
      (match, variable) => {
        const index = variables.indexOf(variable);
        return updatedVariables[index];
      },
    );

    setPromptConversation(newContent);
    onChangePrompt('prompt', newContent);

    if (textareaRef && textareaRef.current) {
      textareaRef.current.focus();
    }
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
    }
  };

  useEffect(() => {
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current?.scrollHeight}px`;
    }
  }, [promptConversation, promptSummary]);

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
    <div className="flex flex-col bg-white dark:bg-[#202123]">
      <div className="max-h-[62vh] overflow-auto flex flex-col space-y-4 border-b border-neutral-200 p-2 sm:p-4 dark:border-neutral-600 md:border">
        <h2 className="mb-3 mt-4 text-center text-neutral-700 dark:text-neutral-400 text-xl">
          {t('Model Settings')}
        </h2>
        <div className="pt-2 pb-4 border-b border-neutral-200">
          <div className="flex justify-between">
            <label className="pr-1 text-left text-neutral-700 dark:text-neutral-400 uppercase">
              {t('Conversation Prompt')}
            </label>
            <div className="flex">
              <div className="radio mr-3">
                <label className="flex items-center text-neutral-900 dark:text-neutral-100">
                  <input
                    type="radio"
                    value="default"
                    checked={!modelSettings.prompt.active}
                    onChange={(e) =>
                      handleModelSettingsChange(e.target.value, 'prompt')
                    }
                    className="form-radio h-5 w-5 mr-1"
                  />
                  Default
                </label>
              </div>
              <div className="radio">
                <label className="flex items-center text-neutral-900 dark:text-neutral-100">
                  <input
                    type="radio"
                    value="custom"
                    checked={modelSettings.prompt.active}
                    onChange={(e) => {
                      handleModelSettingsChange(e.target.value, 'prompt');
                    }}
                    className="form-radio h-5 w-5 mr-1"
                  />
                  Custom
                </label>
              </div>
            </div>
          </div>

          {modelSettings.prompt.active && (
            <div className="relative">
              <p
                className={`absolute right-1 top-1 text-xs transition-opacity duration-250 ${
                  !promptIsSaved && 'opacity-0'
                }`}
              >
                Saved
              </p>
              <textarea
                ref={textareaRef}
                className="mt-6 w-full rounded-lg border border-neutral-200 bg-transparent px-4 py-3 text-neutral-900 dark:border-neutral-600 dark:text-neutral-100"
                style={{
                  resize: 'none',
                  bottom: `${textareaRef?.current?.scrollHeight}px`,
                  maxHeight: '300px',
                  overflow: `${
                    textareaRef.current &&
                    textareaRef.current.scrollHeight > 400
                      ? 'auto'
                      : 'hidden'
                  }`,
                }}
                placeholder={t(`Enter your prompt...`) || ''}
                value={modelSettings.prompt.value}
                // rows={1}
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
              />
            </div>
          )}
        </div>

        {selectedModel.hasInfiniteMode && (
          <div className="pt-2">
            <div className="flex justify-between">
              <div className="flex items-center">
                <label className="pr-1 text-left text-neutral-700 dark:text-neutral-400 uppercase">
                  {t('Infinite Mode')}
                </label>
                <span className="bg-gray-300 rounded-md text-gray-600 text-xs font-bold ml-2 py-1 px-2 uppercase">
                  Beta
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value="safeModeToggle"
                  className="sr-only peer"
                  checked={modelSettings.summarize}
                  onChange={() => {
                    const updatedModelSettings = { ...modelSettings };
                    updatedModelSettings.summarize = modelSettings.summarize
                      ? false
                      : true;
                    setModelSettings(updatedModelSettings);
                  }}
                />
                <div
                  className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600`}
                ></div>
              </label>
            </div>

            <p className="mt-4 pr-10 text-left text-neutral-700 dark:text-neutral-400">
              {t(
                'All Text AI Models have a context limit which means they stop responding after they hit the context limit. When Infinity Mode is on, earlier messages in the chat will be summarized to allow the conversation to continue infinitely.',
              )}
            </p>
          </div>
        )}

        {modelSettings.summarize &&
        (process.env.NODE_ENV === 'development' ||
          window.location.href.indexOf('vercel.app') > -1) ? (
          <div className="pt-6 pb-4 border-t border-neutral-200">
            <div className="flex justify-between">
              <label className="pr-1 text-left text-neutral-700 dark:text-neutral-400 uppercase">
                {t('Summary Prompt')}
              </label>
              <div className="flex">
                <div className="radio mr-3">
                  <label className="flex items-center text-neutral-900 dark:text-neutral-100">
                    <input
                      type="radio"
                      value="default"
                      checked={!modelSettings.promptSummary.active}
                      onChange={(e) =>
                        handleModelSettingsChange(
                          e.target.value,
                          'promptSummary',
                        )
                      }
                      className="form-radio h-5 w-5 mr-1"
                    />
                    Default
                  </label>
                </div>
                <div className="radio">
                  <label className="flex items-center text-neutral-900 dark:text-neutral-100">
                    <input
                      type="radio"
                      value="custom"
                      checked={modelSettings.promptSummary.active}
                      onChange={(e) =>
                        handleModelSettingsChange(
                          e.target.value,
                          'promptSummary',
                        )
                      }
                      className="form-radio h-5 w-5 mr-1"
                    />
                    Custom
                  </label>
                </div>
              </div>
            </div>

            {modelSettings.promptSummary.active && (
              <div className="relative">
                <p
                  className={`absolute right-1 top-1 text-xs transition-opacity duration-250 ${
                    !promptSummaryIsSaved && 'opacity-0'
                  }`}
                >
                  Saved
                </p>
                <textarea
                  ref={textareaRef}
                  className="mt-6 mb-2 w-full rounded-lg border border-neutral-200 bg-transparent px-4 py-3 text-neutral-900 dark:border-neutral-600 dark:text-neutral-100"
                  style={{
                    resize: 'none',
                    bottom: `${textareaRef?.current?.scrollHeight}px`,
                    maxHeight: '300px',
                    overflow: `${
                      textareaRef.current &&
                      textareaRef.current.scrollHeight > 400
                        ? 'auto'
                        : 'hidden'
                    }`,
                  }}
                  placeholder={t(`Enter your prompt...`) || ''}
                  value={modelSettings.promptSummary.value}
                  onChange={handlePromptSummaryChange}
                  onKeyDown={handleKeyDown}
                />
              </div>
            )}

            {modelSettings.summarize &&
              localStorage.getItem('selectedConversation') && (
                <p className="pr-10 text-left text-neutral-700 dark:text-neutral-400">
                  Current summary:{' '}
                  {JSON.parse(localStorage.getItem('selectedConversation')!)
                    .summary || 'No summary'}
                </p>
              )}
          </div>
        ) : null}

        {showPromptList && filteredPrompts.length > 0 && (
          <div>
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
            prompt={prompts[activePromptIndex]}
            variables={variables}
            onSubmit={handleSubmit}
            onClose={() => setIsModalVisible(false)}
          />
        )}

        {location === 'popup' && (
          <button
            type="button"
            className="w-full items-center gap-3 rounded border border-neutral-200 bg-white py-2 px-4 text-black hover:opacity-50 dark:border-neutral-600 dark:bg-[#343541] dark:text-white md:mb-0 md:mt-2"
            onClick={() => {
              handleSettings();
            }}
          >
            {t('Save')}
          </button>
        )}
      </div>
    </div>
  );
};
