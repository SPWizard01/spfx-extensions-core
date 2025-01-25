import { bunHotReloadPlugin, startBunDevServer } from "bun-dev-server";

startBunDevServer({
    buildConfig: {
        entrypoints: ["./src/core/__spfxCore.ts", "./src/configurator/__spfxCoreConfigurator.ts"],
        naming: {
            entry: "[name].[ext]",
        },
        sourcemap: "linked",
        outdir: "./dist",
        target: "browser",
        format: "esm",
        define: {
            "BUILD_DATE": JSON.stringify(new Date().toISOString()),
        },

        plugins: [
            bunHotReloadPlugin({ port: 33355, secure: true }),
        ]
    },
    port: 33355,
    watchDir: "./src",
    enableTSC: true,
    hotReload: "plugin",
    writeManifest: false,
    cleanServePath: true,
    tls: {
        certFile: "./serve_cert.pem",
        keyFile: "./serve_key.pem",
    },
    logRequests: true,
    reloadOnChange: true,
    watchDelay: 2000,
}, import.meta)