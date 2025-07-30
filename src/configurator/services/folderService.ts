import { HttpRequestError } from "@pnp/queryable";
import type { SPFI } from "@pnp/sp";
import type { IFolder } from "@pnp/sp/folders";
import { SPFX_EXTENSIONS_FOLDER } from "../../utilities/constants";
const listDescription = "This folder contains extensions that are loaded by the SPFxExtensions application.";

export async function ensureSPFxExtensionsFolder(sp: SPFI) {
    try {
        await sp.web.lists.ensure(SPFX_EXTENSIONS_FOLDER, listDescription, 101, false, { Hidden: true })
    }
    catch (error) {
        if (error instanceof HttpRequestError) {
            //A list, survey, discussion board, or document library with the specified title already exists in this Web site
            if (error.message.includes("-2130575342")) {
                return;
            }
        }
        throw error;
    }
}

export async function deleteRootFolderRecursively(sp: SPFI, webRelativeUrl: string, rootFolderName: string) {
    ////https://8s2kdn.sharepoint.com/sites/CommunicationNoDeletePolicy/_api/web/lists/getByTitle('SPFxExtensions')/items?$filter=(startswit(FileDirRef,'/sites/CommunicationNoDeletePolicy/SPFxExtensions/tests') and FSObjType eq 0)&$select=Id,Title,FileLeafRef,FileDirRef

    const relativePath = `${webRelativeUrl}/${SPFX_EXTENSIONS_FOLDER}/${rootFolderName}`;
    const allFiles = await sp.web.lists.getByTitle(SPFX_EXTENSIONS_FOLDER).items.filter(`startswith(FileDirRef,'${relativePath}') and FSObjType eq 0`).select("Id")();
    if (allFiles.length > 0) {
        const [batch, execute] = sp.web.batched();
        allFiles.forEach((f) => {
            batch.lists.getByTitle(SPFX_EXTENSIONS_FOLDER).items.getById(f.Id).delete();
        });
        await execute();
    }
    const appCollectionFolder = sp.web.lists.getByTitle(SPFX_EXTENSIONS_FOLDER).rootFolder.folders.getByUrl(rootFolderName);
    await deleteFolders(appCollectionFolder);
}

async function deleteFolders(folder: IFolder) {
    const subFolders = await folder.folders();
    for (const subFolder of subFolders) {
        await deleteFolders(folder.folders.getByUrl(subFolder.Name));
    }
    await folder.delete();
}