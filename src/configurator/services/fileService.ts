import type { SPFI } from "@pnp/sp";
import { logGenericCoreError, logGenericCoreInfo } from "../../core/services/loggingService";
import type { SPFxExtensionAppManifest } from "../../models/appModel";
import { APPCOLLECTION_MANIFEST_NAME, EMPTY_APP_MANIFEST, EXTENSION_APPS_FOLDER, MANIFEST_NAME } from "../../utilities/constants";
import { ensureSPFxExtensionsAppFolder, ensureSPFxExtensionsFolder } from "./folderService";

export async function ensurAppsTxt(sp: SPFI) {
    const appsQuery = sp.web.getFileByUrl(`${EXTENSION_APPS_FOLDER}/${APPCOLLECTION_MANIFEST_NAME}`);
    const webUrl = sp.web.toUrl().replace("/_api/web", "");
    const fileExists = await appsQuery.exists();
    if (!fileExists) {
        await ensureSPFxExtensionsFolder(sp);
        await sp.web.lists.getByTitle(EXTENSION_APPS_FOLDER).rootFolder.files.addUsingPath(APPCOLLECTION_MANIFEST_NAME, JSON.stringify([]));
        logGenericCoreInfo(`Created ${APPCOLLECTION_MANIFEST_NAME} in ${EXTENSION_APPS_FOLDER} folder in ${webUrl}`);
        return [];
    }
    try {
        const content = await appsQuery.getBlob();
        const stringData = await content.text();
        const data = JSON.parse(stringData) as string[];
        if (!Array.isArray(data) || data.length > 0 && typeof data[0] !== "string") {
            logGenericCoreError(`Invalid data inside ${APPCOLLECTION_MANIFEST_NAME} in ${EXTENSION_APPS_FOLDER} folder in ${webUrl}, it should be an array`);
            return undefined;
        }
        return data;
    } catch (error) {
        logGenericCoreError(`Error while parsing ${APPCOLLECTION_MANIFEST_NAME} in ${EXTENSION_APPS_FOLDER} folder in ${webUrl}`, error);
        return undefined;
    }
}

export async function ensureManifestTxt(sp: SPFI, appName: string) {
    const webUrl = sp.web.toUrl().replace("/_api/web", "");

    const manifestQuery = sp.web.getFileByUrl(`${EXTENSION_APPS_FOLDER}/${appName}/${MANIFEST_NAME}`);
    const fileExists = await manifestQuery.exists();
    if (!fileExists) {
        await ensureSPFxExtensionsAppFolder(sp, appName);
        await sp.web.lists.getByTitle(EXTENSION_APPS_FOLDER).rootFolder.folders.getByUrl(appName).files.addUsingPath(MANIFEST_NAME, JSON.stringify(EMPTY_APP_MANIFEST));
        logGenericCoreInfo(`Created ${MANIFEST_NAME} in ${EXTENSION_APPS_FOLDER}/${appName} folder in ${webUrl}`);
        return EMPTY_APP_MANIFEST;
    }
    try {
        const content = await manifestQuery.getBlob();
        const stringData = await content.text();
        const data = JSON.parse(stringData) as SPFxExtensionAppManifest;
        return data;
    } catch (error) {
        logGenericCoreError(`Error while parsing ${MANIFEST_NAME} in ${EXTENSION_APPS_FOLDER}/${appName} folder in ${webUrl}`, error);
        return undefined;
    }
}

export async function updateManifestTxt(sp: SPFI, appName: string, manifest: SPFxExtensionAppManifest) {
    await ensureManifestTxt(sp, appName);
    const webUrl = sp.web.toUrl().replace("/_api/web", "");
    const manifestQuery = sp.web.getFileByUrl(`${EXTENSION_APPS_FOLDER}/${appName}/${MANIFEST_NAME}`);
    try {
        await manifestQuery.setContent(JSON.stringify(manifest));
        return true;
    }
    catch (error) {
        logGenericCoreError(`Error while updating ${MANIFEST_NAME} in ${EXTENSION_APPS_FOLDER}/${appName} folder in ${webUrl}`, error);
        return false;
    }
}