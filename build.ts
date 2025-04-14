import { $, build, BuildOutput } from "bun";
import { coreEntryPoints, pluginEntryPoints } from "./entrypoints";
await $`rm -rf dist`;
const prod = process.argv.includes("--prod");
const result = await build({
    entrypoints: coreEntryPoints,
    sourcemap: "none",
    outdir: "./dist",
    target: "browser",
    format: "esm",
    define: {
        "BUILD_DATE": JSON.stringify(new Date().toISOString()),
    },
    drop: ["console.debug", "console.log"],
    minify: prod,
    emitDCEAnnotations: true,
    splitting: false,
})
const pluginResult = await build({
    entrypoints: pluginEntryPoints,
    sourcemap: "none",
    outdir: "./dist/plugins",
    target: "node",
    format: "esm",
    minify: false,
    splitting: false
})

// 

function printOutput(result: BuildOutput) {
    console.table(result.outputs.map((bldArt) => {
        return {
            name: bldArt.path,
            size: `${Math.floor(bldArt.size / 1024)}KB`,
        }
    }));
}

printOutput(result);
printOutput(pluginResult);
await $`tsc -p ./tsconfig.json`