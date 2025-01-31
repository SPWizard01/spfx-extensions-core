import type { SPFI } from "@pnp/sp";
import { logGenericCoreError, logGenericCoreInfo } from "../../core/services/loggingService";
import { APPCOLLECTION_MANIFEST_NAME, EMPTY_APP_MANIFEST, MANIFEST_NAME, SPFX_EXTENSIONS_FOLDER } from "../../utilities/constants";
import type { ApiCallResult } from "../models/apiCallResult";
import { allAppItems } from "../runtimeStore";
import { ensureSPFxExtensionsFolder } from "./folderService";
import { getWebUrlFromSP } from "./pnpService";
import { getAllAppItems } from "./renderedAppCollection";

const excludedFolders = ["Forms"];

export async function addAppCollection(sp: SPFI, collectionName: string) {
    await ensureSPFxExtensionsFolder(sp);
    const rootFolderQuery = sp.web.lists.getByTitle(SPFX_EXTENSIONS_FOLDER).rootFolder;
    const allAppCollectionsData = await getAllAppCollections(sp);
    const enabledAppsData = await getEnabledAppCollection(sp);
    if (!allAppCollectionsData.some((f) => f === collectionName)) {
        await rootFolderQuery.folders.addUsingPath(collectionName);
        allAppCollectionsData.push(collectionName);
    }
    allAppItems.value = await getAllAppItems(sp, allAppCollectionsData, enabledAppsData.data);
    return allAppItems.value.find((f) => f.name === collectionName)!;
}

export async function getAllAppCollections(sp: SPFI) {
    await ensureSPFxExtensionsFolder(sp);
    const rootFolderQuery = sp.web.lists.getByTitle(SPFX_EXTENSIONS_FOLDER).rootFolder;
    const apps = await rootFolderQuery.folders();
    return apps.filter((f) => !excludedFolders.includes(f.Name)).map((f) => f.Name);
}


export async function updateAppCollection(sp: SPFI, appCollection: string[]) {
    await getEnabledAppCollection(sp);
    const webUrl = getWebUrlFromSP(sp);
    const manifestQuery = sp.web.getFileByUrl(`${SPFX_EXTENSIONS_FOLDER}/${APPCOLLECTION_MANIFEST_NAME}`);
    try {
        await manifestQuery.setContent(JSON.stringify(appCollection));
        return true;
    }
    catch (error) {
        logGenericCoreError(`Error while updating ${APPCOLLECTION_MANIFEST_NAME} in ${SPFX_EXTENSIONS_FOLDER} folder in ${webUrl}`, error);
        return false;
    }
}

export async function getEnabledAppCollection(sp: SPFI) {
    const appsQuery = sp.web.getFileByUrl(`${SPFX_EXTENSIONS_FOLDER}/${APPCOLLECTION_MANIFEST_NAME}`);
    const webUrl = getWebUrlFromSP(sp);
    const fileExists = await appsQuery.exists();
    const result: ApiCallResult<string[]> = {
        data: [],
        error: "",
        isError: false,
        warnings: [],
    }
    if (!fileExists) {
        await ensureSPFxExtensionsFolder(sp);
        await sp.web.lists.getByTitle(SPFX_EXTENSIONS_FOLDER).rootFolder.files.addUsingPath(APPCOLLECTION_MANIFEST_NAME, JSON.stringify([]));
        logGenericCoreInfo(`Created ${APPCOLLECTION_MANIFEST_NAME} in ${SPFX_EXTENSIONS_FOLDER} folder in ${webUrl}`);
        return result;
    }
    try {
        const content = await appsQuery.getBlob();
        const stringData = await content.text();
        const data = JSON.parse(stringData) as string[];
        if (!Array.isArray(data) || data.length > 0 && typeof data[0] !== "string") {
            const msg = `Invalid data inside ${APPCOLLECTION_MANIFEST_NAME} in ${SPFX_EXTENSIONS_FOLDER} folder in ${webUrl}, it should be an array`;
            logGenericCoreError(msg);
            result.error = msg;
            result.isError = true;
            return result;
        }
        result.data = data;
        return result;
    } catch (error) {
        const msg = `Error while parsing ${APPCOLLECTION_MANIFEST_NAME} in ${SPFX_EXTENSIONS_FOLDER} folder in ${webUrl}`;
        logGenericCoreError(msg, error);
        result.error = msg;
        result.isError = true;
        return result;
    }
}

export async function ensureAppCollectionNestedPath(sp: SPFI, appName: string, nestedPath: string[]) {
    if (nestedPath.some(n => n.indexOf("/") > -1)) {
        throw new Error("Nested path cannot contain /");
    }
    await addAppCollection(sp, appName);
    const webUrl = getWebUrlFromSP(sp);
    let baseFolder = sp.web.getFolderByServerRelativePath(`${SPFX_EXTENSIONS_FOLDER}/${appName}`);
    let processingPath = "";
    for (const subPath of nestedPath) {
        processingPath = `${(processingPath ? `${processingPath}/` : ``)}${subPath}`;
        const subPathCheck = await baseFolder.folders();
        if (!subPathCheck.some((f) => f.Name.toLowerCase() === subPath.toLowerCase())) {
            logGenericCoreInfo(`Creating subfolder ${processingPath} in ${SPFX_EXTENSIONS_FOLDER}/${appName} folder in ${webUrl}`);
            await baseFolder.addSubFolderUsingPath(subPath);
        }
        baseFolder = baseFolder.folders.getByUrl(subPath);
    }

}