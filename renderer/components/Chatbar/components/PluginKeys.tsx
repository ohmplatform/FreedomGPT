import ModelStore from "@/components/ModelStore/Store";
import { IconUserCircle } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export type Model = {
  config: {
    FILEPATH: string | null;
    model: string;
    downloadURL: string;
    requiredRAM: number;
    fileSize: number;
    id: string;
  };
};

export const PluginKeys = ({ show = false }: { show?: boolean }) => {
  const { t } = useTranslation("sidebar");
  const [isChanging, setIsChanging] = useState(show);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        window.addEventListener("mouseup", handleMouseUp);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      window.removeEventListener("mouseup", handleMouseUp);
      setIsChanging(false);
    };

    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return (
    <>
      <div className="w-full mt-3 text-left text-neutral-700 dark:text-neutral-400 flex items-center">
        <button
          className="flex w-full cursor-pointer select-none items-center gap-3 py-3 px-3 text-[14px] leading-3 text-white transition-colors duration-200 hover:bg-gray-500/10"
          onClick={() => setIsChanging(true)}
          style={{
            backgroundColor: "#0000ff",
          }}
        >
          <div>
            <IconUserCircle size={18} />
          </div>
          <span>Connect AI</span>
        </button>
      </div>
      {isChanging && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
          style={{
            zIndex: 90,
          }}
        >
          <div className="fixed inset-0 z-10 overflow-hidden">
            <div className="flex ">
              <div ref={modalRef} role="dialog">
                <ModelStore setIsChanging={setIsChanging} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
