import { startBunDevServer } from "bun-dev-server"
import { file, $ } from "bun"
await $`rm -rf dist`;

startBunDevServer({
    buildConfig: {
        entrypoints: ["./src/core/__spfxCore.ts", "./src/configurator/__spfxCoreConfigurator.ts"],
        outdir: "./dist",
        naming: {
            entry: "[name].[ext]",
        },
        sourcemap: "linked",
        define: {
            "BUILD_DATE": JSON.stringify(new Date().toISOString()),
        },
    },
    writeManifest: true,
    tls: {
        cert: file("./serve_cert.pem"),
        key: file("./serve_key.pem"),
    },
    port: 33355,
})