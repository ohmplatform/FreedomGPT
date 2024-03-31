import {
  IconBox,
  IconCircleLetterF,
  IconDownload,
  IconSearch,
  IconSelect,
  IconSend,
  IconSquareCheck,
  IconStar,
  IconStarFilled,
  IconX,
} from '@tabler/icons-react';
import { IconMoneybag } from '@tabler/icons-react';
import React, { FunctionComponent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import Head from 'next/head';
import { useRouter } from 'next/router';

import useWindowSize from '@/hooks/useWindowSize';

import {
  currentModelPath,
  deleteModel,
  isModelDownloaded,
  saveLocalModels,
} from '@/utils/app/localModels';

import { modelTypes, modelUseCases } from '@/types/plugin';

import { useModel } from '@/context/ModelSelection';
import socket from '@/socket/socket';

interface CloudModel {
  model: any;
}
interface CloudModelContentProps extends CloudModel {}

export const Header = () => {
  const router = useRouter();
  const { isMobile } = useWindowSize();
  const buttons = [
    {
      text: 'Publish your model',
      inverted: false,
      icon: IconSend,
      onCLick: () => {
        window.open(
          'https://docs.google.com/forms/d/e/1FAIpQLSd1fHKtW2U71ggV8qnD5wYm796kqDKgRADI_WBjsZk1MR5ZEQ/viewform',
          '_blank',
        );
      },
      bgColor: '#fff',
    },
    {
      text: 'Request more models',
      inverted: false,
      icon: IconBox,
      onCLick: () => {
        window.open(
          'https://docs.google.com/forms/d/e/1FAIpQLSd2wXYerD3qrGO3A-BeJjCHFxvYN0HYRGSCOMPKtZiSuBf8OA/viewform',
          '_blank',
        );
      },
      bgColor: '#fff',
    },
    {
      text: 'Buy Credits',
      inverted: true,
      icon: IconMoneybag,
      onCLick: () => {
        // window.open('/?ref=buy-credits', '_self');
        router.push('/?ref=buy-credits');
      },
      bgColor: '#000',
    },
  ];

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: '1px 0 1px 0',
      }}
      className="fixed top-0 w-[100vw] z-[1] bg-white dark:bg-[#343541] border-black dark:border-white"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <div
          className="text-3xl text-black dark:text-white"
          style={{
            fontWeight: '500',
            marginLeft: '1.3rem',
          }}
        >
          AI APP STORE (Cortex)
        </div>
      </div>
      <div className="flex">
        {buttons.map((button, index) => {
          const Icon = button.icon;
          return (
            <button
              key={index}
              style={{
                alignItems: 'center',
                fontSize: '0.85rem',
                backgroundColor: button.bgColor,
                color: button.inverted ? 'white' : 'black',
                padding: '1.2rem',
                fontWeight: '500',
                display: isMobile && index < 3 ? 'none' : 'flex',
              }}
              onClick={() => {
                button.onCLick();
              }}
            >
              {button.text} <Icon className="ml-2" />
            </button>
          );
        })}

        <p
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.85rem',
            backgroundColor: 'black',
            color: 'white',
            padding: '2rem',
            fontWeight: '500',
            borderLeft: '1px solid white',
            cursor: 'pointer',
          }}
        >
          X
        </p>
      </div>
    </header>
  );
};

