import { isFileAllowedToRun } from "../../core/services/allowedAppsService";
import { logGenericCoreError } from "../../core/services/loggingService";
import type { SPFxExtensionAppDefinition } from "../../models/appModel";
import { EMPTY_APP_DEF_ITEM_CONFIG, SPFX_EXTENSIONS_FOLDER } from "../../utilities/constants";
import { cloneObject } from "../../utilities/helpers";
import type { AppCollectionConfigurationItem } from "../models/appCollectionConfigurationItem";
import type { AppFolderManifestDefinitionItem } from "../models/AppFolderManifestDefinitionItem";
import { configurationWebUrl } from "../runtimeStore";

function addOrUpdateDefinition(
  appId: string,
  appName: string,
  isManual: boolean,
  manifestDefinitions: AppFolderManifestDefinitionItem[]
) {
  const foundDef = manifestDefinitions.find((a) => a.appId === appId);
  if (foundDef) {
    foundDef.name = appName;
    foundDef.resolved = true;
    foundDef.isManual = isManual;
    return;
  }
  manifestDefinitions.push({
    appId: appId,
    name: appName,
    resolved: true,
    isManual: isManual,
    config: cloneObject(EMPTY_APP_DEF_ITEM_CONFIG),
  });
}

export async function getAppDefinitions(app: AppCollectionConfigurationItem) {
  const manifestDefinitions: AppFolderManifestDefinitionItem[] = app.manifest.appDefinitionMap.map(
    (def) => {
      return {
        appId: def.appId,
        name: `Unknown_${def.appId}`,
        isManual: false,
        resolved: false,
        config: def.config ?? cloneObject(EMPTY_APP_DEF_ITEM_CONFIG),
      };
    }
  );
  for (const entryUrl of app.manifest.appRelativeEntryPointUrls) {
    const ep = entryUrl.replace(/\.\.\/?/g, "").replace(/\.\//g, "");
    const fullUrl = new URL(`${configurationWebUrl}/${SPFX_EXTENSIONS_FOLDER}/${app.name}/${ep}`);
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
      if ((module.default as SPFxExtensionAppDefinition[]).some((def) => !def.id || !def.name)) {
        logGenericCoreError(
          `Invalid app definition file ${fullUrl}, default export should be an array of objects with id and name properties.`
        );
        continue;
      }
      for (const appDef of module.default as SPFxExtensionAppDefinition[]) {
        addOrUpdateDefinition(appDef.id, appDef.name, false, manifestDefinitions);
      }
    } catch (e) {
      logGenericCoreError(`Error loading ${fullUrl}`, e);
      continue;
    }
  }
  for (const element of app.manifest.manualEntries) {
    addOrUpdateDefinition(element.appId, element.name, true, manifestDefinitions);
  }
  return manifestDefinitions;
}
