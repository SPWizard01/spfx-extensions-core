import { writeFileSync } from "fs";
export default class SPFxExtensionsManifestWriterPlugin {
    options;
    /**
     *
     */
    constructor(options) {
        this.options = options;
        if (!options.includeAllOutputJs && (!options.appRelativeEntryPointUrls || options.appRelativeEntryPointUrls.length === 0)) {
            throw "No entry points provided make sure to specify either `appRelativeEntryPointUrls` or `includeAllOutputJs`";
        }
    }
    writeManifestFile(outputManifest, manifestToWrite) {
        writeFileSync(outputManifest, JSON.stringify(manifestToWrite));
    }
    apply(compiler) {
        compiler.hooks.done.tap('SPFxExtensions Manifest Writer Plugin', (stats) => {
            const manifestToWrite = {
                appRelativeEntryPointUrls: this.options.appRelativeEntryPointUrls ?? [],
                enabled: this.options.enabled ?? true,
                enabledApps: this.options.enabledApps ?? [{ enabledAppIds: ["*"], webId: "*" }],
                isESM: this.options.isESM,
                enabledOnAllHubSites: this.options.enabledOnAllHubSites ?? true
            };
            const manifestDir = this.options.outdir ?? stats.compilation.outputOptions.path ?? "";
            const outputManifest = `${(manifestDir ? `${manifestDir}/` : ``)}manifest.txt`;
            if (!this.options.includeAllOutputJs) {
                this.writeManifestFile(outputManifest, manifestToWrite);
                return;
            }
            const assets = [];
            stats.compilation.assetsInfo.keys().forEach((key) => {
                assets.push(key.toLowerCase());
            });
            const jsRegex = /\.js\??/;
            const outputJs = assets.filter(k => jsRegex.test(k));
            manifestToWrite.appRelativeEntryPointUrls = outputJs;
            this.writeManifestFile(outputManifest, manifestToWrite);
            //stats.compilation.entrypoints.forEach((entry) => {console.log(entry.options)});
            //console.log(stats.compilation.emittedAssets);
        });
    }
}