export const Body = () => {
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState([
    'all',
    ...modelTypes.map((m) => m.id),
  ]);
  const [activeUseCases, setActiveUseCases] = useState<string[]>([
    'all',
    ...modelUseCases.map((m) => m.id),
  ]);

  const FilterTag = ({
    name,
    id,
    color,
    Icon,
  }: {
    name: string;
    id: string;
    color: string;
    Icon: FunctionComponent<{ color: string; size: number }>;
  }) => {
    const handleOnClick = () => {
      if (id === 'all') {
        setActiveFilters(['all', ...modelTypes.map((m) => m.id)]);
      } else {
        if (activeFilters.length === 1 && activeFilters.includes(id)) {
          setActiveFilters(['all', ...modelTypes.map((m) => m.id)]);
        } else {
          setActiveFilters([id]);
        }
      }
    };

    return (
      <button
        onClick={handleOnClick}
        className={`flex items-center border border-[#DEDEDE] border-solid rounded ${
          activeFilters.includes(id) ? '' : 'filter grayscale opacity-70'
        }`}
      >
        <div className="p-1" style={{ backgroundColor: `${color}33` }}>
          <Icon color={color} size={20} />
        </div>
        <p className="text-[13px] text-black dark:text-white mx-1.5 whitespace-nowrap">
          {name}
        </p>
      </button>
    );
  };

  const FilterUseCase = ({
    name,
    id,
    color,
    Icon,
  }: {
    name: string;
    id: string;
    color: string;
    Icon: FunctionComponent<{ color: string; size: number }>;
  }) => {
    const handleOnClick = () => {
      console.log(id);
      if (id === 'all') {
        setActiveUseCases(['all', ...modelUseCases.map((m) => m.id)]);
      } else {
        if (activeUseCases.length === 1 && activeUseCases.includes(id)) {
          setActiveUseCases([...modelUseCases.map((m) => m.id)]);
        } else {
          setActiveUseCases([id]);
        }
      }
    };

    return (
      <button
        onClick={() => handleOnClick()}
        className={`flex items-center border border-[#DEDEDE] border-solid rounded ${
          activeUseCases.includes(id) ? '' : 'filter grayscale opacity-70'
        }`}
      >
        <div className="p-1" style={{ backgroundColor: `${color}33` }}>
          <Icon color={color} size={20} />
        </div>
        <p className="text-[13px] text-black dark:text-white mx-1.5 whitespace-nowrap">
          {name}
        </p>
      </button>
    );
  };

  return (
    <div className="min-h-[100vh] pt-[90px] bg-[#efefef] dark:bg-[#343541]">
      <div className="p-8 bg-[#EFEFEF] dark:bg-[#343541] border-b border-b-black dark:border-white">
        <h1
          style={{
            fontWeight: '300',
          }}
          className="text-3xl text-black dark:text-white"
        >
          There are different types of AIs. You have the freedom to make your
          choice.
          <br />
          Star to add AI to AI FastSwitcher.
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row">
        <div className="flex-[1] lg:flex-[0.25] bg-white dark:bg-[#343541] border-b-black dark:border-b-white">
          <div className="lg:sticky top-[90px]">
            <div className="flex bg-white dark:bg-[#343541]">
              <div className="flex items-center w-full p-4 bg-white dark:bg-[#343541] border-b border-black border-solid dark:border-white">
                <IconSearch color="#707070" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-black text-base p-3 bg-white dark:bg-[#343541]"
                  placeholder="Search"
                ></input>
              </div>
            </div>

            <div className="flex bg-white dark:bg-[#343541]">
              <div className="p-4 w-full bg-white dark:bg-[#343541] border-b border-black border-solid dark:border-white">
                <p className="mb-2 text-base text-black dark:text-white">
                  TYPE OF AI
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <FilterTag
                    name="All Models"
                    id="all"
                    color="#000000"
                    Icon={IconBox}
                  />
                  {modelTypes.map((type) => (
                    <FilterTag
                      key={type.id}
                      name={type.name}
                      id={type.id}
                      color={type.color}
                      Icon={type.icon}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex bg-white dark:bg-[#343541]">
              <div className="p-4 w-full bg-white dark:bg-[#343541] border-b border-black border-solid dark:border-white">
                <p className="mb-2 text-base text-black dark:text-white">
                  USE CASE
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <FilterUseCase
                    name="Any"
                    id="all"
                    color="#000000"
                    Icon={IconBox}
                  />
                  {modelUseCases.map((useCase) => (
                    <FilterUseCase
                      key={useCase.id}
                      name={useCase.name}
                      id={useCase.id}
                      color={useCase.color}
                      Icon={useCase.icon}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-[1] lg:flex-[0.75]">
          <Models
            search={search}
            activeFilters={activeFilters}
            activeUseCases={activeUseCases}
          />
        </div>
      </div>
    </div>
  );
};

const Models = ({
  search,
  activeFilters,
  activeUseCases,
}: {
  search: string;
  activeFilters: any;
  activeUseCases: any;
}) => {
  const { models } = useModel();
  const [loader, setLoader] = useState(true);

  useEffect(() => {
    models.length > 0 && setLoader(false);
  }, [models]);

  return (
    <div className="p-4 md:p-6 grid grid-cols-1 gap-6 md:grid-cols-2">
      {loader &&
        Array.from(Array(6).keys()).map((i) => (
          <div
            key={i}
            role="status"
            className="flex items-center justify-center h-52 max-w-xl bg-gray-300 rounded-lg animate-pulse dark:bg-gray-700"
          >
            <svg
              className="w-10 h-10 text-gray-200 dark:text-gray-600"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 16 20"
            >
              <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.98 2.98 0 0 0 .13 5H5Z" />
              <path d="M14.066 0H7v5a2 2 0 0 1-2 2H0v11a1.97 1.97 0 0 0 1.934 2h12.132A1.97 1.97 0 0 0 16 18V2a1.97 1.97 0 0 0-1.934-2ZM9 13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2Zm4 .382a1 1 0 0 1-1.447.894L10 13v-2l1.553-1.276a1 1 0 0 1 1.447.894v2.764Z" />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        ))}

      {models
        .filter((model) =>
          search
            ? model.name.toLowerCase().includes(search.toLowerCase())
            : true,
        )
        .filter((model) => activeFilters.includes(model.type[0]))
        .filter((model) =>
          activeUseCases.length
            ? model.tags.some((tag) => activeUseCases.includes(tag))
            : true,
        )
        .map((model) => (
          <CloudModelContent model={model} key={model.id} />
        ))}
    </div>
  );
};

const CloudModelContent: React.FC<CloudModelContentProps> = ({ model }) => {
  const router = useRouter();
  const [descriptionActive, setDescriptionActive] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);
  const handleFavorite = () => {
    const favoriteModelsJson = localStorage.getItem('favoriteModels');
    const favoriteModels = favoriteModelsJson
      ? JSON.parse(favoriteModelsJson)
      : [];
    const modelIndex = favoriteModels.indexOf(model.id);

    if (modelIndex === -1) {
      favoriteModels.push(model.id);
    } else {
      favoriteModels.splice(modelIndex, 1);
    }

    localStorage.setItem('favoriteModels', JSON.stringify(favoriteModels));

    setIsFavorite((curr: boolean) => !curr);
    toast.success(
      `${model.name} ${
        isFavorite ? 'removed from' : 'added to'
      } AI FastSwitcher`,
    );
  };

  const handleModelChange = () => {
    localStorage.setItem('selectedModel', JSON.stringify(model));
    router.push('/');
  };

  const Tag = ({
    name,
    color,
    Icon,
  }: {
    name: string;
    color: string;
    Icon: FunctionComponent<{ color: string; size: number }>;
  }) => {
    return (
      <div
        className={`flex items-center mr-2 border border-[#DEDEDE] border-solid rounded`}
      >
        <div className="p-1" style={{ backgroundColor: `${color}33` }}>
          <Icon color={color} size={20} />
        </div>
        <p className="text-[13px] text-black dark:text-white mx-1.5 whitespace-nowrap">
          {name}
        </p>
      </div>
    );
  };

  useEffect(() => {
    const favoriteModels = localStorage.getItem('favoriteModels');
    setIsFavorite(
      favoriteModels ? JSON.parse(favoriteModels).includes(model.id) : false,
    );
  }, []);

  // Local model
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({
    percentage: 0,
    downloadedBytes: 0,
    contentLength: 0,
    selectedModel: '',
  });
  const [downloadStarted, setDownloadStarted] = useState({
    started: false,
    selectedModel: '',
  });

  useEffect(() => {
    setIsDownloaded(isModelDownloaded(model.id));

    if (!socket) return;
    socket.on('download_canceled', () => {
      window.location.reload();
    });

    socket.on('download_started', (data) => {
      console.log('download_started');
      console.log(data);
      setDownloadProgress({
        percentage: 0,
        downloadedBytes: 0,
        contentLength: 0,
        selectedModel: '',
      });
      setDownloadStarted({
        selectedModel: data.selectedModel,
        started: true,
      });
    });

    socket.on(
      'download_complete',
      (data: { modelData: any; downloadPath: string }) => {
        setIsDownloaded(true);
        saveLocalModels(data, data.downloadPath);
        window.location.reload();
      },
    );
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on(
      'download_progress',
      (data: {
        percentage: number;
        downloadedBytes: number;
        contentLength: number;
        selectedModel: string;
      }) => {
        console.log('downloadProgress');
        console.log(data);
        setDownloadProgress(data);
      },
    );
  }, [downloadProgress]);

  const handleDownloadStart = () => {
    if (!socket) return;
    socket.emit('download_model', {
      model: model.id,
      description: model.description,
      fileSize: model.fileSize,
      requiredRAM: model.requiredRAM,
      downloadURL: model.downloadURL,
      tags: model.tags,
      image: model.image,
      id: model.id,
    });
  };

  const handleCancel = () => {
    if (!socket) return;
    if (
      confirm(
        'Are you sure you want to cancel the download? This action cannot be undone.',
      )
    ) {
      socket.emit('cancel_download');
      setDownloadProgress({
        percentage: 0,
        downloadedBytes: 0,
        contentLength: 0,
        selectedModel: '',
      });
    }
  };

  const handleDelete = () => {
    if (!socket) return;
    if (
      confirm(
        'Are you sure you want to delete the model? This action cannot be undone.',
      )
    ) {
      socket.emit('delete_model', currentModelPath(model));
      deleteModel(model.id);
      setIsDownloaded(false);
      window.location.reload();
    }
  };

  const handleModelChoose = () => {
    if (!socket) return;
    socket.emit('choose_model', {
      model: model.id,
      description: model.description,
      fileSize: model.fileSize,
      requiredRAM: model.requiredRAM,
      downloadURL: model.downloadURL,
      tags: model.tags,
      image: model.image,
      id: model.id,
    });
  };

  return (
    <>
      <div className="flex bg-white rounded-md">
        <div className="flex-1 flex flex-col p-4">
          <div className="flex-1 flex flex-col relative">
            <div className="flex justify-between mb-2">
              <h3 className="text-lg font-bold text-black">{model.name}</h3>
              {(model.endpoint !== 'edge' || isDownloaded) && (
                <button className="ml-2" onClick={handleFavorite}>
                  {isFavorite ? (
                    <div style={{ color: '#0000FF' }}>
                      <IconStarFilled />
                    </div>
                  ) : (
                    <IconStar color="#0000FF" />
                  )}
                </button>
              )}
            </div>

            {modelUseCases.filter((modelUseCase) =>
              model.tags.includes(modelUseCase.id),
            ).length ? (
              <div className="flex mb-4">
                {modelUseCases
                  .filter((modelUseCase) =>
                    model.tags.includes(modelUseCase.id),
                  )
                  .map((useCase) => (
                    <Tag
                      key={useCase.id}
                      name={useCase.name}
                      color={useCase.color}
                      Icon={useCase.icon}
                    />
                  ))}
              </div>
            ) : null}

            <p
              className="mb-3 text-xs text-[gray] md:text-sm"
              style={{
                minHeight: 62,
              }}
            >
              <span
                className="pr-1 overflow-hidden text-ellipsis"
                style={{
                  display: descriptionActive ? 'inline' : '-webkit-box',
                  WebkitLineClamp: '3',
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {model.description}
              </span>
              {model.description.length > 70 && (
                <>
                  {descriptionActive ? (
                    <button
                      className="text-[#0000FF]"
                      onClick={() => setDescriptionActive(false)}
                    >
                      less
                    </button>
                  ) : (
                    <button
                      className="text-[#0000FF]"
                      onClick={() => setDescriptionActive(true)}
                    >
                      more
                    </button>
                  )}
                </>
              )}
            </p>

            {model.endpoint === 'edge' ? (
              <>
                {isDownloaded && !downloadStarted.started && (
                  <div className="flex items-center justify-end mt-auto">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        flexDirection: 'row',
                      }}
                    >
                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '0.85rem',
                          backgroundColor: '#000',
                          marginLeft: '0.25rem',
                          padding: '0.85rem',
                          fontWeight: '500',
                          borderLeft: '1px solid black',
                          color: 'white',
                        }}
                        onClick={() => {
                          handleModelChoose();
                        }}
                      >
                        Change Path <IconSelect className="ml-2" />
                      </button>
                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '0.85rem',
                          backgroundColor: '#B00B1E',
                          padding: '0.85rem',
                          fontWeight: '500',
                          borderLeft: '1px solid black',
                          color: 'white',
                        }}
                        onClick={() => {
                          handleDelete();
                        }}
                      >
                        Delete <IconX className="ml-2" />
                      </button>
                    </div>
                  </div>
                )}

                {!isDownloaded &&
                  !downloadStarted.started &&
                  model.downloadURL && (
                    <div className="">
                      <div className="flex justify-center items-center mb-3 pl-4">
                        <IconSquareCheck fill="#0000FF" color="#fff" />
                        <span className="text-md ml-1 text-black">
                          <span className="mr-4 text-sm">
                            Size: <strong>{model.fileSize} GB</strong>
                          </span>
                        </span>

                        <IconSquareCheck fill="#0000FF" color="#fff" />
                        <span className="text-sm ml-1 text-black">
                          <span>
                            RAM: <strong> {model.requiredRAM} GB</strong>
                          </span>
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          flexDirection: 'row',
                        }}
                      >
                        <button
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.85rem',
                            backgroundColor: '#000',
                            marginLeft: '0.25rem',
                            padding: '0.85rem',
                            fontWeight: '500',
                            borderLeft: '1px solid black',
                            color: 'white',
                          }}
                          onClick={() => {
                            handleModelChoose();
                          }}
                        >
                          Select Model File <IconSelect className="ml-2" />
                        </button>
                        <button
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.85rem',
                            backgroundColor: '#0000FF',
                            padding: '0.85rem',
                            fontWeight: '500',
                            borderLeft: '1px solid black',
                            color: 'white',
                          }}
                          onClick={() => {
                            handleDownloadStart();
                          }}
                        >
                          Download <IconDownload className="ml-2" />
                        </button>
                      </div>
                    </div>
                  )}

                {!isDownloaded &&
                  !downloadStarted.started &&
                  !model.downloadURL && (
                    <div
                      className="flex items-center justify-between mt-auto"
                      style={{
                        borderTop: '1px solid #000',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          width: '100%',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.85rem',
                            backgroundColor: '#0000ff',
                            marginLeft: '0.25rem',
                            padding: '0.85rem',
                            fontWeight: '500',
                            borderLeft: '1px solid black',
                            color: 'white',
                            width: '100%',
                          }}
                        >
                          Coming Soon
                        </span>
                      </div>
                    </div>
                  )}

                {downloadStarted.started &&
                  downloadStarted.selectedModel === model.id && (
                    <>
                      <div
                        className="flex items-center justify-between mt-auto"
                        style={{
                          position: 'relative',
                        }}
                      >
                        <div className="flex rounded">
                          <div className="flex items-center justify-between row">
                            <span
                              style={{
                                fontSize: '0.85rem',
                                color: 'gray',
                              }}
                            >
                              {downloadProgress.downloadedBytes > 0 ? (
                                <span>
                                  {(
                                    downloadProgress.downloadedBytes / 1000000
                                  ).toFixed(0)}{' '}
                                  MB /{' '}
                                  {(
                                    downloadProgress.contentLength / 1000000
                                  ).toFixed(0)}{' '}
                                  MB
                                </span>
                              ) : (
                                <span>Download Starting</span>
                              )}
                            </span>
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                          }}
                        >
                          <button
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '0.85rem',
                              backgroundColor: '#B00B1E',
                              fontWeight: '500',
                              color: '#fff',
                              padding: '0.750rem',
                              right: 0,
                            }}
                            onClick={() => {
                              handleCancel();
                            }}
                          >
                            Cancel <IconX className="ml-2" />
                          </button>
                        </div>
                      </div>

                      <div
                        className="flex items-center justify-between mt-4"
                        style={{
                          border: '1px solid gray',
                          borderRadius: 15,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${downloadProgress.percentage}%`,
                            height: 15,
                            backgroundColor: '#0000ff',
                            borderRadius: '15px 0 0 15px',
                          }}
                          className="transition-width duration-300 ease-linear"
                        />
                      </div>
                    </>
                  )}
              </>
            ) : (
              <div className="sm:flex justify-between">
                <div className="flex items-center mb-3 sm:mb-0">
                  <IconCircleLetterF color="#5C5C5C" />
                  <p className="text-[#5C5C5C] ml-1 translate-y-[1px]">
                    0 credits/
                    {model?.type.includes('image') ? 'image' : 'message'}
                  </p>
                </div>
                <button
                  className="text-[#0000FF] ml-1"
                  onClick={() => handleModelChange()}
                >
                  Try now
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default function AICortex() {
  return (
    <>
      <Head>
        <title>AI App Store (Cortex) | FreedomGPT</title>
        <meta
          name="description"
          content="FreedomGPT 2.0 is your launchpad for AI. No technical knowledge should be required to use the latest AI models in both a private and secure manner. Unlike ChatGPT, the Liberty model included in FreedomGPT will answer any question without censorship, judgement, or risk of ‘being reported.’"
        />
        <meta
          name="viewport"
          content="height=device-height ,width=device-width, initial-scale=1, user-scalable=no"
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="FreedomGPT" />
        <meta
          property="og:description"
          content="FreedomGPT 2.0 is your launchpad for AI. No technical knowledge should be required to use the latest AI models in both a private and secure manner. Unlike ChatGPT, the Liberty model included in FreedomGPT will answer any question without censorship, judgement, or risk of ‘being reported.‘"
        />
        <meta property="og:url" content="https://twitter.com/freedomgpt" />
        <meta property="og:site_name" content="FreedomGPT" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FreedomGPT" />
        <meta
          name="twitter:description"
          content="FreedomGPT 2.0 is your launchpad for AI. No technical knowledge should be required to use the latest AI models in both a private and secure manner. Unlike ChatGPT, the Liberty model included in FreedomGPT will answer any question without censorship, judgement, or risk of ‘being reported.‘"
        />
        <meta name="twitter:site" content="@freedomgpt" />
        <meta name="twitter:creator" content="@freedomgpt" />

        <meta
          property="og:image"
          content="https://chat.freedomgpt.com/image.png"
        />

        <meta
          property="twitter:image"
          content="https://chat.freedomgpt.com/image.png"
        />

        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <Body />
    </>
  );
}
