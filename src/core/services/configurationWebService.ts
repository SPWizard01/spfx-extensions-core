import type { ApiCallResult } from "../../configurator/models/apiCallResult";
import { SPFX_EXTENSIONS_DATA_SITE } from "../../utilities/constants";
import { getAppCatalogDigest, getAppCatalogUrlFromAPI } from "./appCatalogService";
import { addOrUpdateExtensionConfig, getExtensionConfigFromDB } from "./coreIdbService";
import { logGenericCoreError } from "./loggingService";

async function createWeb(webUrl: string) {
    const appCatalog = await getAppCatalogUrlFromAPI();
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

async function getWebData(): Promise<ApiCallResult<any>> {
    const appCatalog = await getAppCatalogUrlFromAPI();
    const appCatalogDigest = await getAppCatalogDigest();
    const response = await fetch(`${appCatalog}/_api/web/webs`, {
        method: "GET",
        headers: {
            "Accept": "application/json;odata=nometadata",
            "X-RequestDigest": appCatalogDigest
        }
    });
    if (!response.ok) {
        logGenericCoreError(`Failed to fetch data from ${appCatalog}/_api/web/webs`);
        return {
            data: [],
            isError: true,
            error: `Failed to fetch data from ${appCatalog}/_api/web/webs`,
            warnings: []
        }
    }
    const data = await response.json();
    return {
        data: data.value,
        isError: false,
        error: "",
        warnings: []
    }
}

async function getWebDataCached() {
    const appCatalogWebs = await getExtensionConfigFromDB("AppCatalogWebs");
    return appCatalogWebs?.Data ?? [];
}
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
    const hasExtensionWeb = webData.some((web: any) => web.ServerRelativeUrl.endsWith(SPFX_EXTENSIONS_DATA_SITE));
    if (!hasExtensionWeb) {
        const apiResponse = await getWebData();
        const apiDataHasExtensionWeb = apiResponse.data.some((web: any) => web.ServerRelativeUrl.endsWith(SPFX_EXTENSIONS_DATA_SITE));
        if (!apiResponse.isError && !apiDataHasExtensionWeb) {
            const result = await createWeb(SPFX_EXTENSIONS_DATA_SITE);
            apiResponse.data.push(result);
            await addOrUpdateExtensionConfig({ Title: "AppCatalogWebs", Data: apiResponse.data, date: "", expires: "" }, 240)
        }
        return apiResponse.data;
    }
    return webData;
}