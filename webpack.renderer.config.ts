import type { Configuration } from "webpack";
import path from "path";
import { rules } from "./webpack.rules";
import { plugins } from "./webpack.plugins";
import CopyWebpackPlugin from "copy-webpack-plugin";

rules.push({
  test: /\.css$/,
  use: [{ loader: "style-loader" }, { loader: "css-loader" }],
});

const assets = ["assets"];
const copyPlugins = new CopyWebpackPlugin({
  patterns: assets.map((asset) => ({
    from: path.resolve(__dirname, "src", asset),
    to: path.resolve(__dirname, ".webpack/renderer", asset),
  })),
});

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins: [...plugins, copyPlugins],
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
  },
};
