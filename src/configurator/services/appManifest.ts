import type { SPFI } from "@pnp/sp";
import { logGenericCoreError, logGenericCoreInfo } from "../../core/services/loggingService";
import type { SPFxExtensionAppManifest } from "../../models/appModel";
import { EMPTY_APP_MANIFEST, EXTENSION_APPS_FOLDER, MANIFEST_NAME } from "../../utilities/constants";
import type { ApiCallResult } from "../models/apiCallResult";
import { addAppCollection } from "./appCollection";
import { getWebUrlFromSP } from "./pnpService";

export async function getAppManifest(sp: SPFI, appName: string) {
    const webUrl = getWebUrlFromSP(sp);
    const manifestQuery = sp.web.getFileByUrl(`${EXTENSION_APPS_FOLDER}/${appName}/${MANIFEST_NAME}`);
    const fileExists = await manifestQuery.exists();
    const result: ApiCallResult<SPFxExtensionAppManifest> = {
        data: EMPTY_APP_MANIFEST,
        error: "",
        isError: false,
        warnings: [],
    }
    if (!fileExists) {
        await addAppCollection(sp, appName);
        await sp.web.lists.getByTitle(EXTENSION_APPS_FOLDER).rootFolder.folders.getByUrl(appName).files.addUsingPath(MANIFEST_NAME, JSON.stringify(EMPTY_APP_MANIFEST));
        logGenericCoreInfo(`Created ${MANIFEST_NAME} in ${EXTENSION_APPS_FOLDER}/${appName} folder in ${webUrl}`);
        return result;
    }
    try {
        const content = await manifestQuery.getBlob();
        const stringData = await content.text();
        const data = JSON.parse(stringData) as SPFxExtensionAppManifest;
        result.data = data;
        return result;
    } catch (error) {
        const msg = `Error while parsing ${MANIFEST_NAME} in ${EXTENSION_APPS_FOLDER}/${appName} folder in ${webUrl}`;
        logGenericCoreError(msg, error);
        result.error = msg;
        result.isError = true;
        return result;
    }
}

export async function updateAppManifest(sp: SPFI, appName: string, manifest: SPFxExtensionAppManifest) {
    await getAppManifest(sp, appName);
    const webUrl = getWebUrlFromSP(sp);
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
