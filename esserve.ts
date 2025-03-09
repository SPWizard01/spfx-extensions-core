import { $ } from "bun";
import { context } from "esbuild";
import { esbuildHMRPlugin } from "esbuild-hot-reload";
import pc from "picocolors";
import { manifestPlugin } from "./src/plugins/esbuild/manifestPlugin";
await $`rm -rf dist`;

const ctx = await context({
    entryPoints: ["./src/core/__spfxCore.ts", "./src/configurator/__spfxCoreConfigurator.ts"],
    entryNames: "[name]",
    sourcemap: "linked",
    outdir: "./dist",
    platform: "browser",
    format: "esm",
    bundle: true,
    treeShaking: true,
    define: {
        "BUILD_DATE": JSON.stringify(new Date().toISOString()),
    },
    logOverride: {
        'direct-eval': 'silent',
    },
    metafile: true,
    plugins: [
        esbuildHMRPlugin(33355),
        manifestPlugin({ isESM: true, includeAllOutputJs: true, generateCacheString: true }),
        {
            name: "my-plugin",
            setup(build) {
                build.onEnd(async (result) => {
                    if (result.errors.length > 0) {
                        return;
                    }
                    if (result.metafile) {
                        //const res = await analyzeMetafile(result.metafile, { color: true, verbose: false });
                        //console.log(res);
                        // await formatMessages([], {});
                        console.table(Object.getOwnPropertyNames(result.metafile.outputs).map((key) => {
                            return {
                                name: key,
                                size: `${Math.floor(result.metafile!.outputs[key].bytes / 1024)}KB`,
                            }
                        }));
                        console.log("Performing TSC check");
                        const tsc = (await $`tsc`.nothrow().quiet());
                        if (tsc.exitCode === 0) {
                            console.log(pc.bgGreen("✔ [SUCCESS]"), "TSC check passed");
                        } else {
                            console.log(pc.bgRed("✘ [ERROR]"), `\r\n${tsc.stdout.toString()}`);
                        }
                        // console.log("✘ [ERROR]", tsc.stdout.toString());
                    }
                })
            }
        }
    ]
})

await ctx.watch()
// ctx.rebuild
const _a = await ctx.serve({
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
