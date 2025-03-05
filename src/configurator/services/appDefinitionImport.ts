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
        }
    ]
    if (!app.manifest.isESM) {
        return allApps;
    }
    for (const entryUrl of app.manifest.appRelativeEntryPointUrls) {
        const ep = entryUrl.replace(/\.\.\/?/g, "").replace(/\.\//g, "");
        const fullUrl = new URL(`${configrationWebUrl}/${SPFX_EXTENSIONS_FOLDER}/${app.name}/${ep}`);
        fullUrl.searchParams.set("t", `${new Date().getTime()}`);
        const isAllowed = await isFileAllowedToRun(fullUrl, true);
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
            module.default.forEach((appDef: SPFxExtensionAppDefinition) => {
                allApps.push({
                    id: appDef.id,
                    name: appDef.name,
                });
            });
        } catch (e) {
            logGenericCoreError(`Error loading ${fullUrl}`, e);
            continue;
        }
    }
    return allApps;
}