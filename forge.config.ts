import MakerDMG from "@electron-forge/maker-dmg";
import MakerZIP from "@electron-forge/maker-zip";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
import type { ForgeConfig } from "@electron-forge/shared-types";
import { DEVELOPER_DATA } from "./devconst";
import { mainConfig } from "./webpack.main.config";
import { rendererConfig } from "./webpack.renderer.config";

const config: ForgeConfig = {
  packagerConfig: {
    icon: "./src/appicons/icons/mac/ico",
    extraResource: "./src/models",
    osxSign: {
      identity: DEVELOPER_DATA.identity,
      optionsForFile: () => {
        return {
          entitlements: "./build/entitlements.mac.plist",
        };
      },
    },
    osxNotarize: {
      tool: "notarytool",
      appleId: DEVELOPER_DATA.appleId,
      appleIdPassword: DEVELOPER_DATA.appleIdPassword,
      teamId: DEVELOPER_DATA.teamId,
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
        authToken: DEVELOPER_DATA.githubAuthTOken,
        prerelease: false,
        draft: false,
      },
    },
  ],
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ["darwin"]),
    // make a .dmg
    new MakerDMG({}, ["darwin"]),
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
