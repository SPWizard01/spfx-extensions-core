import { isFileAllowedToRun } from "../../core/services/allowedAppsService";
import { logGenericCoreError } from "../../core/services/loggingService";
import type { SPFxExtensionAppMapItemConfig } from "../../models/appFolderManifest";
import type { SPFxExtensionAppDefinition } from "../../models/appModel";
import {
  EMPTY_APP_DEF_ITEM_CONFIG,
  SPFX_EXTENSIONS_FOLDER,
} from "../../utilities/constants";
import { cloneObject } from "../../utilities/helpers";
import type { AppCollectionConfigurationItem } from "../models/appCollectionConfigurationItem";
import type { AppFolderManifestDefinitionItem } from "../models/AppFolderManifestDefinitionItem";
import { configrationWebUrl } from "../runtimeStore";

export async function getAppDefinitions(app: AppCollectionConfigurationItem) {
  if (!app.manifest.isESM) {
    const returnValue: AppFolderManifestDefinitionItem[] = [];
    for (const element of app.manifest.appRelativeEntryPointUrls) {
      const nonEsmEPConfig: SPFxExtensionAppMapItemConfig =
        app.manifest.appDefinitionMap.find((a) => a.appId === element)
          ?.config ?? cloneObject(EMPTY_APP_DEF_ITEM_CONFIG);
      returnValue.push({
        appId: element,
        name: element,
        resolved: true,
        config: nonEsmEPConfig,
      });
    }
    const additionalDefs: AppFolderManifestDefinitionItem[] =
      app.manifest.appDefinitionMap
        .filter(
          (def) => !returnValue.some((retDef) => retDef.appId === def.appId)
        )
        .map((def) => ({
          ...def,
          name: `${def.appId}`,
          resolved: true,
        }));
    returnValue.push(...cloneObject(additionalDefs));
    return returnValue;
  }
  const manifestDefinitions: AppFolderManifestDefinitionItem[] =
    app.manifest.appDefinitionMap.map((def) => {
      return {
        appId: def.appId,
        name: `Unknown_${def.appId}`,
        resolved: false,
        config: def.config ?? cloneObject(EMPTY_APP_DEF_ITEM_CONFIG),
      };
    });
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
      for (const appDef of module.default as SPFxExtensionAppDefinition[]) {
        const foundDef = manifestDefinitions.find((a) => a.appId === appDef.id);
        if (foundDef) {
          foundDef.name = appDef.name;
          foundDef.resolved = true;
          continue;
        }
        manifestDefinitions.push({
          appId: appDef.id,
          name: appDef.name,
          resolved: true,
          config: cloneObject(EMPTY_APP_DEF_ITEM_CONFIG),
        });
      }
    } catch (e) {
      logGenericCoreError(`Error loading ${fullUrl}`, e);
      continue;
    }
  }
  return manifestDefinitions;
}
