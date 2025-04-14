import type { BuildOutput } from "bun";
import type { SPFxExtensionFolderManifest } from "../../models/appFolderManifest";
interface SPFxBunBuildManifestPluginOptions extends Partial<SPFxExtensionFolderManifest> {
    includeAllOutputJs?: boolean;
    isESM: boolean;
    outdir: string;
    generateCacheString?: boolean;
}
export async function bunManifestWriter(options: SPFxBunBuildManifestPluginOptions, buildOutput: BuildOutput) {
    if (!options.includeAllOutputJs && (!options.appRelativeEntryPointUrls || options.appRelativeEntryPointUrls.length === 0)) {
        console.error("No entry points provided make sure to specify either `appRelativeEntryPointUrls` or `includeAllOutputJs`");
        return;
    }
    const manifestToWrite: SPFxExtensionFolderManifest = {
        appRelativeEntryPointUrls: options.appRelativeEntryPointUrls ?? [],
        appDefinitionMap: options.appDefinitionMap ?? [],
        isESM: options.isESM,
        enableCaching: options.enableCaching ?? false,
        cacheString: options.cacheString ?? "",
    }
    if (options.generateCacheString) {
        const hash = Bun.CryptoHasher.hash("sha1", `${Date.now()}`, "hex")
        manifestToWrite.cacheString = hash
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
        const basePathUrl = Bun.pathToFileURL(manifestDir);
        const epUrl = Bun.pathToFileURL(ep.path);
        const relativePath = epUrl.href.replace(`${basePathUrl.href}/`, "");
        // const nameNoJs = relativePath.replace(".js", "");
        const hashedImport = `${relativePath}`.replace(dist, "");
        epTable.push(hashedImport);
    }
    manifestToWrite.appRelativeEntryPointUrls = epTable;
    await writeManifestFile(outputManifest, manifestToWrite);

}

async function writeManifestFile(outputManifest: string, manifestToWrite: SPFxExtensionFolderManifest) {
    await Bun.write(outputManifest, JSON.stringify(manifestToWrite));
}
