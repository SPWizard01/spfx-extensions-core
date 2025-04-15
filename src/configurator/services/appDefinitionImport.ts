import { isFileAllowedToRun } from "../../core/services/allowedAppsService";
import { logGenericCoreError } from "../../core/services/loggingService";
import type { SPFxExtensionAppMapItemConfig } from "../../models/appFolderManifest";
import type { SPFxExtensionAppDefinition } from "../../models/appModel";
import { SPFX_EXTENSIONS_FOLDER } from "../../utilities/constants";
import type { AppCollectionConfigurationItem } from "../models/appCollectionConfigurationItem";
import type { AppFolderManifestDefinitionItem } from "../models/AppFolderManifestDefinitionItem";
import { configrationWebUrl } from "../runtimeStore";

const EMPTY_DEF_CONFIG: SPFxExtensionAppMapItemConfig = { enabledEverywhere: false, excludedHubIds: [], excludedIds: [], includedHubIds: [], includedIds: [] };
export async function getAppDefinitions(app: AppCollectionConfigurationItem) {

  if (!app.manifest.isESM) {
    const nonEsmDefs: AppFolderManifestDefinitionItem[] = [];
    for (const element of app.manifest.appRelativeEntryPointUrls) {
      const nonEsmEPConfig: SPFxExtensionAppMapItemConfig =
        app.manifest.appDefinitionMap.find(a => a.appId === element)?.config ??
        JSON.parse(JSON.stringify(EMPTY_DEF_CONFIG));
      nonEsmDefs.push({
        appId: element,
        name: element,
        resolved: true,
        config: nonEsmEPConfig,
      });
    }
    return nonEsmDefs;
  }
  const manifestDefinitions: AppFolderManifestDefinitionItem[] = app.manifest.appDefinitionMap.map((def) => {
    return {
      appId: def.appId,
      name: `Unknown_${def.appId}`,
      resolved: false,
      config: def.config ?? JSON.parse(JSON.stringify(EMPTY_DEF_CONFIG)),
    }
  })
  console.log("Manifest definitions", manifestDefinitions);
  for (const entryUrl of app.manifest.appRelativeEntryPointUrls) {
    const ep = entryUrl.replace(/\.\.\/?/g, "").replace(/\.\//g, "");
    const fullUrl = new URL(
      `${configrationWebUrl}/${SPFX_EXTENSIONS_FOLDER}/${app.name}/${ep}`
    );
    const isAllowed = await isFileAllowedToRun(fullUrl, app.name, true);
    if (!isAllowed) {
      continue;
    }
    fullUrl.searchParams.set("t", `${Date.now()}`);
    try {
      const module = await import(`${fullUrl}`);
      if (!module.default) {
        logGenericCoreError(
          `Invalid app definition file ${fullUrl}, default export not available.`
        );
        continue;
      }
      if (!Array.isArray(module.default)) {
        logGenericCoreError(
          `Invalid app definition file ${fullUrl}, default export should be an array.`
        );
        continue;
      }
      if (
        (module.default as SPFxExtensionAppDefinition[]).some(
          (def) => !def.id || !def.name
        )
      ) {
        logGenericCoreError(
          `Invalid app definition file ${fullUrl}, default export should be an array of objects with id and name properties.`
        );
        continue;
      }
      for (const appDef of (module.default as SPFxExtensionAppDefinition[])) {
        const foundDef = manifestDefinitions.find(a => a.appId === appDef.id);
        if (foundDef) {
          foundDef.name = appDef.name;
          foundDef.resolved = true;
          continue;
        }
        manifestDefinitions.push({
          appId: appDef.id,
          name: appDef.name,
          resolved: true,
          config: JSON.parse(JSON.stringify(EMPTY_DEF_CONFIG)),
        });
      }
    } catch (e) {
      logGenericCoreError(`Error loading ${fullUrl}`, e);
      continue;
    }
  }
  return manifestDefinitions;
}
