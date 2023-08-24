import { useModel } from "@/context/ModelSelection";
import HomeContext from "@/pages/api/home/home.context";
import socket from "@/socket/socket";
import { CloudModel, PluginWithModel } from "@/types/plugin";
import {
  getDownloadedCloudModels,
  isAnyCloudModelDownloaded,
} from "@/utils/app/cloudModels";
import {
  getLocalDownloadedModels,
  isAnyLocalModelDownloaded,
} from "@/utils/app/localModels";
import { useTranslation } from "next-i18next";
import { useContext, useRef, useState } from "react";

export const ModelSelect = ({
  setPlugin,
}: {
  setPlugin: (plugin: any) => void;
}) => {
  const { t } = useTranslation("chat");

  const { setSelectedModel, selectedModel, selectLocalModel } = useModel();
  const [threads, setThreads] = useState(5);

  const selectRef = useRef<HTMLSelectElement>(null);

  const { dispatch: homeDispatch } = useContext(HomeContext);

  return (
    <div
      className="flex flex-col"
      style={{
        width: "40vw",
      }}
    >
      <label className="mb-5 mt-4 text-center text-neutral-700 dark:text-neutral-400">
        {t("Select a Model")}
      </label>
      <div className="w-full  border-neutral-200 bg-transparent pr-2 text-neutral-900 dark:border-neutral-600 dark:text-white">
        <select
          ref={selectRef}
          className="w-full cursor-pointer bg-transparent p-2 m-2"
          style={{
            height: "5rem",
            border: "1px solid #000",
          }}
          placeholder={t("Select a Model") || ""}
          disabled={
            localStorage.getItem("apiKey") === null &&
            !isAnyLocalModelDownloaded() &&
            !isAnyCloudModelDownloaded()
          }
          onChange={(e) => {
            console.log("e.target.value", e.target.value);
            homeDispatch({ field: "messageIsStreaming", value: false });

            if (!e.target.value) {
              setSelectedModel("");
              socket.emit("kill_process");
              setPlugin("");
              return;
            }

            setPlugin(
              getLocalDownloadedModels().find(
                (plugin: PluginWithModel) => plugin.config.id === e.target.value
              ) ||
                getDownloadedCloudModels().find(
                  (plugin: CloudModel) => plugin.config.id === e.target.value
                )
            );

            setSelectedModel(e.target.value);

            if (e.target.value) {
              const selectedPluginId = e.target.value;
              const selectedPlugin = getLocalDownloadedModels().find(
                (plugin: PluginWithModel) =>
                  plugin.config.id === selectedPluginId
              );

              if (selectedPlugin) {
                selectLocalModel({
                  model: selectedPlugin.config.id,
                  FILEPATH: getLocalDownloadedModels().find(
                    (plugin: PluginWithModel) =>
                      plugin.config.id === selectRef.current?.value
                  )?.FILEPATH,
                });
              }
            }
          }}
          value={selectedModel}
        >
          {localStorage.getItem("apiKey") && (
            <option key="chatgpt" className="options" value="">
              ChatGPT
            </option>
          )}

          {!localStorage.getItem("apiKey") && !isAnyLocalModelDownloaded() && (
            <option key="" value="" disabled>
              No Models Available
            </option>
          )}

          {getLocalDownloadedModels().map((plugin: PluginWithModel) => {
            return (
              <option key={plugin.config.id} value={plugin.config.id}>
                {plugin.config.model.toLocaleUpperCase()}
              </option>
            );
          })}

          {getDownloadedCloudModels().map((model: CloudModel) => {
            return (
              <option key={model.config.id} value={model.config.id}>
                {model.config.model.toLocaleUpperCase()}
              </option>
            );
          })}
        </select>
      </div>

      {selectRef.current?.value &&
        !localStorage.getItem("apiKey") &&
        !selectedModel && (
          <>
            <label className="mb-2 text-center text-black dark:text-white mt-5">
              Number of Threads to use (Optional)
            </label>

            <span className="mt-2 mb-1 text-center text-neutral-900 dark:text-neutral-100">
              {threads}
            </span>
            <input
              className="cursor-pointer"
              type="range"
              min={0}
              max={8}
              step={1}
              value={threads}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                const newValue = parseFloat(event.target.value);
                setThreads(newValue);
              }}
            />
            <button
              className="py-2 px-4 rounded-md bg-blue-500 hover:bg-blue-600 text-white font-medium mt-5"
              onClick={() => {
                console.log(
                  selectRef.current?.value,
                  getLocalDownloadedModels()[0].id
                );

                selectLocalModel({
                  model:
                    selectRef.current?.value ||
                    getLocalDownloadedModels()[0].id,
                  FILEPATH: getLocalDownloadedModels().find(
                    (plugin: PluginWithModel) =>
                      plugin.config.id ===
                      (selectRef.current?.value ||
                        getLocalDownloadedModels()[0].id)
                  )?.FILEPATH,
                  extraArgs: {
                    t: `${threads}`,
                  },
                });

                setPlugin(
                  getLocalDownloadedModels().find(
                    (plugin: PluginWithModel) =>
                      plugin.config.id ===
                      (selectRef.current?.value ||
                        getLocalDownloadedModels()[0].id)
                  )
                );
                setSelectedModel(
                  selectRef.current?.value || getLocalDownloadedModels()[0].id
                );
              }}
            >
              {t("Start Chatting")}
            </button>

            {/* <ul className="mt-2 pb-8 flex justify-between px-[24px] text-neutral-900 dark:text-neutral-100">
              <li className="flex justify-center">
                <span>{t("Precise")}</span>
              </li>
              <li className="flex justify-center">
                <span>{t("Neutral")}</span>
              </li>
              <li className="flex justify-center">
                <span>{t("Creative")}</span>
              </li>
            </ul> */}
          </>
        )}
    </div>
  );
};
