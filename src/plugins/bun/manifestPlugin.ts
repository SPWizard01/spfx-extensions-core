import { pathToFileURL, write, type BuildOutput } from "bun";
import type { SPFxExtensionAppManifest } from "../../models/appModel";
interface SPFxBunBuildManifestPluginOptions extends Partial<SPFxExtensionAppManifest> {
    includeAllOutputJs?: boolean;
    isESM: boolean;
    outdir: string;
}
export async function bunManifestWriter(options: SPFxBunBuildManifestPluginOptions, buildOutput: BuildOutput) {
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

    const entryPoints = buildOutput.outputs.filter(o => o.kind === "entry-point");
    const manifestDir = options.outdir;
    const outputManifest = `${(manifestDir ? `${manifestDir}/` : ``)}manifest.txt`;
    const dist = manifestDir.replace(/^\.*\//, "");




    if (!options.includeAllOutputJs) {
        await writeManifestFile(outputManifest, manifestToWrite);
        return;
    }

    const epTable: string[] = [];
    for (const ep of entryPoints) {
        const basePathUrl = pathToFileURL(manifestDir);
        const epUrl = pathToFileURL(ep.path);
        const relativePath = epUrl.href.replace(`${basePathUrl.href}/`, "");
        // const nameNoJs = relativePath.replace(".js", "");
        const hashedImport = `${relativePath}`.replace(dist,"");
        epTable.push(hashedImport);
    }
    manifestToWrite.appRelativeEntryPointUrls = epTable;
    await writeManifestFile(outputManifest, manifestToWrite);

}

async function writeManifestFile(outputManifest: string, manifestToWrite: SPFxExtensionAppManifest) {
    await write(outputManifest, JSON.stringify(manifestToWrite));
}
