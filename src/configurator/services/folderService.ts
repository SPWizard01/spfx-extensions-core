import type { SPFI } from "@pnp/sp";
import { EXTENSION_APPS_FOLDER } from "../../utilities/constants";
const listDescription = "This folder contains extensions that are loaded by the SPFxExtensions application.";

export function ensureSPFxExtensionsFolder(sp: SPFI) {
    return sp.web.lists.ensure(EXTENSION_APPS_FOLDER, listDescription, 101, false, { Hidden: true })
}

export async function ensureSPFxExtensionsAppFolder(sp: SPFI, appName: string) {
    await ensureSPFxExtensionsFolder(sp);
    const rootFolderQuery = sp.web.lists.getByTitle(EXTENSION_APPS_FOLDER).rootFolder;
    const exists = await getSPFxExtensionApps(sp);
    if (!exists.some((f) => f === appName)) {
        await rootFolderQuery.folders.addUsingPath(appName);
        exists.push(appName);
    }
    return exists.find((f) => f === appName)!;
}
const excludedFolders = ["Forms"];
export async function getSPFxExtensionApps(sp: SPFI) {
    await ensureSPFxExtensionsFolder(sp);
    const rootFolderQuery = sp.web.lists.getByTitle(EXTENSION_APPS_FOLDER).rootFolder;
    const apps = await rootFolderQuery.folders();
    return apps.filter((f) => !excludedFolders.includes(f.Name)).map((f) => f.Name);
}