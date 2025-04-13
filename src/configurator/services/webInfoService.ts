import { Caching } from "@pnp/queryable";
import type { SPFI } from "@pnp/sp";
import type { ISiteInfo } from "@pnp/sp/sites/types";
import type { IWebInfo } from "@pnp/sp/webs";
import { logGenericCoreError } from "../../core/services/loggingService";
import type { SPFxExtensionUrlMapItem } from "../../models/appCollectionManifest";
import type { ApiCallResult } from "../models/apiCallResult";
import { getPnPSP } from "./pnpService";
export async function getAllWebInfos(sp: SPFI) {
    const thisWeb = await getWeb(sp);
    if (thisWeb.isError) {
        logGenericCoreError("Unable to get web info", thisWeb.error);
        return [];
    }
    const allSubwebs = await getWebs(sp);
    if (allSubwebs.isError) {
        logGenericCoreError("Unable to get web info", allSubwebs.error);
        return [];
    }
    const recursiveWebs = await getWebInfoRecursive(allSubwebs.data);
    return [thisWeb.data, ...allSubwebs.data, ...recursiveWebs];
}
async function getWebInfoRecursive(webs: IWebInfo[]) {
    const webInfos = new Set<IWebInfo>();

    const promises = webs.map(async (element) => {
        try {
            const subWebInfos = await getPnPSP(element.Url).using(Caching()).web.webs();
            subWebInfos.forEach(info => webInfos.add(info));
            const sub = await getWebInfoRecursive(subWebInfos);
            sub.forEach(info => webInfos.add(info));
        } catch (error) {
            logGenericCoreError("Unable to get web info", element.Url, error);
        }
    });
    await Promise.all(promises);
    return webInfos;
}

export async function resolveWebStructure(webUrl: URL) {
    const sp = getPnPSP(webUrl.origin + webUrl.pathname);

    const webStructure: ApiCallResult<SPFxExtensionUrlMapItem[]> = {
        data: [],
        error: "",
        warnings: [],
        isError: false,
    }
    try {
        const site = await getSite(sp);
        if (site.isError) {
            webStructure.isError = true;
            webStructure.error = `${site.error}`
            logGenericCoreError("Unable to get site info", webUrl.href, site.error);
            return webStructure;
        }
        const rootWeb = await getWebRoot(sp);
        if (rootWeb.isError) {
            webStructure.isError = true;
            webStructure.error = `${rootWeb.error}`
            logGenericCoreError("Unable to get root web info", webUrl.href, rootWeb.error);
            return webStructure;
        }
        const webInfos = await getAllWebInfos(sp);
        webStructure.data.push({
            id: rootWeb.data.Id,
            siteId: site.data.Id,
            url: rootWeb.data.Url,
            isRootWeb: true,
        })
        webInfos.forEach(webInfo => {
            if (webInfo.Id !== rootWeb.data.Id) {
                webStructure.data.push({
                    id: webInfo.Id,
                    siteId: site.data.Id,
                    url: webInfo.Url,
                    isRootWeb: false,
                });
            }
        });
    }
    catch (error) {
        webStructure.isError = true;
        webStructure.error = `${error}`
        logGenericCoreError("Unable to get web structure", webUrl.href, error);
    }
    return webStructure;

}







export async function getWebRoot(sp: SPFI) {
    return fetchSPData(() => sp.site.using(Caching()).rootWeb(), {} as IWebInfo);
}

export async function getSite(sp: SPFI) {
    return fetchSPData(() => sp.using(Caching()).site(), {} as ISiteInfo);
}

export async function getWeb(sp: SPFI) {
    return fetchSPData(() => sp.using(Caching()).web(), {} as IWebInfo);
}

export async function getWebs(sp: SPFI) {
    return fetchSPData(() => sp.using(Caching()).web.webs(), [] as IWebInfo[]);
}

async function fetchSPData<T>(fetchFn: () => Promise<T>, defaultValue: T): Promise<ApiCallResult<T>> {
    const result: ApiCallResult<T> = {
        data: defaultValue,
        error: "",
        warnings: [],
        isError: false,
    };
    try {
        const data = await fetchFn();
        result.data = data;
    } catch (error) {
        result.isError = true;
        result.error = `${error}`;
    }
    return result;
}