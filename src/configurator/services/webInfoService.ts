import type { SPFI } from "@pnp/sp";
import type { IWebInfo } from "@pnp/sp/webs";
import { logGenericCoreError } from "../../core/services/loggingService";
import { getPnPSP } from "./pnpService";

export async function getAllWebInfos(sp: SPFI) {
    const thisWeb = await sp.web();
    const allSubwebs = await sp.web.webs();
    const recursiveWebs = await getWebInfoRecursive(allSubwebs);
    return [thisWeb, ...allSubwebs, ...recursiveWebs];
}
async function getWebInfoRecursive(webs: IWebInfo[]) {
    const webInfos = new Set<IWebInfo>();

    const promises = webs.map(async (element) => {
        try {
            const subWebInfos = await getPnPSP(element.Url).web.webs();
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