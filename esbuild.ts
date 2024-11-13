import { buildSync } from "esbuild"
import { $, inspect } from "bun";
await $`rm -rf dist`;
const prod = process.argv.includes("--prod");
const result = buildSync({
    entryPoints: ["./src/index.ts", "./src/core/__spfxCore.ts", "./src/services/idbService.ts", "./src/services/spContextService.ts", "./src/services/appLauncher.ts", "./src/core/coreClassicWrapper.ts", "./src/core/coreClassicCustomAction.ts", "./src/utilities/display.ts"],
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
    minify: prod,
    logOverride: {
        "direct-eval": "silent"
    },
    metafile: true,
})
// const result2 = buildSync({
//     entryPoints: ["./src/__spfx.ts"],
//     sourcemap: "linked",
//     outdir: "./dist",
//     platform: "browser",
//     format: "esm",
//     define: {
//         "BUILD_DATE": JSON.stringify(new Date().toISOString()),
//     },
//     external: ["__spfxCore.js"],
//     bundle: true,
//     minify: false,
//     logOverride: {
//         "direct-eval": "silent"
//     },
//     metafile: true,
//     // minify: true
// })
// console.table(Object.getOwnPropertyNames(result2.metafile.outputs).map((key) => {
//     return {
//         name: key,
//         size: `${Math.floor(result2.metafile.outputs[key].bytes / 1024)}KB`,
//     }
// }));
console.table(Object.getOwnPropertyNames(result.metafile.outputs).map((key) => {
    return {
        name: key,
        size: `${Math.floor(result.metafile.outputs[key].bytes / 1024)}KB`,
    }
}));
await $`tsc`