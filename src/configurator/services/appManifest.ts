import type { SPFI } from "@pnp/sp";
import { logGenericCoreError, logGenericCoreInfo } from "../../core/services/loggingService";
import type { SPFxExtensionAppManifest } from "../../models/appCollectionManifest";
import { EMPTY_APP_MANIFEST, MANIFEST_NAME, SPFX_EXTENSIONS_FOLDER } from "../../utilities/constants";
import type { ApiCallResult } from "../models/apiCallResult";
import { addAppCollection } from "./appCollection";
import { getWebUrlFromSP } from "./pnpService";

export async function getAppManifest(sp: SPFI, appName: string) {
    const webUrl = getWebUrlFromSP(sp);
    const manifestQuery = sp.web.getFileByUrl(`${SPFX_EXTENSIONS_FOLDER}/${appName}/${MANIFEST_NAME}`);
    const fileExists = await manifestQuery.exists();
    const result: ApiCallResult<SPFxExtensionAppManifest> = {
        data: EMPTY_APP_MANIFEST,
        error: "",
        isError: false,
        warnings: [],
    }
    if (!fileExists) {
        await addAppCollection(sp, appName);
        await sp.web.lists.getByTitle(SPFX_EXTENSIONS_FOLDER).rootFolder.folders.getByUrl(appName).files.addUsingPath(MANIFEST_NAME, JSON.stringify(EMPTY_APP_MANIFEST));
        logGenericCoreInfo(`Created ${MANIFEST_NAME} in ${SPFX_EXTENSIONS_FOLDER}/${appName} folder in ${webUrl}`);
        return result;
    }
    try {
        const content = await manifestQuery.getBlob();
        const stringData = await content.text();
        const data = JSON.parse(stringData) as SPFxExtensionAppManifest;
        result.data = data;
        return result;
    } catch (error) {
        const msg = `Error while parsing ${MANIFEST_NAME} in ${SPFX_EXTENSIONS_FOLDER}/${appName} folder in ${webUrl}`;
        logGenericCoreError(msg, error);
        result.error = msg;
        result.isError = true;
        return result;
    }
}

export async function updateAppManifest(sp: SPFI, appName: string, manifest: SPFxExtensionAppManifest) {
    await getAppManifest(sp, appName);
    const manifestQuery = sp.web.getFileByUrl(`${SPFX_EXTENSIONS_FOLDER}/${appName}/${MANIFEST_NAME}`);
    try {
        await manifestQuery.setContent(JSON.stringify(manifest));
        return true;
    }
    catch (error) {
        const webUrl = getWebUrlFromSP(sp);
        logGenericCoreError(`Error while updating ${MANIFEST_NAME} in ${SPFX_EXTENSIONS_FOLDER}/${appName} folder in ${webUrl}`, error);
        return false;
    }
}
