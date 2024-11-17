import path from "path";
import plugin from "./src/plugins/webpack/manifestPlugin.js";
// import type { Configuration } from "webpack";
// import pkg from "webpack";

// const { webpack } = pkg;
// console.log(path.resolve(".webpackcache"));
const cfg = {
  entry: {
    configurator: "./src/configurator/__spfxCoreConfigurator.ts",
    core: "./src/core/__spfxCore.ts",
  },
  cache: {
    type: "filesystem",
    cacheDirectory: path.resolve(".webpackcache"),
  },
  mode: "development",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              compilerOptions: {
                declaration: false,
                emitDeclarationOnly: false,
                allowImportingTsExtensions: false,
              },
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  optimization: {
    runtimeChunk: {
      name: "runtime",
    },
  },
  stats: "minimal",
  target: "web",
  output: {
    path: path.resolve("dist"),
    filename: "js/[name].js",
    clean: true,
    uniqueName: "webpacksfx",
  },
  plugins: [new plugin({ isESM: false, includeAllOutputJs: true })],
};
export default cfg;
// const a = webpack(cfg);
// a.compile((err, stats) => {
//     if (err) {
//         console.error(err);
//         return;
//     }
//     //console.log(stats);
// });
