import type { SPFI } from "@pnp/sp";
import { logGenericCoreInfo } from "../../core/services/loggingService";
import { EXTENSION_APPS_FOLDER } from "../../utilities/constants";
import { getWebUrlFromSP } from "./pnpService";
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


export async function ensureSPFxExtensionsAppNestedPath(sp: SPFI, appName: string, nestedPath: string[]) {
    if (nestedPath.some(n => n.indexOf("/") > -1)) {
        throw new Error("Nested path cannot contain /");
    }
    await ensureSPFxExtensionsAppFolder(sp, appName);
    const webUrl = getWebUrlFromSP(sp);
    let baseFolder = sp.web.getFolderByServerRelativePath(`${EXTENSION_APPS_FOLDER}/${appName}`);
    let processingPath = "";
    for (const subPath of nestedPath) {
        processingPath = `${(processingPath ? `${processingPath}/` : ``)}${subPath}`;
        const subPathCheck = await baseFolder.folders();
        if (!subPathCheck.some((f) => f.Name.toLowerCase() === subPath.toLowerCase())) {
            logGenericCoreInfo(`Creating subfolder ${processingPath} in ${EXTENSION_APPS_FOLDER}/${appName} folder in ${webUrl}`);
            await baseFolder.addSubFolderUsingPath(subPath);
        }
        baseFolder = baseFolder.folders.getByUrl(subPath);
    }

}