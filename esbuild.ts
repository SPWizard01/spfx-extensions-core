import { buildSync } from "esbuild"
import { $, inspect } from "bun";
await $`rm -rf dist`;
const result = buildSync({
    entryPoints: ["./src/index.ts", "./src/__spfx.ts", "./src/__spfxCore.ts", "./src/services/spContextService.ts", "./src/services/appLauncher.ts", "./src/coreClassicWrapper.ts", "./src/coreClassicCustomAction.ts", "./src/utilities/common.ts", "./src/utilities/display.ts"],
    sourcemap: "linked",
    outdir: "./dist",
    platform: "browser",
    format: "esm",
    define: {
        "BUILD_DATE": JSON.stringify(new Date().toISOString()),
    },
    legalComments: "inline",
    external: ["__spfxCore.js"],
    bundle: true,
    minify: true,
    logOverride: {
        "direct-eval": "silent"
    },
    metafile: true,
    // minify: true
})
const result2 = buildSync({
    entryPoints: ["./src/__spfx.ts"],
    sourcemap: "linked",
    outdir: "./dist",
    platform: "browser",
    format: "esm",
    define: {
        "BUILD_DATE": JSON.stringify(new Date().toISOString()),
    },
    external: ["__spfxCore.js"],
    bundle: true,
    minify: false,
    logOverride: {
        "direct-eval": "silent"
    },
    metafile: true,
    // minify: true
})
console.table(Object.getOwnPropertyNames(result2.metafile.outputs).map((key) => {
    return {
        name: key,
        size: `${Math.floor(result2.metafile.outputs[key].bytes / 1024)}KB`,
    }
}));
console.table(Object.getOwnPropertyNames(result.metafile.outputs).map((key) => {
    return {
        name: key,
        size: `${Math.floor(result.metafile.outputs[key].bytes / 1024)}KB`,
    }
}));
await $`tsc`