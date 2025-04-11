import { isFileAllowedToRun } from "../../core/services/allowedAppsService";
import { logGenericCoreError } from "../../core/services/loggingService";
import type { SPFxExtensionAppDefinition } from "../../models/appModel";
import { SPFX_EXTENSIONS_FOLDER } from "../../utilities/constants";
import type { AppCollectionConfigurationItem } from "../models/appCollectionConfigurationItem";
import { configrationWebUrl } from "../runtimeStore";

interface AllAppsProps {
  name: string;
  id: string;
  resolved: boolean;
}

export async function getAppDefinitions(app: AppCollectionConfigurationItem) {
  const allApps: AllAppsProps[] = [];
  console.log(app, "from appDefinitionImports.ts");
  if (!app.manifest.isESM) {
    const set = new Set(app.manifest.appDefinitionMap.flatMap((a) => a.appId));
    allApps.push(
      ...set
        .keys()
        .filter((k) => k !== "*")
        .map((a) => {
          return {
            id: a,
            name: a,
            resolved: false,
          };
        })
    );
    return allApps;
  }
  for (const entryUrl of app.manifest.appRelativeEntryPointUrls) {
    const ep = entryUrl.replace(/\.\.\/?/g, "").replace(/\.\//g, "");
    const fullUrl = new URL(
      `${configrationWebUrl}/${SPFX_EXTENSIONS_FOLDER}/${app.name}/${ep}`
    );
    const isAllowed = await isFileAllowedToRun(fullUrl, app.name, true);
    fullUrl.searchParams.set("t", `${Date.now()}`);
    if (!isAllowed) {
      continue;
    }
    try {
      const module = await import(`${fullUrl}`);
      console.log(module, "module");
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
      console.log(module.default);
      module.default.forEach((appDef: SPFxExtensionAppDefinition) => {
        allApps.push({
          id: appDef.id,
          name: appDef.name,
          resolved: true,
        });
      });
    } catch (e) {
      logGenericCoreError(`Error loading ${fullUrl}`, e);
      continue;
    }
  }
  return allApps;
}
