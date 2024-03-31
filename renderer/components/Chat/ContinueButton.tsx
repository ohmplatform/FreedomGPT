import { IconCaretUpFilled } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useModel } from '@/context/ModelSelection';

const ContinueButton = ({
  handleSend,
  selectedModel,
  selectedConversation,
}: {
  handleSend: (contentOverride?: string) => void;
  selectedModel: any;
  selectedConversation: any;
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { setContinueLength, setResponseLength } = useModel();
  const { t } = useTranslation('chat');

  const handleContinue = () => {
    setContinueLength(0);
    setResponseLength(0);
    handleSend(`continue`);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleOptionClick = (optionValue: string) => {
    setContinueLength(parseInt(optionValue));
    setResponseLength(0);
    handleSend(`continue`);
  };

  const calculateDropdownTop = () => {
    if (dropdownRef.current) {
      const dropdownHeight = dropdownRef.current.offsetHeight;
      return -dropdownHeight;
    }
    return 0;
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsDropdownOpen(false);
    }
  };

  const allContinueOptions = [
    {
      value: '1',
      label: '1X',
    },
    {
      value: '10',
      label: '10X',
    },
    {
      value: '20',
      label: '20X',
    },
  ];

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        className="flex w-fit items-right gap-3 rounded bg-white py-2 px-4 text-black hover:opacity-50  dark:bg-[#000] dark:text-white md:mb-0 md:mt-2 ml-2 mr-8 border dark:border-none "
        onClick={handleContinue}
      >
        {t('Continue')}
      </button>

      <button
        className="absolute right-0 bg-white bottom-0 text-white cursor-pointer dark:bg-black"
        onMouseDown={toggleDropdown}
        style={{
          zIndex: 998,
          padding: 8,
          borderRadius: '5px',
        }}
      >
        <IconCaretUpFilled size={20} className="text-black dark:text-white" />
      </button>

      {isDropdownOpen && (
        <div
          className="absolute"
          style={{
            zIndex: 1000,
            overflowY: 'auto',
            cursor: 'pointer',
            top: `${calculateDropdownTop() - 25 * allContinueOptions.length}px`,
            right: '0px',
          }}
        >
          {allContinueOptions.map((option, index) => (
            <button
              className="flex items-center rounded border  py-2 px-2 text-black dark:border-neutral-600 dark:bg-[#343541] dark:text-white hover:bg-blue-600 dark:hover:bg-[#00f] dark:hover:text-white hover:text-white"
              onClick={() => {
                handleOptionClick(option.value);
              }}
              key={index}
            >
              <div
                className="flex flex-col items-center"
                style={{
                  paddingBottom: '4px',
                  position: 'relative',
                }}
              >
                <div
                  className="flex flex-row items-center"
                  style={{
                    top: '-5px',
                    minWidth: 100,
                    justifyContent: 'space-between',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 'bold',
                    }}
                  >
                    {option.label}{' '}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContinueButton;
