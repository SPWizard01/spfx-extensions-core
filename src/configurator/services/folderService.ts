import type { SPFI } from "@pnp/sp";
import type { IFolder } from "@pnp/sp/folders";
import { SPFX_EXTENSIONS_FOLDER } from "../../utilities/constants";
import { configurationWeb } from "../runtimeStore";
const listDescription = "This folder contains extensions that are loaded by the SPFxExtensions application.";

export function ensureSPFxExtensionsFolder(sp: SPFI) {
    return sp.web.lists.ensure(SPFX_EXTENSIONS_FOLDER, listDescription, 101, false, { Hidden: true })
}

export async function deleteRootFolderRecursively(sp: SPFI, rootFolderName: string) {
    ////https://8s2kdn.sharepoint.com/sites/CommunicationNoDeletePolicy/_api/web/lists/getByTitle('SPFxExtensions')/items?$filter=(startswit(FileDirRef,'/sites/CommunicationNoDeletePolicy/SPFxExtensions/tests') and FSObjType eq 0)&$select=Id,Title,FileLeafRef,FileDirRef
    
    const relativePath = `${configurationWeb.ServerRelativeUrl}/${SPFX_EXTENSIONS_FOLDER}/${rootFolderName}`;
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