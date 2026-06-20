import { hash } from "crypto";
import type { Plugin, PluginBuild } from "esbuild";
import { writeFile } from "fs/promises";
import type { SPFxExtensionFolderManifest } from "../../models/appFolderManifest";
import { MANIFEST_NAME } from "../../utilities/constants";
interface SPFxESBuildManifestPluginOptions extends Partial<SPFxExtensionFolderManifest> {
  includeAllOutputJs?: boolean;
  generateCacheString?: boolean;
}
export function manifestPlugin(options: SPFxESBuildManifestPluginOptions): Plugin {
  return {
    name: "esbuild-spfxmanifest-plugin",
    setup(build: PluginBuild) {
      build.onEnd(async (buildResult) => {
        if (!buildResult.metafile) {
          console.error("No metafile found, make sure it is enabled in your build options");
          return;
        }
        if (
          !options.includeAllOutputJs &&
          (!options.appRelativeEntryPointUrls || options.appRelativeEntryPointUrls.length === 0)
        ) {
          console.error(
            "No entry points provided make sure to specify either `appRelativeEntryPointUrls` or `includeAllOutputJs`"
          );
          return;
        }
        const manifestToWrite: SPFxExtensionFolderManifest = {
          appRelativeEntryPointUrls: options.appRelativeEntryPointUrls ?? [],
          appDefinitionMap: options.appDefinitionMap ?? [],
          manualEntries: options.manualEntries ?? [],
          enableCaching: options.enableCaching ?? false,
          cacheString: options.cacheString ?? "",
          usePublicCDN: options.usePublicCDN ?? false,
        };
        if (options.generateCacheString) {
          const hashedString = hash("sha1", `${Date.now()}`, "hex");
          manifestToWrite.cacheString = hashedString;
        }
        const outputDir = build.initialOptions.outdir ?? "";
        const manifestLocation = `${outputDir ? `${outputDir}/` : ``}${MANIFEST_NAME}`;
        if (!options.includeAllOutputJs) {
          await writeManifestFile(manifestLocation, manifestToWrite);
          return;
        }

        const dist = outputDir.replace(/^\.*\//, "");

        const outputJs = Object.keys(buildResult.metafile.outputs)
          .filter((k) => k.toLowerCase().endsWith(".js"))
          .map((key) => key.replace(dist, "."));
        manifestToWrite.appRelativeEntryPointUrls = outputJs;
        await writeManifestFile(manifestLocation, manifestToWrite);
      });
    },
  };
}

async function writeManifestFile(
  manifestLocation: string,
  manifestToWrite: SPFxExtensionFolderManifest
) {
  await writeFile(manifestLocation, JSON.stringify(manifestToWrite));
}
