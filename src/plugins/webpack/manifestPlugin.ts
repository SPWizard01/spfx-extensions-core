import { hash } from "crypto";
import { writeFileSync } from "fs";
import type { Compiler, WebpackPluginInstance } from "webpack";
import type { SPFxExtensionFolderManifest } from "../../models/appFolderManifest";
interface SPFxWebpackManifestPluginOptions extends Partial<SPFxExtensionFolderManifest> {
    includeAllOutputJs?: boolean;
    isESM: boolean;
    outdir?: string;
    generateCacheString?: boolean;
}
export class SPFxExtensionManifestWriterPluginWebpack implements WebpackPluginInstance {
    /**
     *
     */
    constructor(private options: SPFxWebpackManifestPluginOptions) {
        if (!options.includeAllOutputJs && (!options.appRelativeEntryPointUrls || options.appRelativeEntryPointUrls.length === 0)) {
            throw "No entry points provided make sure to specify either `appRelativeEntryPointUrls` or `includeAllOutputJs`";
        }
    }
    writeManifestFile(outputManifest: string, manifestToWrite: SPFxExtensionFolderManifest) {
        writeFileSync(outputManifest, JSON.stringify(manifestToWrite));
    }

    apply(compiler: Compiler) {
        compiler.hooks.done.tap(
            'SPFxExtensions Manifest Writer Plugin',
            (stats) => {
                const manifestToWrite: SPFxExtensionFolderManifest = {
                    appRelativeEntryPointUrls: this.options.appRelativeEntryPointUrls ?? [],
                    appDefinitionMap: this.options.appDefinitionMap ?? [],
                    isESM: this.options.isESM,
                    enableCaching: this.options.enableCaching ?? false,
                    cacheString: this.options.cacheString ?? "",
                }
                if (this.options.generateCacheString) {
                    const hashedString = hash("sha1", `${Date.now()}`, "hex")
                    manifestToWrite.cacheString = hashedString
                }
                const manifestDir = this.options.outdir ?? stats.compilation.outputOptions.path ?? "";
                const outputManifest = `${(manifestDir ? `${manifestDir}/` : ``)}manifest.txt`;
                if (!this.options.includeAllOutputJs) {
                    this.writeManifestFile(outputManifest, manifestToWrite);
                    return;
                }
                const assets: string[] = [];
                const keys = Array.from(stats.compilation.assetsInfo.keys());
                keys.forEach((key: string) => {
                    assets.push(key.toLowerCase());
                })
                const jsRegex = /\.js\??/;
                const outputJs = assets.filter(k => jsRegex.test(k));
                manifestToWrite.appRelativeEntryPointUrls = outputJs;
                this.writeManifestFile(outputManifest, manifestToWrite);

                //stats.compilation.entrypoints.forEach((entry) => {console.log(entry.options)});
                //console.log(stats.compilation.emittedAssets);
            }
        );
    }
}