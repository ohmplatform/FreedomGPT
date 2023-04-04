import MakerDMG from "@electron-forge/maker-dmg";
import MakerWix from "@electron-forge/maker-wix";
import MakerZIP from "@electron-forge/maker-zip";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
import type { ForgeConfig } from "@electron-forge/shared-types";
import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";
import * as dotenv from "dotenv";
dotenv.config();

const config: ForgeConfig = {
  packagerConfig: {
    icon:
      process.platform === "win32"
        ? "./src/appicons/icons/win/icon.ico"
        : "./src/appicons/icons/mac/ico",
    extraResource: "./src/models",
    osxSign: {
      identity: process.env.APPLE_IDENTITY,
      optionsForFile: () => {
        return {
          entitlements: "./build/entitlements.mac.plist",
        };
      },
    },
    osxNotarize: {
      tool: "notarytool",
      appleId: process.env.APPLE_ID as string,
      appleIdPassword: process.env.APPLE_ID_PASSWORD as string,
      teamId: process.env.APPLE_TEAM_ID as string,
    },
  },
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "ohmplatform",
          name: "freedom-gpt-electron-app",
        },
        authToken: process.env.GITHUB_AUTH_TOKEN,
        prerelease: false,
        draft: false,
      },
    },
  ],
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ["darwin"]),
    new MakerDMG({}, ["darwin"]),
    new MakerWix(
      {
        name: "FreedomGPT",
        description: "FreedomGPT",
        manufacturer: process.env.MANUFACTURER_NAME as string,
        ui: {
          chooseDirectory: true,
        },
        icon: "./src/appicons/icons/win/icon.ico",
      },
      ["win32"]
    ),
  ],
  plugins: [
    new WebpackPlugin({
      mainConfig,
      devContentSecurityPolicy: "connect-src 'self' * 'unsafe-eval'",
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: "./src/index.html",
            js: "./src/renderer.ts",
            name: "main_window",
            preload: {
              js: "./src/preload.ts",
            },
          },
        ],
      },
    }),
  ],
};

export default config;
