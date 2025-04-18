import type { IWebInfo } from "@pnp/sp/webs";
import type { SPFxExtensionUrlMapItem } from "../../models/appCollectionManifest";
import { EMPTY_GUID } from "../../utilities/constants";
import type { HubResultSitesResponse } from "../models/HubResultResponse";
import type { HubUrlCollectionItem, SiteUrlCollectionItem } from "../models/UrlCollectionMapItem";



export function spliceHub(defaultList: SPFxExtensionUrlMapItem[], hubId: string) {
    const relevantItems = [...defaultList.filter((item) => item.hubid === hubId)];
    if (relevantItems.length === 0) return undefined;
    const hubRootIdx = relevantItems.findIndex((s) => s.isHubRoot);
    const hubDefault = {
        hubid: hubId,
        id: hubId,
        isHubRoot: true,
        isRootWeb: true,
        siteId: hubId,
        url: hubId,
    }
    let hubRoot: HubUrlCollectionItem = {
        ...hubDefault,
        sites: [{
            ...hubDefault,
            webs: [hubDefault],
        }],
        webs: [],
    };
    if (hubRootIdx > -1) {
        const splicedRoot = relevantItems.splice(hubRootIdx, 1)[0];
        hubRoot = {
            ...splicedRoot,
            sites: [{
                ...splicedRoot,
                webs: [splicedRoot],
            }],
            webs: [],
        };
    }

    const hubSubWebsToPush: SPFxExtensionUrlMapItem[] = spliceWebs(
        relevantItems,
        hubRoot.siteId
    );
    const rootSite = hubRoot.sites.find((s) => s.id === hubRoot.id);
    if (rootSite) rootSite.webs.push(...hubSubWebsToPush);
    const hubSitesToPush: SiteUrlCollectionItem[] =
        spliceSites(relevantItems);
    hubRoot.sites.push(...hubSitesToPush);
    hubRoot.webs.push(...relevantItems);
    return hubRoot;
}


export function spliceHubs(defaultList: SPFxExtensionUrlMapItem[]) {
    const allGroupedByHub = Object.groupBy(defaultList, (item) => item.hubid);
    const nonEmptyHubKeys = Object.keys(allGroupedByHub).filter(
        (k) => k && k !== EMPTY_GUID
    );
    const hubResults: HubUrlCollectionItem[] = [];
    for (const hubId of nonEmptyHubKeys) {
        const hubItems = allGroupedByHub[hubId];
        if (!hubItems) continue;
        const splicedData = spliceHub(hubItems, hubId);
        if (!splicedData) continue;
        hubResults.push(splicedData);
    }
    return hubResults;
}

export function spliceGlobal(defaultList: SPFxExtensionUrlMapItem[]) {
    const allGroupedByHub = Object.groupBy(defaultList, (item) => item.hubid);
    const nonEmptyHubKeys = Object.keys(allGroupedByHub).filter(
        (k) => k && k !== EMPTY_GUID
    );
    const otherKeys = Object.keys(allGroupedByHub).filter(
        (k) => !k || k === EMPTY_GUID
    );
    const hubResults: HubUrlCollectionItem[] = [];
    for (const hubId of nonEmptyHubKeys) {
        const hubItems = allGroupedByHub[hubId];
        if (!hubItems) continue;
        const splicedData = spliceHub(hubItems, hubId);
        if (!splicedData) continue;
        hubResults.push(splicedData);
    }
    const siteResults: SiteUrlCollectionItem[] = [];
    const webResults: SPFxExtensionUrlMapItem[] = [];
    for (const otherKey of otherKeys) {
        const otherItems = allGroupedByHub[otherKey];
        if (!otherItems) continue;
        const allGroupedBySite = Object.groupBy(otherItems, (item) => item.siteId);
        const nonEmptySiteKeys = Object.keys(allGroupedBySite).filter(
            (k) => k && k !== EMPTY_GUID
        );
        const otherSiteKeys = Object.keys(allGroupedBySite).filter(
            (k) => !k || k === EMPTY_GUID
        );
        for (const siteKey of nonEmptySiteKeys) {
            const siteItems = allGroupedBySite[siteKey];
            if (!siteItems) continue;
            const splicedData = spliceSites(siteItems);
            if (!splicedData) continue;
            siteResults.push(...splicedData);
        }
        for (const webKey of otherSiteKeys) {
            const webItems = allGroupedBySite[webKey];
            if (!webItems) continue;
            const splicedData = spliceWebs(webItems, webKey);
            if (!splicedData) continue;
            webResults.push(...splicedData);
        }
    }
    return {
        hubs: hubResults,
        sites: siteResults,
        webs: webResults,
    };
}


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