import type { Plugin, PluginBuild } from "esbuild";
import { writeFile } from "fs/promises";
import type { SPFxExtensionAppManifest } from "../../models/appModel";
interface SPFxESBuildManifestPluginOptions extends Partial<SPFxExtensionAppManifest> {
    includeAllOutputJs?: boolean;
    isESM: boolean;
}
export function manifestPlugin(options: SPFxESBuildManifestPluginOptions): Plugin {
    return {
        name: 'esbuild-spfxmanifest-plugin',
        setup(build: PluginBuild) {
            build.onEnd(async (buildResult) => {
                if (!buildResult.metafile) {
                    console.error("No metafile found, make sure it is enabled in your build options");
                    return;
                }
                if (!options.includeAllOutputJs && (!options.appRelativeEntryPointUrls || options.appRelativeEntryPointUrls.length === 0)) {
                    console.error("No entry points provided make sure to specify either `appRelativeEntryPointUrls` or `includeAllOutputJs`");
                    return;
                }
                const manifestToWrite: SPFxExtensionAppManifest = {
                    appRelativeEntryPointUrls: options.appRelativeEntryPointUrls ?? [],
                    enabled: options.enabled ?? true,
                    enabledApps: options.enabledApps ?? [{ enabledAppIds: ["*"], webId: "*" }],
                    isESM: options.isESM,
                    enabledOnAllHubSites: options.enabledOnAllHubSites ?? true
                }
                const manifestDir = build.initialOptions.outdir ?? "";
                const outputManifest = `${(manifestDir ? `${manifestDir}/` : ``)}manifest.txt`;
                if (!options.includeAllOutputJs) {
                    await writeManifestFile(outputManifest, manifestToWrite);
                    return;
                }

                const dist = (build.initialOptions.outdir ?? "").replace(/^\.*\//, "");

                const outputJs = Object.keys(buildResult.metafile.outputs).filter(k => k.toLowerCase().endsWith(".js")).map((key) => key.replace(dist, "."));
                manifestToWrite.appRelativeEntryPointUrls = outputJs;
                await writeManifestFile(outputManifest, manifestToWrite);


            });
        }
    }
}

async function writeManifestFile(outputManifest: string, manifestToWrite: SPFxExtensionAppManifest) {
    await writeFile(outputManifest, JSON.stringify(manifestToWrite));
}
