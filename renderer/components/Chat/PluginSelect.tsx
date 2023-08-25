import { useModel } from "@/context/ModelSelection";
import { CloudModel, PluginWithModel } from "@/types/plugin";
import { getDownloadedCloudModels } from "@/utils/app/cloudModels";
import { getLocalDownloadedModels } from "@/utils/app/localModels";
import { useTranslation } from "next-i18next";
import { FC, useEffect, useRef } from "react";

interface Props {
  plugin: PluginWithModel | null;
  onPluginChange: (plugin: PluginWithModel) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLSelectElement>) => void;
}

export const PluginSelect: FC<Props> = ({
  plugin,
  onPluginChange,
  onKeyDown,
}) => {
  const { t } = useTranslation("chat");

  const { selectedModel } = useModel();

  const selectRef = useRef<HTMLSelectElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>) => {
    const selectElement = selectRef.current;
    const optionCount = selectElement?.options.length || 0;

    if (e.key === "/" && e.metaKey) {
      e.preventDefault();
      if (selectElement) {
        selectElement.selectedIndex =
          (selectElement.selectedIndex + 1) % optionCount;
        selectElement.dispatchEvent(new Event("change"));
      }
    } else if (e.key === "/" && e.shiftKey && e.metaKey) {
      e.preventDefault();
      if (selectElement) {
        selectElement.selectedIndex =
          (selectElement.selectedIndex - 1 + optionCount) % optionCount;
        selectElement.dispatchEvent(new Event("change"));
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectElement) {
        selectElement.dispatchEvent(new Event("change"));
      }

      onPluginChange(
        getLocalDownloadedModels().find(
          (plugin: PluginWithModel) =>
            plugin.config.model === selectElement?.selectedOptions[0].innerText
        ) as PluginWithModel
      );
    } else {
      onKeyDown(e);
    }
  };

  useEffect(() => {
    if (selectRef.current) {
      selectRef.current.focus();
    }
  }, []);

  return (
    <div className="flex flex-col">
      <div className="mb-1 w-full rounded border border-neutral-200 bg-transparent pr-2 text-neutral-900 dark:border-neutral-600 dark:text-white">
        <select
          ref={selectRef}
          className="w-full cursor-pointer bg-transparent p-2"
          placeholder={t("Select a plugin") || ""}
          value={selectedModel}
          onChange={(e) => {
            onPluginChange(
              getLocalDownloadedModels().find(
                (plugin: PluginWithModel) => plugin.config.id === e.target.value
              ) ||
                getDownloadedCloudModels().find(
                  (plugin: CloudModel) => plugin.config.id === e.target.value
                )
            );
          }}
          onKeyDown={(e) => {
            handleKeyDown(e);
          }}
        >
          {localStorage.getItem("apiKey") && (
            <option
              key="chatgpt"
              value="chatgpt"
              className="dark:bg-[#343541] dark:text-white"
            >
              ChatGPT
            </option>
          )}

          {getLocalDownloadedModels().map((plugin: PluginWithModel) => {
            return (
              <option
                key={plugin.config.id}
                value={plugin.config.id}
                className="dark:bg-[#343541] dark:text-white"
              >
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
    </div>
  );
};
