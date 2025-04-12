import { Caching } from "@pnp/queryable";
import type { SPFI } from "@pnp/sp";
import type { IWebInfo } from "@pnp/sp/webs";
import { logGenericCoreError } from "../../core/services/loggingService";
import type { SPFxExtensionUrlMapItem } from "../../models/appCollectionManifest";
import type { ApiCallResult } from "../models/apiCallResult";
import { getPnPSP } from "./pnpService";
export async function getAllWebInfos(sp: SPFI) {
    const thisWeb = await sp.using(Caching()).web();
    const allSubwebs = await sp.using(Caching()).web.webs();
    const recursiveWebs = await getWebInfoRecursive(allSubwebs);
    return [thisWeb, ...allSubwebs, ...recursiveWebs];
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
        const site = await sp.using(Caching()).site();
        const rootWeb = await sp.site.rootWeb();
        const webInfos = await getAllWebInfos(sp);
        webStructure.data.push({
            id: rootWeb.Id,
            siteId: site.Id,
            url: rootWeb.Url,
            isRootWeb: true,
        })
        webInfos.forEach(webInfo => {
            if (webInfo.Id !== rootWeb.Id) {
                webStructure.data.push({
                    id: webInfo.Id,
                    siteId: site.Id,
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