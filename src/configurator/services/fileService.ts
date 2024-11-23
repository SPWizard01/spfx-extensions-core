import type { SPFI } from "@pnp/sp";
import { logGenericCoreError, logGenericCoreInfo } from "../../core/services/loggingService";
import type { SPFxExtensionAppManifest } from "../../models/appModel";
import { APPCOLLECTION_MANIFEST_NAME, EMPTY_APP_MANIFEST, EXTENSION_APPS_FOLDER, MANIFEST_NAME } from "../../utilities/constants";
import type { ApiCallResult } from "../models/apiCallResult";
import { addAppCollection, ensureAppCollectionNestedPath } from "./appCollection";
import { ensureSPFxExtensionsFolder } from "./folderService";
import { getWebUrlFromSP } from "./pnpService";


export interface FileContents {
    fileName: string;
    content: Uint8Array;
}


export async function parseUploadFiles(files: File[]): Promise<ApiCallResult<FileContents[]>> {
    const result: ApiCallResult<FileContents[]> = {
        data: [],
        warnings: [],
        error: "",
        isError: false,
    };

    // dist/somdir/manifest.txt
    const manifestFile = files.find((fl) => fl.path.toLowerCase().endsWith(MANIFEST_NAME));
    let basePathIdx = -1;
    let basePath = "/";
    if (!manifestFile) {
        result.warnings.push("No manifest.txt file found.");
        result.isError = false;
    } else {
        basePathIdx = manifestFile.path.lastIndexOf("/");
        basePath = manifestFile.path.substring(0, basePathIdx + 1);
    }

    for (const file of files) {
        if (file.length === 0) {
            continue;
        }
        const contentBuffer = await file.arrayBuffer();
        const content = new Uint8Array(contentBuffer);
        let fileName = file.path;
        // /dist/somefolder/somefile.txt
        const pathIdx = file.path.lastIndexOf("/");
        const path = pathIdx > -1 ? file.path.substring(0, pathIdx + 1) : "";
        let leafPath = "/";
        if (path) {
            const leafs = path.split("/").filter((leaf) => leaf.length > 0);
            const baseLeafs = basePath.split("/").filter((leaf) => leaf.length > 0);
            console.log(fileName, leafs, baseLeafs);
            leafs.forEach((leaf) => {
                if (baseLeafs.includes(leaf)) {
                    leafPath += `${leaf}/`;
                }
            });
        }
        fileName = fileName.replace(leafPath, "").replace(/^\./, "");
        result.data.push({ fileName, content });
    }


    let nonBasePathFiles: File[] = [];
    if (basePath !== "/") {
        nonBasePathFiles = files.filter((fl) => !fl.path.startsWith(basePath));
        if (nonBasePathFiles.length > 0) {
            result.warnings.push("Some files are outside of manifest.txt directory.");
            result.warnings.push(...nonBasePathFiles.map((file) => `File: ${file.relativePath}`));
        }
    }
    return result;
}

export async function addFiles(sp: SPFI, appName: string, fileContents: FileContents[]) {
    await addAppCollection(sp, appName);
    const webUrl = getWebUrlFromSP(sp);
    const result: ApiCallResult<string[]> = {
        data: [],
        error: "",
        isError: false,
        warnings: [],
    }
    for (const file of fileContents) {
        const pathIdxBeforeFile = file.fileName.lastIndexOf("/");
        const hasFolder = pathIdxBeforeFile > -1;
        const fileNameWithoutFolder = hasFolder ? file.fileName.substring(pathIdxBeforeFile + 1) : file.fileName;
        const subpathBeforeFile = file.fileName.substring(0, pathIdxBeforeFile);
        const fullPath = `${EXTENSION_APPS_FOLDER}/${appName}${(subpathBeforeFile ? `/${subpathBeforeFile}` : ``)}`;
        const folderQuery = sp.web.getFolderByServerRelativePath(fullPath);
        const ensuredFilePaths: string[] = [];
        if (hasFolder) {
            if (!ensuredFilePaths.includes(subpathBeforeFile)) {
                try {
                    await ensureAppCollectionNestedPath(sp, appName, subpathBeforeFile.split("/"));
                    ensuredFilePaths.push(subpathBeforeFile);
                }
                catch (error) {
                    result.error = `Error while creating ${subpathBeforeFile} in ${fullPath} folder in ${webUrl}. ${error}`;
                    result.isError = true;
                    return result;
                }
            }
        }
        try {
            await folderQuery.files.addUsingPath(fileNameWithoutFolder, new Blob([file.content]), { Overwrite: true });
            result.data.push(`${fileNameWithoutFolder} uploaded successfully`);
        }
        catch (error) {
            const msg = `Error while uploading ${fileNameWithoutFolder} in ${fullPath} folder in ${webUrl}`;
            logGenericCoreError(msg, error);
            result.error = msg;
            result.isError = true;
            return result;
        }

    }
    return result;
}

// export async function addFile(sp: SPFI, appName: string, fileContents: FileContents) {
//     await addAppCollection(sp, appName);
//     const webUrl = getWebUrlFromSP(sp);
//     const pathIdxBeforeFile = fileContents.fileName.lastIndexOf("/");
//     const hasFolder = pathIdxBeforeFile > -1;
//     const fileNameWithoutFolder = hasFolder ? fileContents.fileName.substring(pathIdxBeforeFile + 1) : fileContents.fileName;
//     const subpathBeforeFile = fileContents.fileName.substring(0, pathIdxBeforeFile);
//     const fullPath = `${EXTENSION_APPS_FOLDER}/${appName}${(subpathBeforeFile ? `/${subpathBeforeFile}` : ``)}`;
//     const folderQuery = sp.web.getFolderByServerRelativePath(fullPath);
//     if (hasFolder) {
//         await ensureAppCollectionNestedPath(sp, appName, subpathBeforeFile.split("/"));
//     }
//     try {
//         await folderQuery.files.addUsingPath(fileNameWithoutFolder, new Blob([fileContents.content]), { Overwrite: true });
//         return true;
//     }
//     catch (error) {
//         logGenericCoreError(`Error while uploading ${fileNameWithoutFolder} in ${fullPath} folder in ${webUrl}`, error);
//         return false;
//     }
// }