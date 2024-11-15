import { context,  analyzeMetafile,initialize } from "esbuild"
import { $ } from "bun";
await $`rm -rf dist`;
const prod = process.argv.includes("--prod");

const ctx = await context({
    entryPoints: ["./src/core/__spfxCore.ts"],
    sourcemap: "linked",
    outdir: "./dist",
    platform: "browser",
    format: "esm",
    bundle: true,
    define: {
        "BUILD_DATE": JSON.stringify(new Date().toISOString()),
    },
    logOverride: {
        'direct-eval': 'silent',
    },
    metafile: true,
    plugins: [
        {
            name: "my-plugin",
            setup(build) {
                build.onEnd(async (result) => {
                    if (result.errors.length > 0) {
                        return;
                    }
                    if (result.metafile) {
                        const res = await analyzeMetafile(result.metafile, {color: true, verbose: false});
                        console.log(res);
                        // await formatMessages([], {});
                        console.table(Object.getOwnPropertyNames(result.metafile.outputs).map((key) => {
                            return {
                                name: key,
                                size: `${Math.floor(result.metafile!.outputs[key].bytes / 1024)}KB`,
                            }
                        }));
                    }
                })
            }
        }
    ]
})

await ctx.watch()
ctx.rebuild
const a = await ctx.serve({
    servedir: "./dist",
    certfile: "./serve_cert.pem",
    keyfile: "./serve_key.pem",
    port: 33355,
})


// console.table(Object.getOwnPropertyNames(result.metafile.outputs).map((key) => {
//     return {
//         name: key,
//         size: `${Math.floor(result.metafile.outputs[key].bytes / 1024)}KB`,
//     }
// }));
await $`tsc`