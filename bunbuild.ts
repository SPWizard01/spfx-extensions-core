import { build } from "bun";

build({
    entrypoints: ["./src/index.ts"],
    sourcemap: "external",
    outdir: "./dist",
    target: "browser",
    format: "esm",
}).then((out) => {
    console.log(out);

});