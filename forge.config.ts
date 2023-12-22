import MakerDMG from "@electron-forge/maker-dmg";
import MakerSquirrel from "@electron-forge/maker-squirrel";
import MakerZIP from "@electron-forge/maker-zip";
import type { ForgeConfig } from "@electron-forge/shared-types";
import * as dotenv from "dotenv";

dotenv.config();

const config: ForgeConfig = {
  packagerConfig: {
    icon:
      process.platform === "win32"
        ? "./src/appicons/icons/win/icon.ico"
        : "./src/appicons/icons/mac/ico",
    extraResource: "./models",
    osxSign: {
      identity: "Developer ID Application: Age of AI, LLC (TS4W464GMN)",
      optionsForFile: () => {
        return {
          entitlements: "./macbuild/entitlements.mac.plist",
        };
      },
    },
    osxNotarize: {
      tool: "notarytool",
      appleId: process.env.APPLE_ID as string,
      appleIdPassword: process.env.APPLE_ID_PASSWORD as string,
      teamId: "TS4W464GMN",
    },
    ignore: [/^\/llama\.cpp/, /^\/docker-app/, /^\/\.env/],
  },
  buildIdentifier: process.env.IS_BETA ? "beta" : "prod",
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ["darwin"]),
    new MakerDMG({}, ["darwin"]),
    new MakerSquirrel(
      {
        name: "FreedomGPT",
        setupIcon: "./src/appicons/icons/win/icon.ico",
        certificateFile: process.env["WINDOWS_PFX_FILE"],
        certificatePassword: process.env["WINDOWS_PFX_PASSWORD"],
        owners: "Age of AI, LLC",
        authors: "Age of AI, LLC",
        copyright: "Age of AI, LLC",
      },
      ["win32"]
    ),
  ],
  plugins: [],
};

export default config;
