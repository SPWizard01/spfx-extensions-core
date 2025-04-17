import type { IWebInfo } from "@pnp/sp/webs";
import type { SPFxExtensionUrlMapItem } from "../../models/appCollectionManifest";
import type { HubResultSitesResponse } from "../models/HubResultResponse";
import type { SiteUrlCollectionItem } from "../models/UrlCollectionMapItem";

export function spliceSites(copyItems: SPFxExtensionUrlMapItem[]) {
    const sitesToPush: SiteUrlCollectionItem[] = [];
    let siteIdx = copyItems.findIndex((s) => s.isRootWeb);
    while (siteIdx > -1) {
        const siteItem = copyItems.splice(siteIdx, 1)[0];
        let inSiteCollection = sitesToPush.find((s) => s.id === siteItem.id);
        if (!inSiteCollection) {
            inSiteCollection = {
                ...siteItem,
                webs: [siteItem],
            };
            sitesToPush.push(inSiteCollection);
        }
        const websToPush: SPFxExtensionUrlMapItem[] = spliceWebs(
            copyItems,
            siteItem.siteId
        );
        inSiteCollection.webs.push(
            ...websToPush.sort((a, b) => a.url.localeCompare(b.url))
        );
        siteIdx = copyItems.findIndex((s) => s.isRootWeb);
    }
    return sitesToPush;
}

export function spliceWebs(copyItems: SPFxExtensionUrlMapItem[], siteId: string) {
    const websToPush: SPFxExtensionUrlMapItem[] = [];
    let webIdx = copyItems.findIndex((s) => s.siteId === siteId);
    while (webIdx > -1) {
        const webItem = copyItems.splice(webIdx, 1)[0];
        websToPush.push(webItem);
        webIdx = copyItems.findIndex((s) => s.siteId === siteId);
    }
    return websToPush.sort((a, b) => a.url.localeCompare(b.url));
}

export function hubResponseToMapItem(responseItems: HubResultSitesResponse[]) {
    //sharepoint api does not expose a property which is saying that that web is a root web, so we will sort by the url of site collection
    //shortest url will be the root web of the site collection
    const groupedByCollection = Object.groupBy(responseItems, (item) => item.sharepointIds.siteId);
    const collectionKeys = Object.keys(groupedByCollection);
    const siteCollections: SPFxExtensionUrlMapItem[] = [];
    for (const collectionKey of collectionKeys) {
        const collection = groupedByCollection[collectionKey];
        if (!collection) continue;
        const sortedByUrl = collection.sort((a, b) => a.webUrl.localeCompare(b.webUrl));
        siteCollections.push({
            id: sortedByUrl[0].sharepointIds.webId,
            url: sortedByUrl[0].webUrl,
            siteId: sortedByUrl[0].sharepointIds.siteId,
            hubid: sortedByUrl[0].sharepointIds.hubSiteId,
            isHubRoot: sortedByUrl[0].sharepointIds.hubSiteId === sortedByUrl[0].sharepointIds.siteId,
            isRootWeb: true,
        })
    }

    const mapItems: SPFxExtensionUrlMapItem[] = responseItems.map((item) => {
        return {
            id: item.sharepointIds.webId,
            url: item.webUrl,
            siteId: item.sharepointIds.siteId,
            hubid: item.sharepointIds.hubSiteId,
            isHubRoot: item.sharepointIds.hubSiteId === item.sharepointIds.siteId,
            isRootWeb: siteCollections.some((s) => s.id === item.sharepointIds.webId),
            title: item.title,
            template: item.template.name,
        };
    });
    return mapItems;
}

export function webInfoToMapItem(webInfos: IWebInfo[], siteId: string, hubId: string): SPFxExtensionUrlMapItem[] {
    return webInfos.map((webInfo) => {
        return {
            id: webInfo.Id,
            url: webInfo.Url,
            siteId: siteId,
            hubid: hubId,
            isHubRoot: false,
            isRootWeb: false,
            title: webInfo.Title,
            template: webInfo.WebTemplate,
        };
    });
}