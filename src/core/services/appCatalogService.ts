import { SPFxExtensionCore } from "../../utilities/constants";
import { addOrUpdateExtensionConfig, getExtensionConfig } from "./coreIdbService";

let appCatalogPromiseResolver = (_data: string | PromiseLike<string>) => { };
let appCatalogUrlPromise: Promise<string> | undefined;

export async function getAppCatalogUrlData(baseUrl = "") {
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
        console.error(SPFxExtensionCore, "Error while getting app catalog url. Trying default /sites/appcatalog", err);
        const fallBackUrl = `${window.location.origin}/sites/appcatalog`;
        appCatalogPromiseResolver(fallBackUrl);
    }
    return appCatalogUrlPromise;
}

export async function getAppCatalogUrlCached(baseUrl = "") {
    const appCatalog = await getExtensionConfig("AppCatalogUrl");
    if (appCatalog?.Data) {
        return appCatalog.Data;
    }
    const url = await getAppCatalogUrlData(baseUrl);
    await addOrUpdateExtensionConfig({ Title: "AppCatalogUrl", Data: url, date: "", expires: "" }, 240);
    return url;
}

export async function getAppCatalogDigest(catalogSubWeb = "") {
    const appCatalogUrl = await getAppCatalogUrlData();
    const req = await fetch(
        `${appCatalogUrl}${(catalogSubWeb ? `/${catalogSubWeb}` : ``)}/_api/contextinfo`,
        {
            method: "POST",
            headers: {
                Accept: "application/json;odata=verbose",
                "Content-Type": "application/json",
            },
        }
    );
    if (req.status === 200) {
        const data = await req.json();
        return data.d.GetContextWebInformation.FormDigestValue;
    }
    return "";
}