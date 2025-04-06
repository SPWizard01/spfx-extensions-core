import { isFileAllowedToRun } from "../../core/services/allowedAppsService";
import { logGenericCoreError } from "../../core/services/loggingService";
import type { SPFxExtensionAppDefinition } from "../../models/appModel";
import { SPFX_EXTENSIONS_FOLDER } from "../../utilities/constants";
import type { AppCollectionConfigurationItem } from "../models/appCollectionConfigurationItem";
import { configrationWebUrl } from "../runtimeStore";

export async function getAppDefinitions(app: AppCollectionConfigurationItem) {
    const allApps = [
        {
            name: "All",
            id: "*",
            resolved: true,
        }
    ]
    if (!app.manifest.isESM) {
        const set = new Set(app.manifest.enabledApps.flatMap((a) => a.enabledAppIds));
        allApps.push(...set.keys().filter(k => k !== "*").map((a) => {
            return {
                id: a,
                name: a,
                resolved: false,
            };
        }));
        return allApps;
    }
    for (const entryUrl of app.manifest.appRelativeEntryPointUrls) {
        const ep = entryUrl.replace(/\.\.\/?/g, "").replace(/\.\//g, "");
        const fullUrl = new URL(`${configrationWebUrl}/${SPFX_EXTENSIONS_FOLDER}/${app.name}/${ep}`);
        const isAllowed = await isFileAllowedToRun(fullUrl, true);
        fullUrl.searchParams.set("t", `${new Date().getTime()}`);
        if (!isAllowed) {
            continue;
        }
        try {
            const module = await import(`${fullUrl}`);
            if (!module.default) {
                logGenericCoreError(`Invalid app definition file ${fullUrl}, default export not available.`);
                continue;
            }
            if (!Array.isArray(module.default)) {
                logGenericCoreError(`Invalid app definition file ${fullUrl}, default export should be an array.`);
                continue;
            }
            if ((module.default as SPFxExtensionAppDefinition[]).some(def => !def.id || !def.name)) {
                logGenericCoreError(`Invalid app definition file ${fullUrl}, default export should be an array of objects with id and name properties.`);
                continue;
            }
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