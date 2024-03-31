import { IconCircleLetterF } from '@tabler/icons-react';
import { Fragment, useContext } from 'react';

import Link from 'next/link';

import { modelTypes } from '@/types/plugin';

import HomeContext from '@/pages/api/home/home.context';

import { useModel } from '@/context/ModelSelection';
import socket from '@/socket/socket';

export const ModelSelect = ({
  setShowModels,
}: {
  setShowModels: (value: boolean) => void;
}) => {
  const { models, setSelectedModel } = useModel();
  const {
    state: { lightMode },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const isLightMode = lightMode === 'light';

  const storedFavoritedModels = localStorage.getItem('favoriteModels');
  const favoriteModels = storedFavoritedModels
    ? JSON.parse(storedFavoritedModels)
    : [];

  const modelsGrouped = modelTypes
    .map((type) => ({
      ...type,
      cloudModels: models
        .filter((m) => favoriteModels.includes(m.id))
        .filter((m) => m.type.includes(type.id)),
    }))
    .filter((type) => type.cloudModels.length);

  const Model = ({ model }: { model: any }) => {
    const thisModelData = models.find((m) => m.id === model.id);

    return (
      <button
        onClick={() => {
          homeDispatch({ field: 'messageIsStreaming', value: false });

          localStorage.setItem('selectedModel', JSON.stringify(model));

          setSelectedModel(model);
          setShowModels(false);
          if (socket) socket.emit('kill_process');
        }}
        className="p-3 border-b border-[#DEDEDE] border-solid"
      >
        <div className="flex justify-between">
          <p className="text-black text-lg font-medium dark:text-[#fff]">
            {model.name}
          </p>
          <div>
            {thisModelData?.tags.filter((t) => t !== 'all').length ? (
              <p className="bg-gray-300 rounded-md text-black text-xs py-1 px-2">
                {thisModelData?.tags.filter((t) => t !== 'all').join(', ')}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center">
          <IconCircleLetterF
            color={isLightMode ? '#5C5C5C' : '#dbdbdb'}
            size={16}
          />
          <p className="text-[#5C5C5C] ml-1 dark:text-[#dbdbdb]">
            0 credits/
            {thisModelData?.type.includes('image') ? 'image' : 'message'}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col w-full bg-white dark:bg-[#444654]">
      {modelsGrouped.map((group) => (
        <Fragment key={group.id}>
          <div
            className={`flex items-center border border-[#DEDEDE] border-solid rounded`}
          >
            <div
              className="p-1"
              style={{ backgroundColor: `${group.color}33` }}
            >
              {<group.icon color={group.color} size={20} />}
            </div>
            <p className="text-black ml-1.5 dark:text-white">{group.name}</p>
          </div>
          {group.cloudModels.map((model) => (
            <Model model={model} key={model.id} />
          ))}
        </Fragment>
      ))}
      <Link href="ai-cortex" className="flex items-center justify-center my-6">
        <div className="flex items-center justify-between py-2 px-3 rounded bg-[blue]">
          <p className="mr-5 text-white font-bold underline">
            Select more AIs now
          </p>
          <span className="p-1 bg-white rounded font-medium text-[blue]">
            {models.filter((m) => m.isNew).length} NEW
          </span>
        </div>
      </Link>
    </div>
  );
};
