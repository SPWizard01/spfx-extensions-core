import { SPFX_EXTENSIONS_DATA_SITE } from "../../utilities/constants";
import { addOrUpdateExtensionConfig, getExtensionConfigFromDB } from "./coreIdbService";
import { getDigest } from "./digestService";
import { logGenericCoreError } from "./loggingService";

let appCatalogPromiseResolver = (_data: string | PromiseLike<string>) => { };
let appCatalogUrlPromise: Promise<string> | undefined;

// const {promise:appCatalogUrlPromise, resolve:appCatalogPromiseResolver} = Promise.withResolvers<string>()


export async function getAppCatalogUrlFromAPI(baseUrl = "") {
    if (appCatalogUrlPromise) {
        return appCatalogUrlPromise;
    }
    appCatalogUrlPromise = new Promise<string>((resolve) => {
        appCatalogPromiseResolver = resolve;
    });
    
    try {
        const apiResponse = await fetch(`${baseUrl}/_api/SP_TenantSettings_Current`, {
            headers: {
                Accept: "application/json;odata=verbose",
            }
        })
        const responseData = await apiResponse.json()
        const url = responseData.d.CorporateCatalogUrl as string;
        appCatalogPromiseResolver(url);
    }
    catch (err) {
        logGenericCoreError("Error while getting app catalog url. Trying default /sites/appcatalog", err);
        const fallBackUrl = `${window.location.origin}/sites/appcatalog`;
        appCatalogPromiseResolver(fallBackUrl);
    }
    return appCatalogUrlPromise;
}

export async function getAppCatalogUrlCached(baseUrl = "") {
    const appCatalog = await getExtensionConfigFromDB("AppCatalogUrl");
    if (appCatalog?.Data) {
        return appCatalog.Data;
    }
    const url = await getAppCatalogUrlFromAPI(baseUrl);
    await addOrUpdateExtensionConfig({ Title: "AppCatalogUrl", Data: url, date: "", expires: "" }, 240);
    return url;
}

export async function getAppCatalogDigest(catalogSubWeb = "") {

    const appCatalogUrl = await getAppCatalogUrlFromAPI();
    const url = `${appCatalogUrl}${(catalogSubWeb ? `/${catalogSubWeb}` : ``)}`;
    return getDigest(url);
}

export const APP_CATALOG_URL = await getAppCatalogUrlCached();
/**
 * Points to root sharepoint location into app catalog `{APP_CATALOG_URL}/SPFxExtensionsData`
 */
export const SPFX_EXTENSIONS_SITE_URL = `${APP_CATALOG_URL}/${SPFX_EXTENSIONS_DATA_SITE}`;
