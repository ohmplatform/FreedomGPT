import {
  IconFolderPlus,
  IconMenu,
  IconMistOff,
  IconPlus,
} from '@tabler/icons-react';
import { ReactNode, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import useWindowSize from '@/hooks/useWindowSize';

import HomeContext from '@/pages/api/home/home.context';

import Search from '../Search';

import { useModel } from '@/context/ModelSelection';

interface Props<T> {
  isOpen: boolean;
  addItemButtonTitle: string;
  side: 'left' | 'right';
  items: T[];
  itemComponent: ReactNode;
  folderComponent: ReactNode;
  footerComponent?: ReactNode;
  searchTerm: string;
  handleSearchTerm: (searchTerm: string) => void;
  toggleOpen: () => void;
  handleCreateItem: () => void;
  handleCreateFolder: () => void;
  handleDrop: (e: any) => void;
}

const Sidebar = <T,>({
  isOpen,
  addItemButtonTitle,
  side,
  items,
  itemComponent,
  folderComponent,
  footerComponent,
  searchTerm,
  handleSearchTerm,
  toggleOpen,
  handleCreateItem,
  handleCreateFolder,
  handleDrop,
}: Props<T>) => {
  const { t } = useTranslation('promptbar');
  const { dispatch: homeDispatch } = useContext(HomeContext);
  const { models, selectedModel, setSelectedModel } = useModel();
  const { isMobile } = useWindowSize();

  const allowDrop = (e: any) => {
    e.preventDefault();
  };

  const highlightDrop = (e: any) => {
    e.target.style.background = '#343541';
  };

  const removeHighlight = (e: any) => {
    e.target.style.background = 'none';
  };

  return isOpen ? (
    <div>
      {isMobile && (
        <div
          style={{
            position: 'absolute',
            top: '0px',
            left: '0px',
            width: '100vw',
            height: '100vh',
            zIndex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
          onClick={toggleOpen}
        />
      )}
      <div
        id="sidebar"
        className={`fixed top-0 ${side}-0 z-[2] flex h-full w-[260px] flex-none flex-col space-y-2 bg-[#202123] text-[14px] transition-all sm:relative sm:top-0 sm:pt-0`}
      >
        <div className="flex items-center mb-2 px-3">
          <button
            className="h-[58px] mr-4 py-4 cursor-pointer bg-[#202123] sm:hidden"
            onClick={toggleOpen}
          >
            <IconMenu size={18} color={'#fff'} />
          </button>
          <h2
            className="my-3.5 text-[26px] font-[600]"
            style={{
              cursor: 'pointer',
            }}
            onClick={() => {
              window.location.href = '/';
            }}
          >
            FreedomGPT
          </h2>
        </div>
        <div className="flex items-center align-center px-3">
          <button
            className="text-sidebar flex w-[190px] flex-shrink-0 cursor-pointer select-none items-center gap-3 border border-white/20 p-3 text-white transition-colors duration-200 hover:bg-gray-500/10"
            onClick={() => {
              homeDispatch({ field: 'messageIsStreaming', value: false });
              handleCreateItem();
              handleSearchTerm('');
            }}
          >
            <IconPlus size={16} />
            {addItemButtonTitle}
          </button>

          <button
            className="ml-2 flex flex-shrink-0 cursor-pointer items-center gap-3 border border-white/20 p-3 text-sm text-white transition-colors duration-200 hover:bg-gray-500/10"
            onClick={handleCreateFolder}
          >
            <IconFolderPlus size={16} />
          </button>
        </div>
        <Search
          placeholder={t('Search...') || ''}
          searchTerm={searchTerm}
          onSearch={handleSearchTerm}
        />

        <div className="flex-grow overflow-auto px-3">
          {items?.length > 0 && (
            <div className="flex border-b border-white/20 pb-1">
              {folderComponent}
            </div>
          )}

          {items?.length > 0 ? (
            <div
              className="pt-2"
              onDrop={handleDrop}
              onDragOver={allowDrop}
              onDragEnter={highlightDrop}
              onDragLeave={removeHighlight}
            >
              {itemComponent}
            </div>
          ) : (
            <div className="mt-8 select-none text-center text-white opacity-50">
              <IconMistOff className="mx-auto mb-3" />
              <span className="text-[14px] leading-normal">
                {t('No data.')}
              </span>
            </div>
          )}
        </div>
        {footerComponent}
      </div>
    </div>
  ) : null;
};

export default Sidebar;
