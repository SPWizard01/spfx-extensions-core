import { build, $, inspect } from "bun";

await $`rm -rf dist`;
build({
    entrypoints: ["./src/index.ts", "./src/core.ts", "./src/coreClassicWrapper.ts", "./src/coreClassicCustomAction.ts", "./src/utilities/common.ts", "./src/utilities/display.ts", "./src/extensions/spfx.ts"],
    sourcemap: "linked",
    outdir: "./dist",
    target: "browser",
    format: "esm",
    define: {
        "BUILD_DATE": JSON.stringify(new Date().toISOString()),
    }
    // minify: true
}).then((out) => {
    if (out.success) {
        console.log(
            Bun.inspect.table(
                [
                    ...out.outputs.map((output) => ({
                        path: output.path,
                        size: `${Math.floor(output.size / 1024)}KB`,
                    })),
                ],
                {
                    colors: true,
                },
            ),
        );

    } else {
        console.error(out.logs);
    }

});
await $`tsc`