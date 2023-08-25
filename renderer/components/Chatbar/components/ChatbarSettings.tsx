import { Import } from "../../Settings/Import";
import { Key } from "../../Settings/Key";
import { SidebarButton } from "../../Sidebar/SidebarButton";
import ChatbarContext from "../Chatbar.context";
import { ClearConversations } from "./ClearConversations";
import { PluginKeys } from "./PluginKeys";
import { SettingDialog } from "@/components/Settings/SettingDialog";
import HomeContext from "@/pages/api/home/home.context";
import socket from "@/socket/socket";
import { IconFileExport, IconGift, IconSettings } from "@tabler/icons-react";
import { useTranslation } from "next-i18next";
import { useContext, useState } from "react";

export const ChatbarSettings = () => {
  const { t } = useTranslation("sidebar");
  const [isSettingDialogOpen, setIsSettingDialog] = useState<boolean>(false);

  const {
    state: {
      apiKey,
      lightMode,
      serverSideApiKeyIsSet,
      serverSidePluginKeysSet,
      conversations,
    },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const {
    handleClearConversations,
    handleImportConversations,
    handleExportData,
    handleApiKeyChange,
  } = useContext(ChatbarContext);

  return (
    <div className="flex flex-col items-center space-y-1 border-t border-white/20 pt-1 text-sm">
      <PluginKeys />

      {conversations.length > 0 ? (
        <ClearConversations onClearConversations={handleClearConversations} />
      ) : null}

      <Import onImport={handleImportConversations} />

      <SidebarButton
        text={t("Export data")}
        icon={<IconFileExport size={18} />}
        onClick={() => handleExportData()}
      />

      <SidebarButton
        text={t("Settings")}
        icon={<IconSettings size={18} />}
        onClick={() => setIsSettingDialog(true)}
      />

      <SidebarButton
        text={t("Donate Now")}
        icon={<IconGift size={18} />}
        onClick={() => {
          socket.emit("open_donation");
        }}
      />

      <SettingDialog
        open={isSettingDialogOpen}
        onClose={() => {
          setIsSettingDialog(false);
        }}
      />
    </div>
  );
};
