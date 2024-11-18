import { $ } from "bun";
import { analyzeMetafile, build } from "esbuild";
import { manifestPlugin } from "./src/plugins/esbuild/manifestPlugin";
await $`rm -rf dist`;
const prod = process.argv.includes("--prod");
const result = await build({
    entryPoints: ["./src/index.ts", "./src/configurator/__spfxCoreConfigurator.ts", "./src/core/__spfxCore.ts", "./src/services/spContextService.ts", "./src/services/appLauncher.ts", "./src/core/coreClassicWrapper.ts", "./src/core/coreClassicCustomAction.ts", "./src/utilities/display.ts"],
    sourcemap: "linked",
    outdir: "./dist",
    platform: "browser",
    format: "esm",
    define: {
        "BUILD_DATE": JSON.stringify(new Date().toISOString()),
    },
    pure: ["console.debug", "console.log"],
    color: true,
    legalComments: "inline",
    bundle: true,
    treeShaking: true,

    minify: prod,
    logOverride: {
        "direct-eval": "silent"
    },
    metafile: true,
    plugins: [
        manifestPlugin({ includeAllOutputJs: true, isESM: true }),
    ]
})

const pluginResult = await build({
    entryPoints: ["./src/plugins/esbuild/index.ts", "./src/plugins/bun/index.ts", "./src/plugins/webpack/index.ts"],
    sourcemap: "linked",
    outdir: "./dist/plugins",
    platform: "node",
    format: "esm",
    color: true,
    legalComments: "inline",
    bundle: true,
    treeShaking: true,
    minify: false,
    logOverride: {
        "direct-eval": "silent"
    },
    metafile: true,

})

// 
await analyzeMetafile(result.metafile, { color: true, verbose: false });
await analyzeMetafile(pluginResult.metafile, { color: true, verbose: false });

console.table(Object.getOwnPropertyNames(result.metafile.outputs).map((key) => {
    return {
        name: key,
        size: `${Math.floor(result.metafile.outputs[key].bytes / 1024)}KB`,
    }
}));
await $`tsc`