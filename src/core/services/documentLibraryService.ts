//{"AllowContentTypes":false,"BaseTemplate":101,"ContentTypesEnabled":false,"Description":"","Title":"Test1"}
// Request URL:
// https://8s2kdn.sharepoint.com/sites/appcatalog/SPFxExtensionsData/_api/web/lists
// Request Method:
// POST

import { SPFX_EXTENSIONS_FOLDER } from "../../utilities/constants";
import { getDigest } from "./digestService";

const existsError = `A list, survey, discussion board, or document library with the specified title already exists in this Web site.`
export async function createExtensionsDocumentLibrary(webUrl: string) {
    const dgst = await getDigest(webUrl);
    const response = await fetch(`${webUrl}/_api/web/lists`, {
        method: "POST",
        headers: {
            "Accept": "application/json;odata=nometadata",
            "Content-Type": "application/json",
            "X-RequestDigest": dgst
        },
        body: JSON.stringify({ 
            AllowContentTypes: false, 
            BaseTemplate: 101, 
            ContentTypesEnabled: false, 
            Description: "This folder contains extensions that are loaded by the SPFxExtensions application.", 
            Title: SPFX_EXTENSIONS_FOLDER,
            Hidden: true
         })
    });
    if (!response.ok) {
        const err = await response.json();
        if (err["odata-error"]?.message?.value?.indexOf(existsError) !== -1) {
            return true;
        }
        return false;
    }
    return true;
}

export async function getExtensionsDocumentLibrary(webUrl: string) {
    const response = await fetch(`${webUrl}/_api/web/lists/GetByTitle('${SPFX_EXTENSIONS_FOLDER}')`, {
        method: "GET",
        headers: {
            "Accept": "application/json;odata=nometadata",
        }
    });
    if (!response.ok) {
        return undefined;
    }
    return response.json();
}

//Request URL:
//https://8s2kdn.sharepoint.com/sites/appcatalog/SPFxExtensionsData/_api/web/lists/getByTitle('SPFxExtensions')/rootFolder/files('app.txt')
//Request Method:
//GET

// Request URL:
// https://8s2kdn.sharepoint.com/sites/appcatalog/SPFxExtensionsData/_api/web/lists/getByTitle('SPFxExtensions')/rootFolder/files('app.txt')/$value
// Request Method:
// POST