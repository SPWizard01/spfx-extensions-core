import { SPFX_EXTENSIONS_DATA_SITE } from "../../utilities/constants";
import { getAppCatalogDigest, getAppCatalogUrlData } from "./appCatalogService";
import { getExtensionConfig, addOrUpdateExtensionConfig } from "./coreIdbService";

async function createWeb(webUrl: string) {
    const appCatalog = await getAppCatalogUrlData();
    const appCatalogDigest = await getAppCatalogDigest();
    const response = await fetch(`${appCatalog}/_api/web/webs/add`, {
        method: "POST",
        headers: {
            "Accept": "application/json;odata=nometadata",
            "Content-Type": "application/json",
            "X-RequestDigest": appCatalogDigest
        },
        body: JSON.stringify({
            "parameters": {
                "Description": "Site that stores SPFxExtensions Data and global apps",
                "Language": 1033,
                "Title": "SPFxExtensions Data",
                "Url": webUrl,
                "UseSamePermissionsAsParentSite": true, 
                "WebTemplate": "STS"
            }
        })
    });
    if (!response.ok) {
        throw new Error(`Failed to create SPFxExtensionsData web in ${appCatalog}`);
    }
    const data = await response.json();
    return data;
}

async function getWebData() {
    const appCatalog = await getAppCatalogUrlData();
    const appCatalogDigest = await getAppCatalogDigest();
    const response = await fetch(`${appCatalog}/_api/web/webs`, {
        method: "GET",
        headers: {
            "Accept": "application/json;odata=nometadata",
            "X-RequestDigest": appCatalogDigest
        }
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch data from ${appCatalog}/_api/web/webs`);
    }
    const data = await response.json();
    return data.value;
}

async function getWebDataCached() {
    const appCatalogWebs = await getExtensionConfig("AppCatalogWebs");
    return appCatalogWebs?.Data ?? [];
}
//eslint-disable-next-line @typescript-eslint/no-explicit-any
let ensureWebDataPromise: Promise<any> | undefined;
export async function ensureSPFxWeb() {
    if (ensureWebDataPromise) {
        return ensureWebDataPromise;
    }
    ensureWebDataPromise = ensureWebDataInternal();
    return ensureWebDataPromise;

}
async function ensureWebDataInternal() {
    const webData = await getWebDataCached();
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasExtensionWeb = webData.some((web: any) => web.ServerRelativeUrl.endsWith(SPFX_EXTENSIONS_DATA_SITE));
    if (!hasExtensionWeb) {
        const apiData = await getWebData();
        const apiDataHasExtensionWeb = apiData.some((web: any) => web.ServerRelativeUrl.endsWith(SPFX_EXTENSIONS_DATA_SITE));
        if (!apiDataHasExtensionWeb) {
            const result = await createWeb(SPFX_EXTENSIONS_DATA_SITE);
            apiData.push(result);
            await addOrUpdateExtensionConfig({ Title: "AppCatalogWebs", Data: apiData, date: "", expires: "" }, 240)
        }
        return apiData;
    }
    return webData;
}