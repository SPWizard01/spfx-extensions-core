import { build, $, inspect } from "bun";

await $`rm -rf dist`;
build({
    entrypoints: ["./src/index.ts", "./src/core/__spfxCore.ts", "./src/core/coreClassicWrapper.ts", "./src/services/spContextService.ts", "./src/services/appLauncher.ts", "./src/core/coreClassicCustomAction.ts", "./src/utilities/common.ts", "./src/utilities/display.ts"],
    sourcemap: "linked",
    outdir: "./dist",
    target: "browser",
    format: "esm",
    define: {
        "BUILD_DATE": JSON.stringify(new Date().toISOString()),
    },
    external: ["__spfxCore.js"],
    minify: {
        whitespace: false
    }
    // minify: true
}).then((out) => {
    if (out.success) {
        console.table(out.outputs.map((output) => ({
            path: output.path,
            size: `${Math.floor(output.size / 1024)}KB`,
        }))
        );

    } else {
        console.error(out.logs);
    }

});

build({
    entrypoints: ["./src/__spfx.ts"],
    sourcemap: "linked",
    outdir: "./dist",
    target: "browser",
    format: "esm",
    define: {
        "BUILD_DATE": JSON.stringify(new Date().toISOString()),
    },
    external: ["__spfxCore.js"],
    minify: false
}).then((out) => {
    if (out.success) {
        console.table(out.outputs.map((output) => ({
            path: output.path,
            size: `${Math.floor(output.size / 1024)}KB`,
        }))
        );

    } else {
        console.error(out.logs);
    }

});
await $`tsc`