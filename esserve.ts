import { $, file } from "bun";
import { context } from "esbuild";
import { esbuildHMRPlugin } from "esbuild-hot-reload";
import { createServer, request, RequestOptions } from "node:https";
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
        "DEBUG": JSON.stringify(true),
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
const certName = "./serve_cert.pem";
const keyName = "./serve_key.pem";
const certBuffer = await file(certName).arrayBuffer();
const keyBuffer = await file(keyName).arrayBuffer();

const _a = await ctx.serve({
    servedir: "./dist",
    certfile: certName,
    keyfile: keyName,
})

createServer({
    cert: Buffer.from(certBuffer),
    key: Buffer.from(keyBuffer),
    rejectUnauthorized: false,
}, (req, res) => {
    const requestOptions: RequestOptions = {
        host: _a.hosts[0],
        port: _a.port,
        rejectUnauthorized: false,
        method: req.method,
        path: req.url,
        headers: req.headers,
    }
    const allowedMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
    const allowedOrigin = req.headers["origin"] || "*";

    const defaultCorsHeader = {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": allowedMethods.join(","),
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Credentials": "true",
    }

    const corsHeader = new Map<string, string>(Object.entries(defaultCorsHeader));
    if (req.method === "OPTIONS") {
        res.writeHead(200, defaultCorsHeader);
        res.end();
        return;
    }
    const esBuildRequest = request(requestOptions, (esBuildResponse) => {
        // res.setHeaders(corsHeader);
        // console.log("Response Headers", esBuildResponse.headers);
        Object.entries(esBuildResponse.headers).forEach((kvp) => {
            const [key, value] = kvp;
            res.setHeader(key, value ?? "");
        });
        corsHeader.forEach((value, key) => {
            res.setHeader(key, value);
        });
        // res.writeHead(esBuildResponse.statusCode ?? 500, esBuildResponse.headers);
        esBuildResponse.pipe(res, { end: true });
    })
    req.pipe(esBuildRequest, { end: true });
}).listen(33355);

// console.table(Object.getOwnPropertyNames(result.metafile.outputs).map((key) => {
//     return {
//         name: key,
//         size: `${Math.floor(result.metafile.outputs[key].bytes / 1024)}KB`,
//     }
// }));
