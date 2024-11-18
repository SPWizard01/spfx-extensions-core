import { writeFileSync } from "fs";
import type { Compiler, WebpackPluginInstance } from "webpack";
import type { SPFxExtensionAppManifest } from "../../models/appModel";
interface SPFxWebpackManifestPluginOptions extends Partial<SPFxExtensionAppManifest> {
    includeAllOutputJs?: boolean;
    isESM: boolean;
    outdir?: string;
}
export class SPFxExtensionsManifestWriterPlugin implements WebpackPluginInstance {
    /**
     *
     */
    constructor(private options: SPFxWebpackManifestPluginOptions) {
        if (!options.includeAllOutputJs && (!options.appRelativeEntryPointUrls || options.appRelativeEntryPointUrls.length === 0)) {
            throw "No entry points provided make sure to specify either `appRelativeEntryPointUrls` or `includeAllOutputJs`";
        }
    }
    writeManifestFile(outputManifest: string, manifestToWrite: SPFxExtensionAppManifest) {
        writeFileSync(outputManifest, JSON.stringify(manifestToWrite));
    }

    apply(compiler: Compiler) {
        compiler.hooks.done.tap(
            'SPFxExtensions Manifest Writer Plugin',
            (stats) => {
                const manifestToWrite: SPFxExtensionAppManifest = {
                    appRelativeEntryPointUrls: this.options.appRelativeEntryPointUrls ?? [],
                    enabled: this.options.enabled ?? true,
                    enabledApps: this.options.enabledApps ?? [{ enabledAppIds: ["*"], webId: "*" }],
                    isESM: this.options.isESM,
                    enabledOnAllHubSites: this.options.enabledOnAllHubSites ?? true
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