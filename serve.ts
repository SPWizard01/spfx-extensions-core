import { file } from "bun";
import { startBunDevServer } from "bun-dev-server";
import { bunManifestWriter } from "./src/plugins/bun/manifestPlugin";
startBunDevServer(
  {
    buildConfig: {
      entrypoints: [
        "./src/core/__spfxCore.ts",
        "./src/configurator/__spfxCoreConfigurator.ts",
        "./src/core/__spfxWrapperClassic.ts",
      ],
      naming: {
        entry: "[name].[ext]",
      },
      sourcemap: "linked",
      outdir: "./dist",
      target: "browser",
      format: "esm",
      define: {
        BUILD_DATE: JSON.stringify(new Date().toISOString()),
        DEBUG: JSON.stringify(true),
      },
      plugins: [
        //bunHotReloadPlugin({ port: 33355, secure: true }),
      ],
    },
    port: 33355,
    watchDir: "./src",
    enableTSC: true,
    writeManifest: false,
    cleanServePath: true,
    tls: {
      cert: file("./serve_cert.pem"),
      key: file("./serve_key.pem"),
    },
    logRequests: true,
    hotReload: "plugin",
    reloadOnChange: true,
    watchDelay: 500,
    afterBuild(output, _env) {
      bunManifestWriter(
        {
          outdir: "./dist",
          includeAllOutputJs: true,
          generateCacheString: true,
        },
        output
      );
    },
  },
  import.meta
);
