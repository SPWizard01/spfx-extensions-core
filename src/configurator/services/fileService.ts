import type { SPFI } from "@pnp/sp";
import { logGenericCoreError, logGenericCoreInfo } from "../../core/services/loggingService";
import type { SPFxExtensionAppManifest } from "../../models/appModel";
import { APPCOLLECTION_MANIFEST_NAME, EMPTY_APP_MANIFEST, EXTENSION_APPS_FOLDER, MANIFEST_NAME } from "../../utilities/constants";
import { ensureSPFxExtensionsAppFolder, ensureSPFxExtensionsAppNestedPath, ensureSPFxExtensionsFolder } from "./folderService";
import { getWebUrlFromSP } from "./pnpService";


export interface FileContents {
    fileName: string;
    content: Uint8Array;
}

export interface FileContentsResult {
    files: FileContents[];
    warnings: string[];
    error: string;
    isError: boolean;
}

export async function ensurAppsTxt(sp: SPFI) {
    const appsQuery = sp.web.getFileByUrl(`${EXTENSION_APPS_FOLDER}/${APPCOLLECTION_MANIFEST_NAME}`);
    const webUrl = getWebUrlFromSP(sp);
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
    const webUrl = getWebUrlFromSP(sp);

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

export async function getFileContents(files: File[]): Promise<FileContentsResult> {
    const result: FileContentsResult = {
        files: [],
        warnings: [],
        error: "",
        isError: false,
    };

    // dist/somdir/manifest.txt
    const manifestFile = files.find((fl) => fl.path.toLowerCase().endsWith(MANIFEST_NAME));

    if (!manifestFile) {
        result.error = "No manifest.txt file found.";
        result.isError = true;
        return result;
    }
    const basePathIdx = manifestFile.path.lastIndexOf("/");
    let basePath = "";
    if (basePathIdx > -1) {
        //dist/somdir/
        basePath = manifestFile.path.substring(0, basePathIdx + 1);
    }
    let nonBasePathFiles: File[] = [];
    let basePathFiles = [...files];
    if (basePath) {
        nonBasePathFiles = files.filter((fl) => !fl.path.startsWith(basePath));
        basePathFiles = files.filter((fl) => fl.path.startsWith(basePath));
        if (nonBasePathFiles.length > 0) {
            result.warnings.push("Some files are outside of manifest.txt directory.");
            result.warnings.push(...nonBasePathFiles.map((file) => `File: ${file.path}`));
        }
    }
    for (const file of basePathFiles) {
        if (file.length === 0) {
            continue;
        }
        const contentBuffer = await file.arrayBuffer();
        const content = new Uint8Array(contentBuffer);
        const fileName = file.path.substring(basePath.length);
        result.files.push({ fileName, content });
    }
    for (const file of nonBasePathFiles) {
        if (file.length === 0) {
            continue;
        }
        const contentBuffer = await file.arrayBuffer();
        const content = new Uint8Array(contentBuffer);
        const fileName = file.path;
        result.files.push({ fileName, content });
    }
    // basePathFiles.forEach((name) => {
    //     const content = unzippedFiles[name];
    //     const fileName = name.substring(basePath.length);
    //     if (content.length > 0) {
    //         result.files.push({ fileName, content });
    //     }
    // });
    return result;
}

export async function addFile(sp: SPFI, appName: string, fileName: string, content: Uint8Array) {
    await ensureSPFxExtensionsAppFolder(sp, appName);
    const webUrl = getWebUrlFromSP(sp);
    const pathIdxBeforeFile = fileName.lastIndexOf("/");
    const hasFolder = pathIdxBeforeFile > -1;
    const fileNameWithoutFolder = hasFolder ? fileName.substring(pathIdxBeforeFile + 1) : fileName;
    const subpathBeforeFile = fileName.substring(0, pathIdxBeforeFile);
    const fullPath = `${EXTENSION_APPS_FOLDER}/${appName}${(subpathBeforeFile ? `/${subpathBeforeFile}` : ``)}`;
    const folderQuery = sp.web.getFolderByServerRelativePath(fullPath);
    if (hasFolder) {
        await ensureSPFxExtensionsAppNestedPath(sp, appName, subpathBeforeFile.split("/"));
    }
    try {
        await folderQuery.files.addUsingPath(fileNameWithoutFolder, new Blob([content]), { Overwrite: true });
        return true;
    }
    catch (error) {
        logGenericCoreError(`Error while uploading ${fileNameWithoutFolder} in ${fullPath} folder in ${webUrl}`, error);
        return false;
    }
}